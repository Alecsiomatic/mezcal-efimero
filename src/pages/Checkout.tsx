import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Truck, Shield, Minus, Plus, Trash2, CheckCircle, Banknote } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import api from '../api/client';
import GlassButton from '../components/GlassButton';
import GlassInput from '../components/GlassInput';
import LiquidGlassCard from '../components/LiquidGlassCard';
import MercadoPagoCardPayment from '../components/MercadoPagoCardPayment';
import { COUNTRIES, getCountryByCode, getLadaByState } from '../data/phoneData';
import '../App.css';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

export default function Checkout() {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transfer'>('mercadopago');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCardPayment, setShowCardPayment] = useState(false);
  
  // Fetch shipping settings from database
  const { data: shippingSettings } = useQuery({
    queryKey: ['settings', 'shipping'],
    queryFn: async () => {
      const { data } = await api.get('/settings/public/shipping');
      return data.settings || {};
    },
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });

  // Fetch bank transfer settings
  const { data: bankSettings } = useQuery({
    queryKey: ['settings', 'transfer'],
    queryFn: async () => {
      const { data } = await api.get('/settings/public/transfer');
      return data.settings || {};
    },
    staleTime: 1000 * 60 * 5
  });

  const [shippingData, setShippingData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    lastName2: '', // Segundo apellido (materno)
    email: user?.email || '',
    country: 'MX', // Código de país
    state: 'San Luis Potosí',
    phoneNumber: '', // Solo los dígitos locales
    street: '',
    colony: '',
    city: '',
    zipCode: '',
    notes: '',
  });

  // Obtener datos del país y estado seleccionados
  const selectedCountry = getCountryByCode(shippingData.country);
  const currentLada = getLadaByState(shippingData.country, shippingData.state);
  const fullPhoneNumber = selectedCountry 
    ? `${selectedCountry.phoneCode} (${currentLada}) ${shippingData.phoneNumber}`
    : shippingData.phoneNumber;

  const subtotal = getTotalPrice();
  
  // Use settings from database, fallback to defaults
  const shippingCost = Number(shippingSettings?.shipping_cost) || 150;
  const freeShippingMin = Number(shippingSettings?.free_shipping_min) || 1500;
  const shipping = subtotal >= freeShippingMin ? 0 : shippingCost;
  const total = subtotal + shipping;

  useEffect(() => {
    if (user) {
      setShippingData(prev => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si cambia el país, resetear el estado al primero de ese país
    if (name === 'country') {
      const newCountry = getCountryByCode(value);
      setShippingData(prev => ({
        ...prev,
        country: value,
        state: newCountry?.states[0]?.name || '',
      }));
    } else {
      setShippingData({ ...shippingData, [name]: value });
    }
  };

  const validateShipping = () => {
    const required = ['firstName', 'lastName', 'email', 'phoneNumber', 'street', 'city', 'state', 'zipCode', 'country'];
    for (const field of required) {
      if (!shippingData[field as keyof typeof shippingData]) {
        alert('Por favor completa todos los campos obligatorios');
        return false;
      }
    }
    // Validar teléfono (7-10 dígitos)
    const phoneDigits = shippingData.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 10) {
      alert('El número de teléfono debe tener entre 7 y 10 dígitos');
      return false;
    }
    // Validar código postal (más flexible para otros países)
    if (shippingData.country === 'MX' && !/^\d{5}$/.test(shippingData.zipCode)) {
      alert('El código postal debe tener 5 dígitos');
      return false;
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!token) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!validateShipping()) return;
    
    setLoading(true);
    setPaymentError(null);
    
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shipping: {
          firstName: shippingData.firstName,
          lastName: `${shippingData.lastName}${shippingData.lastName2 ? ' ' + shippingData.lastName2 : ''}`,
          email: shippingData.email,
          phone: fullPhoneNumber,
          address: `${shippingData.street}${shippingData.colony ? ', ' + shippingData.colony : ''}`,
          city: shippingData.city,
          state: shippingData.state,
          country: selectedCountry?.name || shippingData.country,
          zip: shippingData.zipCode,
          cost: shipping,
        },
        notes: shippingData.notes,
        paymentMethod,
      };
      
      const { data: orderResponse } = await api.post('/orders', orderData);
      setOrderId(orderResponse.order.id);
      setOrderNumber(orderResponse.order.orderNumber);

      if (paymentMethod === 'mercadopago') {
        // Show inline card payment form instead of redirecting
        setShowCardPayment(true);
        setStep(4); // New step for card payment
      } else {
        setOrderComplete(true);
        clearCart();
      }
    } catch (error: any) {
      console.error('Order error:', error);
      alert(error.response?.data?.error || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment successful:', paymentId);
    setShowCardPayment(false);
    setOrderComplete(true);
    clearCart();
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <LiquidGlassCard glowColor="#D4AF37" intensity={0.6} borderRadius={24}>
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif" }}>Tu carrito está vacío</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>Agrega productos para continuar con tu compra</p>
              <Link to="/">
                <GlassButton variant="primary" size="lg">Ver Productos</GlassButton>
              </Link>
            </div>
          </LiquidGlassCard>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="checkout-page">
        <motion.div 
          className="order-success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LiquidGlassCard glowColor="#D4AF37" intensity={0.8} borderRadius={28}>
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <CheckCircle size={80} style={{ color: '#D4AF37', marginBottom: '1.5rem' }} />
              <h1 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1rem' }}>¡Pedido Confirmado!</h1>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                Número de pedido: <strong style={{ color: '#D4AF37' }}>{orderNumber}</strong>
              </p>
              
              {paymentMethod === 'transfer' && (
                <LiquidGlassCard glowColor="#f59e0b" intensity={0.5} borderRadius={16} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1.5rem', textAlign: 'left' }}>
                    <h3 style={{ color: '#f59e0b', marginBottom: '1rem', textAlign: 'center' }}>🏦 Datos para Transferencia</h3>
                    {bankSettings?.bank_name && <p><strong>Banco:</strong> {bankSettings.bank_name}</p>}
                    {bankSettings?.bank_holder && <p><strong>Titular:</strong> {bankSettings.bank_holder}</p>}
                    {bankSettings?.bank_clabe && <p><strong>CLABE:</strong> <span style={{ fontFamily: 'monospace', letterSpacing: '1px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{bankSettings.bank_clabe}</span></p>}
                    {bankSettings?.bank_card && <p><strong>Tarjeta:</strong> <span style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>{bankSettings.bank_card}</span></p>}
                    <p style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(212, 175, 55, 0.15)', borderRadius: '8px' }}>
                      <strong>Referencia:</strong> <span style={{ color: '#D4AF37', fontFamily: 'monospace', fontSize: '1.1rem' }}>{orderNumber}</span>
                    </p>
                    <p><strong>Monto exacto:</strong> <span style={{ color: '#22c55e', fontSize: '1.2rem', fontWeight: 'bold' }}>{formatCurrency(total)}</span></p>
                    
                    {/* Sección de subir comprobante */}
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)', border: '2px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px' }}>
                      <h4 style={{ color: '#3b82f6', margin: '0 0 0.75rem', textAlign: 'center' }}>📤 ¿Dónde subir tu comprobante?</h4>
                      <p style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', margin: '0 0 1rem', fontSize: '0.95rem' }}>
                        Una vez realizada la transferencia, sube tu comprobante para confirmar tu pago:
                      </p>
                      <div style={{ textAlign: 'center' }}>
                        <Link to="/perfil">
                          <GlassButton variant="primary" size="md" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                            Ir a Mi Perfil → Mis Pedidos
                          </GlassButton>
                        </Link>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '0.75rem 0 0', fontSize: '0.85rem' }}>
                        En "Mis Pedidos" encontrarás la opción para subir el comprobante
                      </p>
                    </div>
                    
                    {bankSettings?.bank_instructions && (
                      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                        💡 {bankSettings.bank_instructions}
                      </p>
                    )}
                  </div>
                </LiquidGlassCard>
              )}
              
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                Te hemos enviado un correo con los detalles de tu pedido.
              </p>
              <div style={{ marginTop: '2rem' }}>
                <Link to="/">
                  <GlassButton variant="primary" size="lg">Volver a la Tienda</GlassButton>
                </Link>
              </div>
            </div>
          </LiquidGlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      
      <div className="checkout-container">
        <div className="checkout-header">
          <Link to="/">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft size={18} /> Volver a la tienda
            </GlassButton>
          </Link>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }}>Checkout</h1>
        </div>

        <div className="checkout-content">
          {/* Left Column - Forms */}
          <div className="checkout-forms">
            {/* Progress Steps */}
            <LiquidGlassCard glowColor="#D4AF37" intensity={0.4} borderRadius={16}>
              <div className="checkout-steps" style={{ padding: '1rem 1.5rem' }}>
                <div className={`step ${step >= 1 ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Envío</span>
                </div>
                <div className="step-line" />
                <div className={`step ${step >= 2 ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Método</span>
                </div>
                <div className="step-line" />
                <div className={`step ${step >= 3 ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-label">Revisar</span>
                </div>
                <div className="step-line" />
                <div className={`step ${step >= 4 ? 'active' : ''}`}>
                  <span className="step-number">4</span>
                  <span className="step-label">Pagar</span>
                </div>
              </div>
            </LiquidGlassCard>

            {/* Step 1: Shipping */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <LiquidGlassCard glowColor="#D4AF37" intensity={0.5} borderRadius={20} style={{ marginTop: '1.5rem' }}>
                  <div style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <Truck size={22} style={{ color: '#D4AF37' }} /> Información de Envío
                    </h2>
                    
                    {!token && (
                      <LiquidGlassCard glowColor="#D4AF37" intensity={0.3} borderRadius={12} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1rem', textAlign: 'center' }}>
                          <p style={{ margin: 0 }}>¿Ya tienes cuenta? <Link to="/login?redirect=/checkout" style={{ color: '#D4AF37' }}>Inicia sesión</Link> para completar más rápido</p>
                        </div>
                      </LiquidGlassCard>
                    )}

                    {/* Nombre completo */}
                    <div className="form-row">
                      <GlassInput label="Nombre(s) *" type="text" name="firstName" value={shippingData.firstName} onChange={handleInputChange} placeholder="Juan Carlos" required />
                    </div>
                    <div className="form-row">
                      <GlassInput label="Apellido Paterno *" type="text" name="lastName" value={shippingData.lastName} onChange={handleInputChange} placeholder="García" required />
                      <GlassInput label="Apellido Materno" type="text" name="lastName2" value={shippingData.lastName2} onChange={handleInputChange} placeholder="López" />
                    </div>

                    <GlassInput label="Email *" type="email" name="email" value={shippingData.email} onChange={handleInputChange} required />

                    {/* País y Estado */}
                    <div className="form-row">
                      <div className="form-group glass-select-wrapper">
                        <label>País *</label>
                        <select name="country" value={shippingData.country} onChange={handleInputChange} className="glass-select">
                          {COUNTRIES.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.name} ({country.phoneCode})
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedCountry && selectedCountry.states.length > 1 ? (
                        <div className="form-group glass-select-wrapper">
                          <label>Estado/Provincia *</label>
                          <select name="state" value={shippingData.state} onChange={handleInputChange} className="glass-select">
                            {selectedCountry?.states.map(state => (
                              <option key={state.name} value={state.name}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <GlassInput 
                          label="Estado/Provincia *" 
                          type="text" 
                          name="state" 
                          value={shippingData.state} 
                          onChange={handleInputChange} 
                          placeholder="Ingresa tu estado o provincia"
                          required 
                        />
                      )}
                    </div>

                    {/* Teléfono con LADA automática */}
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Teléfono *</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ 
                          background: 'rgba(212, 175, 55, 0.15)', 
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          color: '#D4AF37',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          whiteSpace: 'nowrap'
                        }}>
                          {selectedCountry?.phoneCode}{currentLada ? ` (${currentLada})` : ''}
                        </div>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={shippingData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder={currentLada ? "123 4567" : "Número completo"}
                          className="glass-input-field"
                          style={{ flex: 1 }}
                          required
                        />
                      </div>
                      <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                        Número completo: {fullPhoneNumber || 'Ingresa tu número'}
                      </small>
                    </div>

                    <GlassInput label="Calle y número *" type="text" name="street" value={shippingData.street} onChange={handleInputChange} placeholder="Av. Carranza 1234" required />
                    <GlassInput label="Colonia" type="text" name="colony" value={shippingData.colony} onChange={handleInputChange} placeholder="Centro" />

                    <div className="form-row">
                      <GlassInput label="Ciudad *" type="text" name="city" value={shippingData.city} onChange={handleInputChange} required />
                      <GlassInput label="C.P. *" type="text" name="zipCode" value={shippingData.zipCode} onChange={handleInputChange} placeholder="78000" required />
                    </div>

                    <GlassInput label="Notas del pedido (opcional)" name="notes" value={shippingData.notes} onChange={handleInputChange} placeholder="Instrucciones especiales de entrega..." multiline rows={3} />

                    <div style={{ marginTop: '1.5rem' }}>
                      <GlassButton variant="primary" size="lg" style={{ width: '100%' }} onClick={() => { if (validateShipping()) setStep(2); }}>
                        Continuar al Pago
                      </GlassButton>
                    </div>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <LiquidGlassCard glowColor="#D4AF37" intensity={0.5} borderRadius={20} style={{ marginTop: '1.5rem' }}>
                  <div style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <CreditCard size={22} style={{ color: '#D4AF37' }} /> Método de Pago
                    </h2>
                    
                    <div className="payment-methods" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div onClick={() => setPaymentMethod('mercadopago')} style={{ cursor: 'pointer' }}>
                        <LiquidGlassCard glowColor={paymentMethod === 'mercadopago' ? '#D4AF37' : '#ffffff'} intensity={paymentMethod === 'mercadopago' ? 0.7 : 0.2} borderRadius={12}>
                          <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="radio" name="payment" checked={paymentMethod === 'mercadopago'} onChange={() => setPaymentMethod('mercadopago')} />
                            <CreditCard size={28} style={{ color: '#D4AF37' }} />
                            <div>
                              <strong style={{ display: 'block' }}>MercadoPago</strong>
                              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Tarjeta, OXXO, transferencia y más</span>
                            </div>
                          </div>
                        </LiquidGlassCard>
                      </div>
                      
                      <div onClick={() => setPaymentMethod('transfer')} style={{ cursor: 'pointer' }}>
                        <LiquidGlassCard glowColor={paymentMethod === 'transfer' ? '#D4AF37' : '#ffffff'} intensity={paymentMethod === 'transfer' ? 0.7 : 0.2} borderRadius={12}>
                          <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="radio" name="payment" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} />
                            <Banknote size={28} style={{ color: '#D4AF37' }} />
                            <div>
                              <strong style={{ display: 'block' }}>Transferencia Bancaria / SPEI</strong>
                              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Recibirás los datos de pago por email</span>
                            </div>
                          </div>
                        </LiquidGlassCard>
                      </div>
                    </div>

                    <LiquidGlassCard glowColor="#22c55e" intensity={0.3} borderRadius={12} style={{ marginTop: '1.5rem' }}>
                      <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={20} style={{ color: '#22c55e' }} />
                        <span style={{ fontSize: '0.9rem' }}>Tus datos están protegidos con encriptación SSL</span>
                      </div>
                    </LiquidGlassCard>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                      <GlassButton variant="ghost" onClick={() => setStep(1)}>Volver</GlassButton>
                      <GlassButton variant="primary" size="lg" style={{ flex: 1 }} onClick={() => setStep(3)}>
                        Revisar Pedido
                      </GlassButton>
                    </div>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <LiquidGlassCard glowColor="#D4AF37" intensity={0.5} borderRadius={20} style={{ marginTop: '1.5rem' }}>
                  <div style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Confirmar Pedido</h2>
                    
                    <LiquidGlassCard glowColor="#D4AF37" intensity={0.3} borderRadius={12}>
                      <div style={{ padding: '1.25rem' }}>
                        <h3 style={{ color: '#D4AF37', marginBottom: '0.75rem', fontSize: '1rem' }}>Dirección de Envío</h3>
                        <p style={{ margin: '0.25rem 0', fontWeight: '600' }}>
                          {shippingData.firstName} {shippingData.lastName}{shippingData.lastName2 ? ` ${shippingData.lastName2}` : ''}
                        </p>
                        <p style={{ margin: '0.25rem 0' }}>{shippingData.street}</p>
                        {shippingData.colony && <p style={{ margin: '0.25rem 0' }}>{shippingData.colony}</p>}
                        <p style={{ margin: '0.25rem 0' }}>{shippingData.city}, {shippingData.state} {shippingData.zipCode}</p>
                        <p style={{ margin: '0.25rem 0' }}>{selectedCountry?.name}</p>
                        <p style={{ margin: '0.25rem 0', color: '#D4AF37' }}>📞 {fullPhoneNumber}</p>
                      </div>
                    </LiquidGlassCard>
                    
                    <LiquidGlassCard glowColor="#D4AF37" intensity={0.3} borderRadius={12} style={{ marginTop: '1rem' }}>
                      <div style={{ padding: '1.25rem' }}>
                        <h3 style={{ color: '#D4AF37', marginBottom: '0.75rem', fontSize: '1rem' }}>Método de Pago</h3>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                          {paymentMethod === 'mercadopago' ? <><CreditCard size={18} /> MercadoPago</> : <><Banknote size={18} /> Transferencia Bancaria</>}
                        </p>
                      </div>
                    </LiquidGlassCard>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                      <GlassButton variant="ghost" onClick={() => setStep(2)}>Volver</GlassButton>
                      <GlassButton variant="primary" size="lg" style={{ flex: 1 }} onClick={handleSubmitOrder} disabled={loading}>
                        {loading ? 'Procesando...' : paymentMethod === 'mercadopago' 
                          ? `Continuar al Pago`
                          : `Confirmar - ${formatCurrency(total)}`}
                      </GlassButton>
                    </div>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            )}

            {/* Step 4: Card Payment (MercadoPago Bricks) */}
            {step === 4 && showCardPayment && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <LiquidGlassCard glowColor="#D4AF37" intensity={0.5} borderRadius={20} style={{ marginTop: '1.5rem' }}>
                  <div style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <CreditCard size={22} style={{ color: '#D4AF37' }} /> Pagar con Tarjeta
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                      Pedido #{orderNumber} • Total: <strong style={{ color: '#D4AF37' }}>{formatCurrency(total)}</strong>
                    </p>
                    
                    {paymentError && (
                      <LiquidGlassCard glowColor="#ef4444" intensity={0.5} borderRadius={12} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span>⚠️</span>
                          <span>{paymentError}</span>
                        </div>
                      </LiquidGlassCard>
                    )}

                    <MercadoPagoCardPayment
                      orderId={orderId}
                      amount={total}
                      payerEmail={shippingData.email}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />

                    <LiquidGlassCard glowColor="#22c55e" intensity={0.3} borderRadius={12} style={{ marginTop: '1.5rem' }}>
                      <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={20} style={{ color: '#22c55e' }} />
                        <span style={{ fontSize: '0.9rem' }}>Pago seguro procesado por MercadoPago</span>
                      </div>
                    </LiquidGlassCard>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="checkout-summary">
            <LiquidGlassCard glowColor="#D4AF37" intensity={0.6} borderRadius={24}>
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontFamily: "'Playfair Display', serif" }}>Resumen del Pedido</h3>
                
                <div className="summary-items">
                  {items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                        <p style={{ color: '#D4AF37', fontSize: '0.9rem', margin: 0 }}>{formatCurrency(item.price)} c/u</p>
                        {item.alcoholContent && (
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '0.25rem 0 0' }}>
                            {item.alcoholContent}° {item.volume && `• ${item.volume}`}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}><Minus size={12} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer' }}><Plus size={12} /></button>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: '600' }}>{formatCurrency(item.price * item.quantity)}</span>
                        <button onClick={() => removeItem(item.id)} style={{ display: 'block', marginTop: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Envío</span>
                    <span style={{ color: shipping === 0 ? '#22c55e' : 'inherit' }}>{shipping === 0 ? 'GRATIS' : formatCurrency(shipping)}</span>
                  </div>
                  {shipping === 0 && (
                    <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>
                      🎉 ¡Envío gratis en pedidos +{formatCurrency(freeShippingMin)}!
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(212,175,55,0.3)', fontWeight: '700', fontSize: '1.2rem' }}>
                    <span>Total</span>
                    <span style={{ color: '#D4AF37' }}>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}><Shield size={16} style={{ color: '#D4AF37' }} /> Pago 100% Seguro</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}><Truck size={16} style={{ color: '#D4AF37' }} /> Envío Asegurado</div>
                </div>
              </div>
            </LiquidGlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
