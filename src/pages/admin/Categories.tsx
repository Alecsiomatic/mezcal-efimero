import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export default function Categories() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/admin/categories');
      return data.categories || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: (cat: any) => editing?.id 
      ? api.put(`/admin/categories/${editing.id}`, cat)
      : api.post('/admin/categories', cat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowModal(false);
      setEditing(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    saveMutation.mutate({
      name: form.get('name'),
      slug: form.get('slug'),
      description: form.get('description')
    });
  };

  const filtered = categories.filter((c: any) => 
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Categorias</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          + Nueva Categoria
        </button>
      </div>

      <div className="filters-bar">
        <input 
          type="text" 
          placeholder="Buscar categorias..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {isLoading ? <p>Cargando...</p> : (
        <div className="categories-grid">
          {filtered.map((cat: any) => (
            <div key={cat.id} className="category-card">
              <h3>{cat.name}</h3>
              <p className="slug">{cat.slug}</p>
              {cat.description && <p>{cat.description}</p>}
              <div className="card-actions">
                <button onClick={() => { setEditing(cat); setShowModal(true); }}>Editar</button>
                <button className="danger" onClick={() => deleteMutation.mutate(cat.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Editar Categoria' : 'Nueva Categoria'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input name="name" defaultValue={editing?.name} required />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input name="slug" defaultValue={editing?.slug} required />
              </div>
              <div className="form-group">
                <label>Descripcion</label>
                <textarea name="description" defaultValue={editing?.description} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
