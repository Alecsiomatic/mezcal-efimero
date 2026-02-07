import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Image, Upload } from 'lucide-react';
import api, { getImageUrl } from '../../api/client';

interface ProductImage {
  id?: string;
  url: string;
  isPrimary: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  volume: string;
  alcoholContent: number;
  agaveType: string;
  region: string;
  tastingNotes: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category?: Category;
  images: ProductImage[];
}

interface ProductFormData {
  name: string;
  sku: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number | string;
  comparePrice: number | string;
  stock: number | string;
  volume: string;
  alcoholContent: number | string;
  agaveType: string;
  region: string;
  tastingNotes: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Excluir botellas artesanales - tienen su propio panel
const EXCLUDE_CATEGORY_SLUG = 'botellas-artesanales';

export default function Products() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      const { data } = await api.get(`/admin/products?search=${search}&excludeCategory=${EXCLUDE_CATEGORY_SLUG}`);
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Productos</h1>
        <button className="btn-primary" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? <div className="loading">Cargando...</div> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Producto</th>
                <th>SKU</th>
                <th>Alcohol</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.products?.map((product: Product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-thumb">
                      {product.images?.[0] ? (
                        <img src={getImageUrl(product.images[0].url)} alt={product.name} />
                      ) : (
                        <div className="no-image"><Image size={20} /></div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="product-info">
                      <span className="product-name">{product.name}</span>
                      <span className="product-category">{product.category?.name || 'Sin categoría'}</span>
                    </div>
                  </td>
                  <td><code>{product.sku}</code></td>
                  <td>{product.alcoholContent ? `${product.alcoholContent}°` : '-'}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>
                    <span className={`stock-badge ${product.stock <= 5 ? 'low' : ''}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => { setEditingProduct(product); setShowModal(true); }}>
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => {
                          if (confirm('¿Eliminar este producto?')) {
                            deleteMutation.mutate(product.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.products?.length === 0 && (
            <div className="empty-state">No hay productos</div>
          )}
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onSave={() => { 
            setShowModal(false); 
            setEditingProduct(null);
            queryClient.invalidateQueries({ queryKey: ['admin-products'] }); 
          }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: { 
  product: Product | null; 
  onClose: () => void; 
  onSave: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>({
    name: product?.name || '',
    sku: product?.sku || '',
    slug: product?.slug || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    price: product?.price || '',
    comparePrice: product?.comparePrice || '',
    stock: product?.stock ?? 10,
    volume: product?.volume || '750ml',
    alcoholContent: product?.alcoholContent || '',
    agaveType: product?.agaveType || '',
    region: product?.region || 'San Luis Potosí',
    tastingNotes: product?.tastingNotes || '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    categoryId: product?.categoryId || ''
  });
  
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get('/admin/categories');
      // Excluir la categoría de botellas del dropdown (tienen su propio panel)
      return (data.categories as Category[]).filter(cat => cat.slug !== EXCLUDE_CATEGORY_SLUG);
    }
  });

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: !product ? generateSlug(name) : prev.slug
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const { data } = await api.post('/products/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setImages(prev => [...prev, { url: data.url, isPrimary: prev.length === 0 }]);
      } catch (err) {
        setError('Error al subir imagen');
      }
    }
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      if (updated.length > 0 && !updated.some(img => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const setPrimaryImage = (idx: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        price: parseFloat(form.price as string) || 0,
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice as string) : null,
        stock: parseInt(form.stock as string) || 0,
        alcoholContent: form.alcoholContent ? parseFloat(form.alcoholContent as string) : null,
        categoryId: form.categoryId || null,
        images
      };

      if (product) {
        await api.put(`/products/admin/${product.id}`, payload);
      } else {
        await api.post('/products/admin', payload);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar producto');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Información básica */}
            <div className="form-group">
              <label>Nombre *</label>
              <input 
                value={form.name} 
                onChange={(e) => handleNameChange(e.target.value)} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>SKU *</label>
              <input 
                value={form.sku} 
                onChange={(e) => setForm({...form, sku: e.target.value})} 
                required 
                placeholder="EF-XXX-00"
              />
            </div>
            
            <div className="form-group">
              <label>Slug</label>
              <input 
                value={form.slug} 
                onChange={(e) => setForm({...form, slug: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label>Categoría</label>
              <select 
                value={form.categoryId} 
                onChange={(e) => setForm({...form, categoryId: e.target.value})}
              >
                <option value="">Seleccionar...</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Precios */}
            <div className="form-group">
              <label>Precio *</label>
              <input 
                type="number" 
                step="0.01" 
                value={form.price} 
                onChange={(e) => setForm({...form, price: e.target.value})} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Precio Comparación</label>
              <input 
                type="number" 
                step="0.01" 
                value={form.comparePrice} 
                onChange={(e) => setForm({...form, comparePrice: e.target.value})} 
                placeholder="Precio tachado"
              />
            </div>
            
            <div className="form-group">
              <label>Stock</label>
              <input 
                type="number" 
                value={form.stock} 
                onChange={(e) => setForm({...form, stock: e.target.value})} 
              />
            </div>

            {/* Detalles del mezcal */}
            <div className="form-group">
              <label>Volumen</label>
              <input 
                value={form.volume} 
                onChange={(e) => setForm({...form, volume: e.target.value})} 
                placeholder="750ml"
              />
            </div>
            
            <div className="form-group">
              <label>Grados de Alcohol</label>
              <input 
                type="number" 
                step="0.1" 
                value={form.alcoholContent} 
                onChange={(e) => setForm({...form, alcoholContent: e.target.value})} 
                placeholder="40"
              />
            </div>
            
            <div className="form-group">
              <label>Tipo de Agave</label>
              <input 
                value={form.agaveType} 
                onChange={(e) => setForm({...form, agaveType: e.target.value})} 
                placeholder="Salmiana"
              />
            </div>
            
            <div className="form-group">
              <label>Región</label>
              <input 
                value={form.region} 
                onChange={(e) => setForm({...form, region: e.target.value})} 
              />
            </div>

            {/* Descripciones */}
            <div className="form-group full-width">
              <label>Descripción Corta</label>
              <input 
                value={form.shortDescription} 
                onChange={(e) => setForm({...form, shortDescription: e.target.value})} 
                placeholder="Resumen para listados"
              />
            </div>
            
            <div className="form-group full-width">
              <label>Descripción Completa</label>
              <textarea 
                value={form.description} 
                onChange={(e) => setForm({...form, description: e.target.value})} 
                rows={3}
              />
            </div>
            
            <div className="form-group full-width">
              <label>Notas de Cata</label>
              <textarea 
                value={form.tastingNotes} 
                onChange={(e) => setForm({...form, tastingNotes: e.target.value})} 
                rows={2}
                placeholder="Ahumado, notas herbales, final largo..."
              />
            </div>

            {/* Imágenes */}
            <div className="form-group full-width">
              <label>Imágenes del Producto</label>
              <div className="image-upload-section">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  id="product-images"
                  style={{ display: 'none' }}
                />
                <label htmlFor="product-images" className="btn-upload">
                  <Upload size={18} />
                  {uploading ? 'Subiendo...' : 'Subir Imágenes'}
                </label>

                {images.length > 0 && (
                  <div className="image-preview-grid">
                    {images.map((img, idx) => (
                      <div key={idx} className={`image-preview-item ${img.isPrimary ? 'primary' : ''}`}>
                        <img src={getImageUrl(img.url)} alt="" />
                        <div className="image-actions">
                          <button type="button" onClick={() => setPrimaryImage(idx)} title="Hacer principal">
                            {img.isPrimary ? '★' : '☆'}
                          </button>
                          <button type="button" onClick={() => removeImage(idx)} title="Eliminar">
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Opciones */}
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={form.isActive} 
                  onChange={(e) => setForm({...form, isActive: e.target.checked})} 
                />
                Producto Activo
              </label>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={form.isFeatured} 
                  onChange={(e) => setForm({...form, isFeatured: e.target.checked})} 
                />
                Producto Destacado
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
