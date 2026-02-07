import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Minus, Plus, Truck, Shield, Award, Leaf, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { getImageUrl } from '../api/client';
import useCartStore from '../store/cartStore';
import GlassButton from '../components/GlassButton';
import LiquidGlassCard from '../components/LiquidGlassCard';
import '../App.css';

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice?: number;
  stock: number;
  sku: string;
  agaveType: string;
  alcoholContent: number;
  volume: string;
  region: string;
  tastingNotes: string;
  pairings: string;
  images: ProductImage[];
  category?: { name: string };
  isActive: boolean;
  isFeatured: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (!product) return;
    const maxQty = product.stock;

    if (maxQty <= 0) {
      setQuantity(0);
      return;
    }

    setQuantity((prev) => {
      if (prev < 1) return 1;
      if (prev > maxQty) return maxQty;
      return prev;
    });
  }, [product]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productResponse = await api.get(`/products/${slug}`);
        setProduct(productResponse.data.product);
        setQuantity(1);
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchData();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock <= 0 || quantity < 1) {
      alert('No hay inventario disponible.');
      return;
    }

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
    }, quantity);
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <LiquidGlassCard glowColor="#D4AF37" intensity={0.5} borderRadius={20}>
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p>Cargando producto...</p>
            </div>
          </LiquidGlassCard>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <LiquidGlassCard glowColor="#D4AF37" intensity={0.5} borderRadius={20}>
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <h2>Producto no encontrado</h2>
              <Link to="/">
                <GlassButton variant="primary" size="lg" style={{ marginTop: '1rem' }}>
                  Volver a la tienda
                </GlassButton>
              </Link>
            </div>
          </LiquidGlassCard>
        </div>
      </div>
    );
  }

  const primaryImage = getImageUrl(product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url);
  const images = product.images?.length > 0 
    ? product.images.map(img => ({ ...img, url: getImageUrl(img.url) }))
    : [{ url: primaryImage, isPrimary: true, id: '1' }];
  const discount = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
  const maxQuantity = product.stock;
  const addDisabled = maxQuantity <= 0;
  const minimumQuantity = addDisabled ? 0 : 1;

  return (
    <div className="product-detail-page">
      
      <div className="product-detail-container">
        {/* Header */}
        <div className="product-detail-header">
          <Link to="/#coleccion">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft size={18} /> Volver a la colección
            </GlassButton>
          </Link>
        </div>

        <div className="product-detail-content">
          {/* Left - Images */}
          <motion.div 
            className="product-images"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <LiquidGlassCard glowColor="#D4AF37" intensity={0.7} borderRadius={24}>
              <div style={{ padding: '1.5rem' }}>
                <div className="main-image" style={{ position: 'relative' }}>
                  <AnimatePresence mode="wait">
                    <motion.img 
                      src={images[selectedImage]?.url || primaryImage} 
                      alt={product.name}
                      key={selectedImage}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: '100%', height: 'auto', borderRadius: '16px', objectFit: 'cover' }}
                    />
                  </AnimatePresence>
                  
                  {/* Flechas de navegación */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#fff',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.8)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#fff',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.8)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
                      >
                        <ChevronRight size={24} />
                      </button>
                      
                      {/* Indicador de imagen actual */}
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0, 0, 0, 0.5)',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        color: '#fff',
                      }}>
                        {selectedImage + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="thumbnail-grid" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(idx)}
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: selectedImage === idx ? '2px solid #D4AF37' : '2px solid transparent',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </LiquidGlassCard>
          </motion.div>

          {/* Right - Info */}
          <motion.div 
            className="product-info"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <LiquidGlassCard glowColor="#D4AF37" intensity={0.5} borderRadius={24}>
              <div style={{ padding: '2rem' }}>
                {product.category && (
                  <span style={{ color: '#D4AF37', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    {product.category.name}
                  </span>
                )}
                
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  {product.name}
                </h1>

                {product.shortDescription && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    {product.shortDescription}
                  </p>
                )}

                {/* Price */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '700', color: '#D4AF37' }}>
                      {formatCurrency(product.price)} MXN
                    </span>
                    {product.comparePrice && (
                      <>
                        <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>
                          {formatCurrency(product.comparePrice)}
                        </span>
                        <span style={{ background: '#22c55e', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                          -{discount}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Product Specs */}
                <div style={{ marginBottom: '1.5rem' }}>
                <LiquidGlassCard glowColor="#D4AF37" intensity={0.3} borderRadius={12}>
                  <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {product.agaveType && (
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', display: 'block' }}>Agave</span>
                        <span style={{ fontWeight: '500' }}>{product.agaveType}</span>
                      </div>
                    )}
                    {product.alcoholContent && (
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', display: 'block' }}>Alcohol</span>
                        <span style={{ fontWeight: '500' }}>{product.alcoholContent}°</span>
                      </div>
                    )}
                    {product.volume && (
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', display: 'block' }}>Contenido</span>
                        <span style={{ fontWeight: '500' }}>{product.volume}</span>
                      </div>
                    )}
                    {product.region && (
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', display: 'block' }}>Región</span>
                        <span style={{ fontWeight: '500' }}>{product.region}</span>
                      </div>
                    )}
                  </div>
                </LiquidGlassCard>
                </div>

                {/* Quantity & Add to Cart */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem' }}>
                    <button 
                      onClick={() => setQuantity((prev) => Math.max(minimumQuantity, prev - 1))}
                      disabled={quantity <= minimumQuantity}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: quantity <= minimumQuantity ? 'not-allowed' : 'pointer', padding: '0.5rem', opacity: quantity <= minimumQuantity ? 0.5 : 1 }}
                    >
                      <Minus size={18} />
                    </button>
                    <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '1.1rem', fontWeight: '600' }}>{quantity}</span>
                    <button 
                      onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
                      disabled={quantity >= maxQuantity}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: quantity >= maxQuantity ? 'not-allowed' : 'pointer', padding: '0.5rem', opacity: quantity >= maxQuantity ? 0.5 : 1 }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  <GlassButton 
                    variant="primary" 
                    size="lg" 
                    style={{ flex: 1 }}
                    onClick={handleAddToCart}
                    disabled={addDisabled}
                  >
                    <ShoppingBag size={20} />
                    {!addDisabled ? 'Agregar al Carrito' : 'Agotado'}
                  </GlassButton>
                </div>

                {addDisabled && (
                  <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '-0.75rem', marginBottom: '1rem' }}>
                    No hay inventario disponible.
                  </p>
                )}

                {/* Stock indicator */}
                {product.stock > 0 && product.stock <= 10 && (
                  <p style={{ color: '#f59e0b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    ⚡ ¡Solo quedan {product.stock} unidades!
                  </p>
                )}

                {/* Benefits */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <Truck size={16} style={{ color: '#D4AF37' }} /> Envío gratis +$1,500
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <Shield size={16} style={{ color: '#D4AF37' }} /> Pago seguro
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <Award size={16} style={{ color: '#D4AF37' }} /> Producto artesanal
                  </div>
                </div>
              </div>
            </LiquidGlassCard>

            {/* Description */}
            {product.description && (
              <div style={{ marginTop: '1.5rem' }}>
              <LiquidGlassCard glowColor="#D4AF37" intensity={0.4} borderRadius={20}>
                <div style={{ padding: '2rem' }}>
                  <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>Descripción</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8' }}>{product.description}</p>
                </div>
              </LiquidGlassCard>
              </div>
            )}

            {/* Tasting Notes & Pairings */}
            {(product.tastingNotes || product.pairings) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                {product.tastingNotes && (
                  <LiquidGlassCard glowColor="#D4AF37" intensity={0.4} borderRadius={16}>
                    <div style={{ padding: '1.5rem' }}>
                      <h4 style={{ color: '#D4AF37', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Leaf size={18} /> Notas de Cata
                      </h4>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.6' }}>{product.tastingNotes}</p>
                    </div>
                  </LiquidGlassCard>
                )}
                {product.pairings && (
                  <LiquidGlassCard glowColor="#D4AF37" intensity={0.4} borderRadius={16}>
                    <div style={{ padding: '1.5rem' }}>
                      <h4 style={{ color: '#D4AF37', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award size={18} /> Maridaje
                      </h4>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.6' }}>{product.pairings}</p>
                    </div>
                  </LiquidGlassCard>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
