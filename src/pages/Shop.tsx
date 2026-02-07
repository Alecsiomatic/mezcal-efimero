import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, ShoppingBag, Star, Grid, List, ArrowUpDown, User, LogOut, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../api/client';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import GlassButton from '../components/GlassButton';
import LiquidGlassCard from '../components/LiquidGlassCard';
import '../App.css';
import './Shop.css';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: { url: string; isPrimary: boolean }[];
  category?: { id: string; name: string; slug: string };
  agaveType?: string;
  alcoholContent?: number;
  volume?: string;
  shortDescription?: string;
  description?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  stock: number;
  region?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Filters {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  agaveType: string;
  alcoholMin: string;
  alcoholMax: string;
  region: string;
  inStock: boolean;
  sort: string;
}

const SORT_OPTIONS = [
  { value: 'createdAt-DESC', label: 'Más recientes' },
  { value: 'createdAt-ASC', label: 'Más antiguos' },
  { value: 'price-ASC', label: 'Precio: menor a mayor' },
  { value: 'price-DESC', label: 'Precio: mayor a menor' },
  { value: 'name-ASC', label: 'Nombre: A-Z' },
  { value: 'name-DESC', label: 'Nombre: Z-A' },
  { value: 'alcoholContent-ASC', label: 'Graduación: menor a mayor' },
  { value: 'alcoholContent-DESC', label: 'Graduación: mayor a menor' },
];

