import { motion, useScroll } from 'framer-motion';
import { Star, Shield, ArrowRight, ShoppingBag, Menu, X, MapPin, Phone, Clock, Instagram, Facebook, Leaf, Award, Play, Sparkles, Minus, Plus, Trash2, Wine, Gem, Palette } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import api, { getImageUrl } from '../api/client';
import GlassSurface from '../components/GlassSurface';
import GlassButton from '../components/GlassButton';
import LiquidGlassCard from '../components/LiquidGlassCard';
import '../App.css';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: { url: string; isPrimary: boolean }[];
  category?: { name: string };
  agaveType?: string;
  alcoholContent?: number;
  volume?: string;
  shortDescription?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  stock: number;
}

const features = [
  {
    icon: Leaf,
    title: "100% Agave",
    description: "Respeto al origen: Agave salmiana local"
  },
  {
    icon: Award,
    title: "Artesanal",
    description: "Cocido en hornos de mampostería y destilado artesanalmente en alambique de cobre"
  },
  {
    icon: Sparkles,
    title: "Mezcal Ancestral",
    description: "Cocido en jarrones de barro artesanal"
  },
  {
    icon: Shield,
    title: "Certificado",
    description: "Denominación de origen y certificación orgánica"
  },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [artisanalProducts, setArtisanalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const { items, addItem, removeItem, updateQuantity, isOpen, toggleCart, closeCart, getTotalItems, getTotalPrice } = useCartStore();
  const heroRef = useRef(null);
  const navigate = useNavigate();
  useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Cargar productos de la API (destacados, excluyendo botellas artesanales)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products?limit=6&featured=true&excludeCategory=botellas-artesanales');
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Cargar botellas artesanales destacadas
  useEffect(() => {
    const fetchArtisanalProducts = async () => {
      try {
        // Obtener productos de la categoría "botellas-artesanales" que sean destacados
        const { data } = await api.get('/products?category=botellas-artesanales&featured=true&limit=6');
        setArtisanalProducts(data.products || []);
      } catch (error) {
        console.error('Error loading artisanal products:', error);
      }
    };
    fetchArtisanalProducts();
  }, []);

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

  return (
    <div className="app">
      {/* Global Fluid Background is in App.tsx */}

      {/* Ambient particles */}
      <div className="ambient-particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [-20, -100],
              x: Math.sin(i) * 50,
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
            }}
          />
        ))}
      </div>

      {/* Top Bar */}
      <motion.div
        className="top-bar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="top-bar-container">
          <div className="top-bar-left">
            <span><Phone size={12} /> +52 444 249 9873</span>
            <span><MapPin size={12} /> San Luis Potosí, México</span>
          </div>
          <div className="top-bar-right">
            <span><Clock size={12} /> Envíos a todo México</span>
            <div className="social-icons">
              <a href="https://www.instagram.com/mezcalefimero/" target="_blank" rel="noopener noreferrer"><Instagram size={12} /></a>
              <a href="https://www.facebook.com/mezcalefimero/" target="_blank" rel="noopener noreferrer"><Facebook size={12} /></a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.nav
        className="navbar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={60}
          brightness={12}
          opacity={0.95}
          blur={25}
          backgroundOpacity={0.85}
          className="nav-glass"
        >
          <div className="nav-container">
            <motion.div className="logo" whileHover={{ scale: 1.02 }}>
              <Link to="/"><img src="/logo-efimero.png" alt="Efímero" className="logo-img" /></Link>
            </motion.div>

            {/* Desktop nav links */}
            <div className="nav-links-desktop">
              <a href="#inicio">Inicio</a>
              <a href="#historia">Historia</a>
              <Link to="/tienda">Tienda</Link>
              <a href="#proceso">Proceso</a>
              <a href="#contacto">Contacto</a>
              {user ? (
                <>
                  <Link to="/perfil" className="nav-profile">Mi Perfil</Link>
                  {user.isAdmin && <Link to="/admin">Admin</Link>}
                  <button onClick={logout} className="nav-logout">Salir</button>
                </>
              ) : (
                <Link to="/login" className="nav-login">Iniciar Sesión</Link>
              )}
            </div>

            <div className="nav-actions">
              <motion.button className="cart-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={toggleCart}>
                <ShoppingBag size={20} />
                <span className="cart-count">{getTotalItems()}</span>
              </motion.button>
              <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </GlassSurface>

        {/* Mobile menu - outside GlassSurface */}
        <motion.div 
          className={`nav-mobile ${menuOpen ? 'open' : ''}`}
          initial={false}
          animate={menuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <a href="#inicio" onClick={() => setMenuOpen(false)}>Inicio</a>
          <a href="#historia" onClick={() => setMenuOpen(false)}>Historia</a>
          <Link to="/tienda" onClick={() => setMenuOpen(false)}>Tienda</Link>
          <a href="#proceso" onClick={() => setMenuOpen(false)}>Proceso</a>
          <a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
          <div className="nav-mobile-auth">
            {user ? (
              <>
                <Link to="/perfil" onClick={() => setMenuOpen(false)} className="nav-profile-mobile">Mi Perfil</Link>
                {user.isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="nav-admin-mobile">Panel Admin</Link>}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="nav-logout-mobile">Cerrar Sesión</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="nav-login-mobile">Iniciar Sesión</Link>
            )}
          </div>
        </motion.div>
      </motion.nav>

{/* HERO SECTION - FULLSCREEN IMAGE WITH BRANDED CENTER */}
      <section className="hero hero-fullscreen hero-branded" ref={heroRef} id="inicio">
        {/* Fullscreen Background Image */}
        <div className="hero-bg-image">
          <motion.img
            src="/efimero-13 (1).jpg"
            alt="Efímero Mezcal Collection"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <div className="hero-bg-overlay hero-overlay-branded" />
        </div>

        {/* Subtle Cinematic Effects - Only at edges */}
        <div className="hero-vignette hero-vignette-soft" />

        {/* Mobile Title - Only visible on mobile */}
        <motion.div className="hero-mobile-title" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }}><img src="/logo-efimero.png" alt="Efímero" className="hero-mobile-logo" /></motion.div>

        {/* Bottom Content Only - Center stays clean for image branding */}
        <motion.div
          className="hero-bottom-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          {/* Tagline */}
          <motion.p
            className="hero-tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            Mezcal artesanal · "Creado sin prisa, disfrutado con tiempo" · San Luis Potosí
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="hero-ctas-bottom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link to="/tienda">
                <GlassButton variant="primary" size="lg">
                  <span>Explorar Tienda</span>
                  <ArrowRight size={18} />
                </GlassButton>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <GlassButton variant="ghost" size="lg">
                <Play size={16} fill="currentColor" />
                <span>Nuestra Historia</span>
              </GlassButton>
            </motion.div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            className="hero-stats-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
          >
            <LiquidGlassCard className="stats-bar-glass" glowColor="#D4AF37" intensity={0.6} borderRadius={16}>
              <div className="stats-bar-inner">
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-text">Agave Salmiana</span>
                </div>
                <div className="stat-separator" />
                <div className="stat-item">
                  <span className="stat-number">37°</span>
                  <span className="stat-text">Joven</span>
                </div>
                <div className="stat-separator" />
                <div className="stat-item">
                  <span className="stat-number">40°</span>
                  <span className="stat-text">Reposado</span>
                </div>
                <div className="stat-separator" />
                <div className="stat-item">
                  <span className="stat-number">55°</span>
                  <span className="stat-text">Ancestral</span>
                </div>
              </div>
            </LiquidGlassCard>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="scroll-indicator"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 2.5 }}
        >
          <span>Scroll</span>
          <motion.div 
            className="scroll-line" 
            animate={{ scaleY: [0, 1, 0] }} 
            transition={{ duration: 2, repeat: Infinity }} 
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <LiquidGlassCard className="feature-card-liquid" glowColor="#D4AF37" intensity={0.6} borderRadius={20}>
                  <div className="feature-inner">
                    <div className="feature-icon-wrapper">
                      <feature.icon size={24} />
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="awards-section" id="premios">
        <div className="awards-container">
          <motion.div 
            className="awards-content"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="awards-degree">
              <span className="degree-number">40</span>
              <span className="degree-symbol">°</span>
            </div>
            <h2 className="awards-title">Nuestro orgullo</h2>
            <div className="awards-description">
              <p className="awards-highlight">
                GANADOR DE DOS MEDALLAS DE PLATA<br />
                DEL MÉXICO SELECTION BY CONCOURS<br />
                MONDIAL DE BRUXELLES.
              </p>
              <p className="awards-years">2022 Y 2024</p>
              <p className="awards-gold">
                GANANDO EN EL 2024 LA MEDALLA DE ORO<br />
                EN CAVA
              </p>
            </div>
            <div className="awards-medals">
              <motion.img 
                src="/medalla%20pagina%20medalla24.png" 
                alt="Medalla México Selection 2024" 
                className="medal-img medal-2022"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <motion.img 
                src="/Medalla%20pagina%2022medalla22.png" 
                alt="Medalla México Selection 2022" 
                className="medal-img medal-cava-oro"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="awards-bottle"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <img src="/efimero-23.jpg" alt="Mezcal Artesanal Efímero" />
            <div className="bottle-label">MEZCAL ARTESANAL EFÍMERO</div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products" id="coleccion">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="section-tag">NUESTRA COLECCIÓN</span>
            <h2 className="section-title">Mezcales de Autor</h2>
            <div className="title-underline" />
            <p className="section-subtitle">Cada botella es una obra maestra destilada con pasión</p>
          </motion.div>

          <div className="products-grid">
            {loading ? (
              <div className="loading-products">Cargando productos...</div>
            ) : products.length === 0 ? (
              <div className="no-products">No hay productos disponibles</div>
            ) : (
              products.map((product, index) => {
                const primaryImage = getImageUrl(product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    viewport={{ once: true }}
                  >
                    <LiquidGlassCard className="product-card-liquid" glowColor="#D4AF37" intensity={0.7} borderRadius={28}>
                      <div className="product-inner">
                        {product.isNew && <span className="product-badge-new">Nuevo</span>}
                        {product.isFeatured && !product.isNew && <span className="product-badge-new">Destacado</span>}
                        <div className="product-image-container">
                          <motion.img
                            src={primaryImage}
                            alt={product.name}
                            className="product-img"
                            whileHover={{ scale: 1.08 }}
                            transition={{ duration: 0.4 }}
                          />
                          <motion.button 
                            className="quick-add-btn" 
                            whileHover={{ scale: 1.1 }} 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingBag size={18} />
                          </motion.button>
                        </div>
                        <div className="product-details">
                          <span className="product-category-new">{product.category?.name || 'Mezcal'}</span>
                          <Link to={`/producto/${product.slug}`} className="product-link-title">
                            <h3 className="product-name-new">{product.name}</h3>
                          </Link>
                          <p className="product-description">{product.shortDescription || ''}</p>
                          <div className="product-meta">
                            {product.agaveType && <span className="meta-item">{product.agaveType}</span>}
                            {product.alcoholContent && <span className="meta-item">{product.alcoholContent}°</span>}
                          </div>
                          <div className="product-footer">
                            <div className="product-rating-new">
                              <Star size={14} fill="#D4AF37" color="#D4AF37" />
                              <span>5.0</span>
                            </div>
                            <div className="product-pricing">
                              <span className="current-price">${product.price} MXN</span>
                              {product.comparePrice && <span className="original-price">${product.comparePrice}</span>}
                            </div>
                          </div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <GlassButton 
                              variant="secondary"
                              size="md"
                              onClick={() => handleAddToCart(product)}
                              style={{ width: '100%' }}
                            >
                              Agregar al Carrito
                            </GlassButton>
                          </motion.div>
                        </div>
                      </div>
                    </LiquidGlassCard>
                  </motion.div>
                );
              })
            )}
          </div>
          
          {/* Ver todos los productos */}
          <motion.div
            className="view-all-products"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Link to="/tienda">
              <GlassButton variant="secondary" size="lg">
                <span>Ver Toda la Colección</span>
                <ArrowRight size={18} />
              </GlassButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Artisanal Bottles Section */}
      <section className="artisanal-bottles" id="botellas">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="section-tag">ARTE HUICHOL</span>
            <h2 className="section-title">Botellas Artesanales</h2>
            <div className="title-underline" />
            <p className="section-subtitle">
              Cada botella es una pieza única, intervenida a mano por artesanos huicholes con chaquira 
              colocada una a una. No son simples envases, son obras de arte que honran la tradición ancestral.
            </p>
          </motion.div>

          {/* Disclaimer de cuidado */}
          <motion.div
            className="bottles-disclaimer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <LiquidGlassCard className="disclaimer-card" glowColor="#D4AF37" intensity={0.5} borderRadius={24}>
              <div className="disclaimer-content">
                <Gem size={24} />
                <div>
                  <h4>Piezas artesanales únicas</h4>
                  <p>
                    Nuestras botellas son elaboradas completamente a mano por artesanos huicholes. 
                    Cada pieza es única e irrepetible. Se envían cuidadosamente empacadas y en perfecto estado. 
                    Una vez recibidas, te recomendamos manipularlas con cuidado para preservar el arte que contienen.
                  </p>
                </div>
              </div>
            </LiquidGlassCard>
          </motion.div>

          {/* Artisanal Products Grid */}
          {artisanalProducts.length > 0 ? (
            <div className="bottles-grid">
              {artisanalProducts.map((product, index) => {
                const primaryImage = getImageUrl(product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    viewport={{ once: true }}
                  >
                    <LiquidGlassCard className="bottle-card" glowColor="#D4AF37" intensity={0.7} borderRadius={24}>
                      <div className="bottle-card-inner">
                        <Link to={`/producto/${product.slug}`} className="bottle-image-container">
                          {primaryImage ? (
                            <img 
                              src={primaryImage} 
                              alt={product.name}
                              className="bottle-img"
                            />
                          ) : (
                            <div className="bottle-placeholder">
                              <Wine size={60} />
                            </div>
                          )}
                          <div className="bottle-badge">
                            <Palette size={14} /> Artesanal
                          </div>
                        </Link>
                        <div className="bottle-details">
                          <Link to={`/producto/${product.slug}`} className="bottle-name-link">
                            <h3 className="bottle-name">{product.name}</h3>
                          </Link>
                          {product.shortDescription && (
                            <p className="bottle-description">{product.shortDescription}</p>
                          )}
                          <div className="bottle-specs">
                            {product.agaveType && (
                              <span className="spec"><Palette size={14} /> {product.agaveType}</span>
                            )}
                            {product.alcoholContent && (
                              <span className="spec">{product.alcoholContent}°</span>
                            )}
                            {product.volume && (
                              <span className="spec">{product.volume}</span>
                            )}
                          </div>
                          <div className="bottle-footer">
                            <div className="bottle-price">
                              {formatCurrency(product.price)}
                            </div>
                            <div className="bottle-stock">
                              {product.stock > 0 ? (
                                <span className={product.stock <= 5 ? 'low-stock' : ''}>
                                  {product.stock <= 5 ? `¡Solo ${product.stock}!` : `${product.stock} disponibles`}
                                </span>
                              ) : (
                                <span className="out-of-stock">Agotada</span>
                              )}
                            </div>
                          </div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginTop: '1rem' }}>
                            <GlassButton 
                              variant="secondary"
                              size="md"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stock <= 0}
                              style={{ width: '100%' }}
                            >
                              <ShoppingBag size={16} />
                              {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                            </GlassButton>
                          </motion.div>
                        </div>
                      </div>
                    </LiquidGlassCard>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              className="bottles-empty"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <LiquidGlassCard glowColor="#D4AF37" intensity={0.4} borderRadius={20}>
                <div className="bottles-empty-content">
                  <Wine size={48} />
                  <p>Próximamente tendremos botellas artesanales disponibles.</p>
                </div>
              </LiquidGlassCard>
            </motion.div>
          )}

          {/* CTA - Botón principal para ver todas las botellas */}
          <motion.div
            className="bottles-cta"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <LiquidGlassCard glowColor="#D4AF37" intensity={0.4} borderRadius={20}>
              <div className="bottles-cta-content">
                <Wine size={32} />
                <div>
                  <p>
                    <strong>Descubre toda nuestra colección</strong> de botellas artesanales huicholes. 
                    Cada pieza es una obra de arte única.
                  </p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    📦 Una vez realizado el pago, tu pedido se envía en <strong>3 días hábiles</strong>.
                  </p>
                </div>
                <Link to="/tienda?categoria=botellas-artesanales">
                  <GlassButton variant="primary" size="lg">
                    Comprar Botellas Artesanales <ArrowRight size={18} />
                  </GlassButton>
                </Link>
              </div>
            </LiquidGlassCard>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story" id="historia">
        <div className="container">
          <div className="story-content">
            <motion.div
              className="story-text"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="section-tag">NUESTRA HISTORIA</span>
              <h2 className="section-title">Botellas artesanales<br />creadas con manos artesanales</h2>
              <div className="title-underline left" />
              <p>
                <strong>Efímero no solo se bebe, se conserva.</strong> Cada botella es una obra artesanal creada a mano, intervenida cuidadosamente con chaquira colocada una a una por artesanos huicholes. Ninguna pieza se repite, porque cada diseño nace del tiempo, la intención y la tradición de quien la crea.
              </p>
              <p>
                Estas botellas no son un envase, son un objeto que guarda historia, cultura y respeto por el origen. El proceso es lento y consciente, como todo lo que vale la pena: manos que trabajan, símbolos que hablan y materiales que honran la herencia ancestral.
              </p>
              <p>
                El valor de Efímero no está únicamente en el mezcal que contiene, elaborado a partir de agave Salmiana de la región, sino en la historia que permanece aun cuando el instante se ha ido. Lo que se bebe es efímero; lo que se conserva, trasciende.
              </p>
              <LiquidGlassCard className="story-quote-card" glowColor="#D4AF37" intensity={0.5} borderRadius={16}>
                <blockquote className="story-quote-new">
                  "El mezcal no se hace, el mezcal nace"
                  <cite>— Don Efímero, Maestro Mezcalero</cite>
                </blockquote>
              </LiquidGlassCard>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <a href="#proceso">
                  <GlassButton variant="primary" size="lg">
                    <span>Conoce Nuestro Proceso</span>
                    <ArrowRight size={18} />
                  </GlassButton>
                </a>
              </motion.div>
            </motion.div>
            <motion.div
              className="story-image"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <LiquidGlassCard className="story-image-card" glowColor="#D4AF37" intensity={0.8} borderRadius={28}>
                <img src="/Efímero.png" alt="Efímero - Botella Artesanal" />
              </LiquidGlassCard>
              <div className="image-accent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="contacto">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <Link to="/"><img src="/logo-efimero.png" alt="Efímero" className="logo-img" /></Link>
              </div>
              <p>Hecho con tiempo, respeto y origen.<br />Así es Efímero.</p>
              <div className="footer-social">
                <a href="https://www.instagram.com/mezcalefimero/" target="_blank" rel="noopener noreferrer"><Instagram size={18} /></a>
                <a href="https://www.facebook.com/mezcalefimero/" target="_blank" rel="noopener noreferrer"><Facebook size={18} /></a>
              </div>
            </div>
            <div className="footer-links">
              <h4>Explorar</h4>
              <a href="#inicio">Inicio</a>
              <a href="#coleccion">Colección</a>
              <a href="#historia">Historia</a>
              <a href="#proceso">Proceso</a>
            </div>
            <div className="footer-links">
              <h4>Productos</h4>
              <a href="#">Mezcal artesanal de 37°</a>
              <a href="#">Mezcal artesanal de 40°</a>
              <a href="#">Mezcal ancestral de 55°</a>
              <a href="#">Botellas artesanales</a>
            </div>
            <div className="footer-contact">
              <h4>Contacto</h4>
              <p><MapPin size={14} /> San Luis Potosí, México</p>
              <p><Phone size={14} /> +52 444 249 9873</p>
              <p><Clock size={14} /> Lun - Sáb: 9:00 - 18:00</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 Efímero Mezcal. Todos los derechos reservados.</p>
            <p className="age-disclaimer">El consumo de alcohol es exclusivo para mayores de edad. Bebe con moderación.</p>
          </div>
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
                      <p className="cart-item-price">{formatCurrency(item.price)} MXN</p>
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












