import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export default function Users() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data.users || [];
    }
  });

  const toggleRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => 
      api.put(`/admin/users/${id}`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const filtered = users.filter((u: any) => 
    u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Usuarios</h1>
      </div>

      <div className="filters-bar">
        <input 
          type="text" 
          placeholder="Buscar usuarios..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {isLoading ? <p>Cargando...</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Registrado</th>
              <th>Pedidos</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user: any) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <div className="avatar">{user.firstName?.[0] || 'U'}</div>
                    <span>{user.firstName} {user.lastName}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>{user.orders?.length || 0}</td>
                <td>
                  <button 
                    className={`role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}
                    onClick={() => toggleRoleMutation.mutate({ 
                      id: user.id, 
                      role: user.role === 'admin' ? 'customer' : 'admin' 
                    })}
                  >
                    {user.role === 'admin' ? '👑 Admin' : '👤 Cliente'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
