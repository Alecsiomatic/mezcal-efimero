import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

export default function Coupons() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data } = await api.get('/admin/coupons');
      return data.coupons || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: (coupon: any) => editing?.id 
      ? api.put(`/admin/coupons/${editing.id}`, coupon)
      : api.post('/admin/coupons', coupon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setShowModal(false);
      setEditing(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] })
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    saveMutation.mutate({
      code: form.get('code'),
      discountType: form.get('discountType'),
      discountValue: parseFloat(form.get('discountValue') as string),
      minPurchase: parseFloat(form.get('minPurchase') as string) || 0,
      maxUses: parseInt(form.get('maxUses') as string) || null,
      expiresAt: form.get('expiresAt') || null,
      isActive: true
    });
  };

  const filtered = coupons.filter((c: any) => 
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Cupones</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          + Nuevo Cupon
        </button>
      </div>

      <div className="filters-bar">
        <input 
          type="text" 
          placeholder="Buscar cupones..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {isLoading ? <p>Cargando...</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Descuento</th>
              <th>Min. Compra</th>
              <th>Usos</th>
              <th>Expira</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((coupon: any) => (
              <tr key={coupon.id}>
                <td><strong>{coupon.code}</strong></td>
                <td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}</td>
                <td>${coupon.minPurchase || 0}</td>
                <td>{coupon.usedCount || 0} / {coupon.maxUses || ''}</td>
                <td>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Sin fecha'}</td>
                <td><span className={`status ${coupon.isActive ? 'active' : 'inactive'}`}>{coupon.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button onClick={() => { setEditing(coupon); setShowModal(true); }}>Editar</button>
                  <button className="danger" onClick={() => deleteMutation.mutate(coupon.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Editar Cupon' : 'Nuevo Cupon'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Codigo</label>
                  <input name="code" defaultValue={editing?.code} required style={{textTransform: 'uppercase'}} />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select name="discountType" defaultValue={editing?.discountType || 'percentage'}>
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed">Monto Fijo</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Valor</label>
                  <input type="number" name="discountValue" defaultValue={editing?.discountValue} required />
                </div>
                <div className="form-group">
                  <label>Compra Minima</label>
                  <input type="number" name="minPurchase" defaultValue={editing?.minPurchase} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Usos Maximos</label>
                  <input type="number" name="maxUses" defaultValue={editing?.maxUses} placeholder="Sin limite" />
                </div>
                <div className="form-group">
                  <label>Expira</label>
                  <input type="date" name="expiresAt" defaultValue={editing?.expiresAt?.split('T')[0]} />
                </div>
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
