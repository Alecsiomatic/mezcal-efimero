import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import api from '../api/client';
import GlassButton from '../components/GlassButton';
import LiquidGlassCard from '../components/LiquidGlassCard';
import useCartStore from '../store/cartStore';
import '../App.css';

interface OrderDetails {
  orderNumber: string;
  total: number;
  status: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Clear cart on successful payment
    clearCart();
    
    // Fetch order details
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
          <LiquidGlassCard glowColor="#22c55e" intensity={0.8} borderRadius={28}>
            <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <CheckCircle size={100} style={{ color: '#22c55e', marginBottom: '1.5rem' }} />
              </motion.div>
              
              <h1 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1rem', color: '#22c55e' }}>
                ¡Pago Exitoso!
              </h1>
              
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                Tu pago ha sido procesado correctamente. Gracias por tu compra.
              </p>

              {loading ? (
                <p>Cargando detalles del pedido...</p>
              ) : order ? (
                <LiquidGlassCard glowColor="#D4AF37" intensity={0.4} borderRadius={16}>
                  <div style={{ padding: '1.5rem', textAlign: 'left' }}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '1rem', textAlign: 'center' }}>
                      Pedido #{order.orderNumber}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
                      <Package size={24} style={{ color: '#22c55e' }} />
                      <div>
                        <strong style={{ display: 'block' }}>Estado: Confirmado</strong>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Tu pedido está siendo preparado</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ margin: '0.25rem 0', color: 'rgba(255,255,255,0.7)' }}>
                        <strong>Envío a:</strong>
                      </p>
                      <p style={{ margin: '0.25rem 0' }}>{order.shippingFirstName} {order.shippingLastName}</p>
                      <p style={{ margin: '0.25rem 0' }}>{order.shippingAddress}</p>
                      <p style={{ margin: '0.25rem 0' }}>{order.shippingCity}, {order.shippingState}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <span>Total pagado:</span>
                      <strong style={{ color: '#D4AF37', fontSize: '1.2rem' }}>${order.total?.toLocaleString()} MXN</strong>
                    </div>
                  </div>
                </LiquidGlassCard>
              ) : null}

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                  Te hemos enviado un correo con los detalles de tu pedido y el seguimiento de envío.
                </p>
                
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