const AGAVE_TYPES = ['Salmiana', 'Salmiana Silvestre', 'Salmiana Verde', 'Espadín', 'Tobalá', 'Varios'];
const REGIONS = ['San Luis Potosí', 'Oaxaca', 'Durango', 'Zacatecas', 'Guerrero'];
const PRICE_RANGES = [
  { label: 'Todos', min: '', max: '' },
  { label: 'Menos de $500', min: '', max: '500' },
  { label: '$500 - $1,000', min: '500', max: '1000' },
  { label: '$1,000 - $2,000', min: '1000', max: '2000' },
  { label: '$2,000 - $3,000', min: '2000', max: '3000' },
  { label: 'Más de $3,000', min: '3000', max: '' },
];

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    agaveType: '',
    alcoholMin: '',
    alcoholMax: '',
    region: '',
    inStock: false,
    sort: 'createdAt-DESC',
  });
  
  const { items, addItem, removeItem, updateQuantity, isOpen, closeCart, getTotalPrice } = useCartStore();
  const { user, logout } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Leer categoría de URL si existe
  useEffect(() => {
    const categoryParam = searchParams.get('categoria');
    if (categoryParam) {
      // Buscar categoría por slug
      const matchingCategory = categories.find(c => c.slug === categoryParam);
      if (matchingCategory) {
        setFilters(prev => ({ ...prev, category: matchingCategory.id }));
      }
    }
  }, [searchParams, categories]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const [sortField, sortOrder] = filters.sort.split('-');
        const params = new URLSearchParams({
          limit: '100',
          sort: sortField,
          order: sortOrder,
        });
        
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        
        const { data } = await api.get(`/products?${params.toString()}`);
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters.search, filters.category, filters.minPrice, filters.maxPrice, filters.sort]);

  // Client-side filtering for additional filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.agaveType && product.agaveType !== filters.agaveType) return false;
      if (filters.region && product.region !== filters.region) return false;
      if (filters.alcoholMin && product.alcoholContent && product.alcoholContent < parseFloat(filters.alcoholMin)) return false;
      if (filters.alcoholMax && product.alcoholContent && product.alcoholContent > parseFloat(filters.alcoholMax)) return false;
      if (filters.inStock && product.stock <= 0) return false;
      return true;
    });
  }, [products, filters.agaveType, filters.region, filters.alcoholMin, filters.alcoholMax, filters.inStock]);

  const handleAddToCart = (product: Product) => {
    const primaryImage = getImageUrl(product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url);
    
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: primaryImage,
      agaveType: product.agaveType,
      volume: product.volume,
      alcoholContent: product.alcoholContent,
    }, 1);
  };

  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      agaveType: '',
      alcoholMin: '',
      alcoholMax: '',
      region: '',
      inStock: false,
      sort: 'createdAt-DESC',
    });
  };

  const activeFiltersCount = [
    filters.category,
    filters.minPrice || filters.maxPrice,
    filters.agaveType,
    filters.alcoholMin || filters.alcoholMax,
    filters.region,
    filters.inStock,
  ].filter(Boolean).length;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);
  };

  return (
    <div className="shop-page">
      {/* FluidBackground is global in App.tsx */}
      
      {/* Header */}
      <header className="shop-header">
        <div className="container">
          <Link to="/" className="shop-logo">
            <img src="/logo-efimero.png" alt="Efímero" />
          </Link>
          <nav className="shop-nav">
            <Link to="/">Inicio</Link>
            <Link to="/tienda" className="active">Tienda</Link>
            <Link to="/#nosotros">Nosotros</Link>
            <Link to="/#contacto">Contacto</Link>
          </nav>
          <div className="shop-user-actions">
            {user ? (
              <>
                <Link to="/perfil" className="user-link" title="Mi Perfil">
                  <User size={20} />
                  <span>Mi Perfil</span>
                </Link>
                {user.isAdmin && (
                  <Link to="/admin" className="admin-link">Admin</Link>
                )}
                <button onClick={logout} className="logout-btn" title="Cerrar Sesión">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/login" className="login-link">Iniciar Sesión</Link>
            )}
          </div>
        </div>
      </header>

      {/* Page Title */}
      <section className="shop-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>Nuestra Colección</h1>
            <p>Descubre mezcales artesanales y botellas únicas</p>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="category-tabs">
        <div className="container">
          <div className="tabs-wrapper">
            <button 
              className={`category-tab ${!filters.category ? 'active' : ''}`}
              onClick={() => updateFilter('category', '')}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`category-tab ${filters.category === cat.slug ? 'active' : ''}`}
                onClick={() => updateFilter('category', cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="shop-main">
        <div className="container">
          {/* Search & Controls Bar */}
          <div className="shop-controls">
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar mezcales..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
              {filters.search && (
                <button className="clear-search" onClick={() => updateFilter('search', '')}>
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="controls-right">
              <button 
                className={`filter-toggle ${filtersOpen ? 'active' : ''}`}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <SlidersHorizontal size={18} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="filter-count">{activeFiltersCount}</span>
                )}
              </button>
              
              <div className="sort-select">
                <ArrowUpDown size={16} />
                <select 
                  value={filters.sort} 
                  onChange={(e) => updateFilter('sort', e.target.value)}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="view-toggle">
                <button 
                  className={viewMode === 'grid' ? 'active' : ''} 
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={18} />
                </button>
                <button 
                  className={viewMode === 'list' ? 'active' : ''} 
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                className="filters-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="filters-grid">
                  {/* Category */}
                  <div className="filter-group">
                    <label>Categoría</label>
                    <select 
                      value={filters.category} 
                      onChange={(e) => updateFilter('category', e.target.value)}
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="filter-group">
                    <label>Rango de Precio</label>
                    <select
                      value={`${filters.minPrice}-${filters.maxPrice}`}
                      onChange={(e) => {
                        const [min, max] = e.target.value.split('-');
                        updateFilter('minPrice', min);
                        updateFilter('maxPrice', max);
                      }}
                    >
                      {PRICE_RANGES.map((range, idx) => (
                        <option key={idx} value={`${range.min}-${range.max}`}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Agave Type */}
                  <div className="filter-group">
                    <label>Tipo de Agave</label>
                    <select 
                      value={filters.agaveType} 
                      onChange={(e) => updateFilter('agaveType', e.target.value)}
                    >
                      <option value="">Todos los tipos</option>
                      {AGAVE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Alcohol Content */}
                  <div className="filter-group">
                    <label>Graduación Alcohólica</label>
                    <div className="range-inputs">
                      <input
                        type="number"
                        placeholder="Min °"
                        value={filters.alcoholMin}
                        onChange={(e) => updateFilter('alcoholMin', e.target.value)}
                        min="30"
                        max="60"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        placeholder="Max °"
                        value={filters.alcoholMax}
                        onChange={(e) => updateFilter('alcoholMax', e.target.value)}
                        min="30"
                        max="60"
                      />
                    </div>
                  </div>

                  {/* Region */}
                  <div className="filter-group">
                    <label>Región</label>
                    <select 
                      value={filters.region} 
                      onChange={(e) => updateFilter('region', e.target.value)}
                    >
                      <option value="">Todas las regiones</option>
                      {REGIONS.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  {/* In Stock */}
                  <div className="filter-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) => updateFilter('inStock', e.target.checked)}
                      />
                      Solo productos en stock
                    </label>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <button className="clear-filters" onClick={clearFilters}>
                    <X size={16} /> Limpiar filtros
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Info */}
          <div className="results-info">
            <span>{filteredProducts.length} productos encontrados</span>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <h3>No se encontraron productos</h3>
              <p>Intenta ajustar los filtros o buscar algo diferente</p>
              <GlassButton variant="secondary" onClick={clearFilters}>
                Limpiar filtros
              </GlassButton>
            </div>
          ) : (
            <motion.div 
              className={`products-grid ${viewMode}`}
              layout
            >
              {filteredProducts.map((product, index) => {
                const primaryImage = getImageUrl(product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url);
                const discount = product.comparePrice 
                  ? Math.round((1 - product.price / product.comparePrice) * 100) 
                  : 0;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <LiquidGlassCard 
                      className="product-card" 
                      glowColor="#D4AF37" 
                      intensity={0.5}
                      borderRadius={20}
                    >
                      <Link to={`/producto/${product.slug}`} className="product-link">
                        <div className="product-image">
                          {product.isNew && <span className="badge new">Nuevo</span>}
                          {discount > 0 && <span className="badge discount">-{discount}%</span>}
                          {product.stock <= 0 && <span className="badge out-of-stock">Agotado</span>}
                          <img src={primaryImage} alt={product.name} />
                        </div>
                        
                        <div className="product-info">
                          <span className="product-category">{product.category?.name || 'Mezcal'}</span>
                          <h3 className="product-name">{product.name}</h3>
                          
                          {viewMode === 'list' && product.shortDescription && (
                            <p className="product-description">{product.shortDescription}</p>
                          )}
                          
                          <div className="product-meta">
                            {product.agaveType && (
                              <span className="meta-tag">{product.agaveType}</span>
                            )}
                            {product.alcoholContent && (
                              <span className="meta-tag">{product.alcoholContent}°</span>
                            )}
                            {product.volume && (
                              <span className="meta-tag">{product.volume}</span>
                            )}
                          </div>
                          
                          <div className="product-footer">
                            <div className="product-price">
                              <span className="current">{formatPrice(product.price)}</span>
                              {product.comparePrice && (
                                <span className="original">{formatPrice(product.comparePrice)}</span>
                              )}
                            </div>
                            <div className="product-rating">
                              <Star size={14} fill="#D4AF37" color="#D4AF37" />
                              <span>5.0</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                      
                      <button 
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        <ShoppingBag size={18} />
                        {product.stock > 0 ? 'Agregar' : 'Agotado'}
                      </button>
                    </LiquidGlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="shop-footer">
        <div className="container">
          <p>© 2026 Efímero Mezcal. Todos los derechos reservados.</p>
          <p>Bebe con moderación. Prohibida la venta a menores de edad.</p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-sidebar-overlay" onClick={closeCart} />
        <motion.div 
          className="cart-sidebar-content"
          initial={{ x: '100%' }}
          animate={{ x: isOpen ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="cart-header">
            <h2><ShoppingBag size={24} /> Tu Carrito</h2>
            <button className="cart-close" onClick={closeCart}><X size={24} /></button>
          </div>
          
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={64} strokeWidth={1} />
              <p>Tu carrito está vacío</p>
              <GlassButton variant="primary" size="lg" onClick={closeCart}>Explorar Productos</GlassButton>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} alt={item.name} className="cart-item-img" />
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p className="cart-item-meta">
                        {item.agaveType} 
                        {item.volume && ` • ${item.volume}`}
                        {item.alcoholContent && ` • ${item.alcoholContent}°`}
                      </p>
                      <p className="cart-item-price">{formatPrice(item.price)} MXN</p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                      </div>
                      <button className="remove-item" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-footer">
                <div className="cart-subtotal">
                  <span>Subtotal</span>
                  <span>${getTotalPrice().toLocaleString()} MXN</span>
                </div>
                <p className="cart-shipping-note">Envío calculado al finalizar</p>
                <GlassButton 
                  variant="primary" 
                  size="lg" 
                  className="cart-checkout-btn" 
                  onClick={() => { closeCart(); navigate('/checkout'); }}
                  style={{ width: '100%' }}
                >
                  Proceder al Pago
                  <ArrowRight size={18} />
                </GlassButton>
                <GlassButton variant="ghost" size="md" onClick={closeCart} style={{ width: '100%' }}>
                  Continuar Comprando
                </GlassButton>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
