import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, X, Upload } from 'lucide-react';
import api, { getImageUrl } from '../../api/client';
import './Admin.css';

// Las botellas artesanales son PRODUCTOS de la categoría "botellas-artesanales"
const BOTTLE_CATEGORY_SLUG = 'botellas-artesanales';

interface ProductImage {
  id?: string;
  url: string;
  isPrimary: boolean;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  volume?: string;
  alcoholContent?: number;  // Grados de alcohol
  agaveType?: string;  // Usamos para Material/Técnica
  region?: string;
  images?: ProductImage[];
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Bottles() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [bottleCategoryId, setBottleCategoryId] = useState<string | null>(null);

  // Obtener categoría de botellas
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        // Usar endpoint público de categorías
        const { data } = await api.get('/categories');
        const bottleCategory = data.categories?.find(
          (cat: Category) => cat.slug === BOTTLE_CATEGORY_SLUG
        );
        if (bottleCategory) {
          setBottleCategoryId(bottleCategory.id);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategory();
  }, []);

  // Obtener productos de botellas
  const fetchProducts = async () => {
    if (!bottleCategoryId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/products?category=${bottleCategoryId}&search=${search}`);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching bottles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bottleCategoryId) {
      fetchProducts();
    }
  }, [bottleCategoryId, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta botella?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  // Mensaje si no existe la categoría
  if (!bottleCategoryId && !loading) {
    return (
      <div className="admin-page">
        <div className="page-header">
          <h1>Botellas Artesanales</h1>
        </div>
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <Package size={48} />
          <p>Categoría "botellas-artesanales" no encontrada</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            Crea una categoría con slug <code>botellas-artesanales</code> en Categorías.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Botellas Artesanales</h1>
        <button className="btn-primary" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
          <Plus size={18} /> Nueva Botella
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar botellas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Material</th>
              <th>Capacidad</th>
              <th>Alcohol</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>
                  <div className="item-image">
                    {product.images?.[0] ? (
                      <img src={getImageUrl(product.images[0].url)} alt={product.name} />
                    ) : (
                      <div className="no-image"><Package size={24} /></div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="item-name">{product.name}</div>
                  <div className="item-desc">{product.description?.substring(0, 40)}...</div>
                </td>
                <td>{product.agaveType || '-'}</td>
                <td>{product.volume || '-'}</td>
                <td>{product.alcoholContent ? `${product.alcoholContent}°` : '-'}</td>
                <td className="price-cell">{formatCurrency(product.price)}</td>
                <td>
                  <span className={`stock-badge ${product.stock <= 5 ? 'low' : ''}`}>
                    {product.stock}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                    {product.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => { setEditingProduct(product); setShowModal(true); }}>
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDelete(product.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="loading-state">Cargando...</div>}
        {!loading && products.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <p>No hay botellas registradas</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Agregar primera botella
            </button>
          </div>
        )}
      </div>

      {showModal && bottleCategoryId && (
        <BottleModal
          product={editingProduct}
          categoryId={bottleCategoryId}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchProducts(); }}
        />
      )}
    </div>
  );
}

interface BottleModalProps {
  product: Product | null;
  categoryId: string;
  onClose: () => void;
  onSave: () => void;
}

function BottleModal({ product, categoryId, onClose, onSave }: BottleModalProps) {
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    price: product?.price || 0,
    comparePrice: product?.comparePrice || 0,
    stock: product?.stock || 1,
    isActive: product?.isActive !== false,
    isFeatured: product?.isFeatured || false,
    volume: product?.volume || '',
    alcoholContent: product?.alcoholContent || '',  // Grados de alcohol
    agaveType: product?.agaveType || '',  // Material/Técnica
    region: product?.region || ''
  });
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const { data } = await api.post('/admin/products/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setImages(prev => [...prev, { url: data.url, isPrimary: prev.length === 0 }]);
      } catch (err) {
        alert('Error subiendo imagen');
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
    setLoading(true);
    try {
      // Generar SKU automático si está vacío
      const sku = form.sku || `BOT-${Date.now().toString(36).toUpperCase()}`;
      
      const payload = {
        ...form,
        sku,
        alcoholContent: form.alcoholContent ? parseFloat(form.alcoholContent as string) : null,
        images,
        categoryId  // Siempre usar la categoría de botellas
      };
      
      if (product) {
        await api.put(`/admin/products/${product.id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al guardar');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Editar Botella' : 'Nueva Botella Artesanal'}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Nombre *</label>
              <input 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="Ej: Botella Huichol Venado Azul"
                required 
              />
            </div>
            
            <div className="form-group">
              <label>SKU</label>
              <input 
                value={form.sku} 
                onChange={e => setForm({...form, sku: e.target.value})} 
                placeholder="Auto-generado si vacío"
              />
            </div>
            
            <div className="form-group">
              <label>Material / Técnica</label>
              <select value={form.agaveType} onChange={e => setForm({...form, agaveType: e.target.value})}>
                <option value="">Seleccionar...</option>
                <option value="Chaquira Huichol">Chaquira Huichol</option>
                <option value="Vidrio Soplado">Vidrio Soplado</option>
                <option value="Barro Negro">Barro Negro</option>
                <option value="Barro Rojo">Barro Rojo</option>
                <option value="Cerámica">Cerámica</option>
                <option value="Talavera">Talavera</option>
                <option value="Vidrio Reciclado">Vidrio Reciclado</option>
                <option value="Cristal">Cristal</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Capacidad</label>
              <select value={form.volume} onChange={e => setForm({...form, volume: e.target.value})}>
                <option value="">Seleccionar...</option>
                <option value="250ml">250ml</option>
                <option value="500ml">500ml</option>
                <option value="750ml">750ml</option>
                <option value="1L">1 Litro</option>
                <option value="1.5L">1.5 Litros</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Grados de Alcohol</label>
              <input 
                type="number" 
                step="0.1" 
                min="0"
                max="100"
                value={form.alcoholContent} 
                onChange={e => setForm({...form, alcoholContent: e.target.value})} 
                placeholder="37, 46, 55..."
              />
            </div>
            
            <div className="form-group">
              <label>Región / Origen</label>
              <input 
                value={form.region} 
                onChange={e => setForm({...form, region: e.target.value})} 
                placeholder="Ej: Oaxaca, Jalisco, Nayarit"
              />
            </div>
            
            <div className="form-group">
              <label>Precio *</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                value={form.price} 
                onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} 
                placeholder="0.00"
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Precio Comparación</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                value={form.comparePrice || ''} 
                onChange={e => setForm({...form, comparePrice: parseFloat(e.target.value) || 0})} 
                placeholder="Precio anterior (tachado)"
              />
            </div>
            
            <div className="form-group">
              <label>Stock Disponible *</label>
              <input 
                type="number" 
                min="0"
                value={form.stock} 
                onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})} 
                required 
              />
            </div>
            
            <div className="form-group full-width">
              <label>Descripción</label>
              <textarea 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
                rows={3}
                placeholder="Describe la botella artesanal, su origen, técnica de elaboración, simbolismo, etc."
              />
            </div>
            
            {/* Imágenes Múltiples */}
            <div className="form-group full-width">
              <label>Imágenes del Producto</label>
              <div className="image-upload">
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  id="bottle-images"
                  style={{ display: 'none' }}
                />
                <label htmlFor="bottle-images" className="btn-upload">
                  <Upload size={18} /> {uploading ? 'Subiendo...' : 'Subir Imágenes'}
                </label>
                
                {images.length > 0 && (
                  <div className="images-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                    gap: '0.5rem',
                    marginTop: '1rem'
                  }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ 
                        position: 'relative',
                        border: img.isPrimary ? '2px solid #D4AF37' : '1px solid #333',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <img src={getImageUrl(img.url)} alt="" style={{ 
                          width: '100%', 
                          height: '80px', 
                          objectFit: 'cover' 
                        }} />
                        <div style={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          display: 'flex',
                          background: 'rgba(0,0,0,0.7)'
                        }}>
                          <button 
                            type="button" 
                            onClick={() => setPrimaryImage(idx)}
                            style={{ 
                              flex: 1, 
                              background: 'none', 
                              border: 'none', 
                              color: img.isPrimary ? '#D4AF37' : '#fff',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title="Hacer principal"
                          >
                            {img.isPrimary ? '★' : '☆'}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => removeImage(idx)}
                            style={{ 
                              flex: 1, 
                              background: 'none', 
                              border: 'none', 
                              color: '#ff6b6b',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={form.isActive} 
                  onChange={e => setForm({...form, isActive: e.target.checked})} 
                />
                Activa (visible en tienda)
              </label>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={form.isFeatured} 
                  onChange={e => setForm({...form, isFeatured: e.target.checked})} 
                />
                Destacado
              </label>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
