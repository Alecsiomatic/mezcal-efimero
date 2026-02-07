import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, ArrowRight, Mail } from 'lucide-react';
import api from '../api/client';
import GlassButton from '../components/GlassButton';
import LiquidGlassCard from '../components/LiquidGlassCard';
import useCartStore from '../store/cartStore';
import '../App.css';

interface OrderDetails {
  orderNumber: string;
  total: number;
}

export default function PaymentPending() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [, setLoading] = useState(true);
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();
    
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data.order);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, clearCart]);

  return (
    <div className="payment-result-page">
      
      <div className="payment-result-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LiquidGlassCard glowColor="#f59e0b" intensity={0.8} borderRadius={28}>
            <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <Clock size={100} style={{ color: '#f59e0b', marginBottom: '1.5rem' }} />
              </motion.div>
              
              <h1 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1rem', color: '#f59e0b' }}>
                Pago en Proceso
              </h1>
              
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                Tu pago está siendo procesado. Esto puede tomar unos minutos.
              </p>

              {order && (
                <LiquidGlassCard glowColor="#D4AF37" intensity={0.4} borderRadius={16}>
                  <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>
                      Pedido #{order.orderNumber}
                    </h3>
                    <p style={{ margin: 0 }}>
                      Total: <strong style={{ color: '#D4AF37' }}>${order.total?.toLocaleString()} MXN</strong>
                    </p>
                  </div>
                </LiquidGlassCard>
              )}

              <LiquidGlassCard glowColor="#f59e0b" intensity={0.3} borderRadius={12} style={{ marginTop: '1.5rem' }}>
                <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', textAlign: 'left' }}>
                  <AlertCircle size={24} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>¿Qué significa esto?</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                      Si elegiste pagar en OXXO u otro punto de pago, tienes hasta 3 días para completar el pago. 
                      Te notificaremos por correo cuando el pago sea confirmado.
                    </p>
                  </div>
                </div>
              </LiquidGlassCard>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                  <Mail size={16} />
                  <span>Recibirás un correo cuando se confirme tu pago</span>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/">
                    <GlassButton variant="primary" size="lg">
                      Volver a la Tienda <ArrowRight size={18} />
                    </GlassButton>
                  </Link>
                </div>
              </div>
            </div>
          </LiquidGlassCard>
        </motion.div>
      </div>
    </div>
  );
}
