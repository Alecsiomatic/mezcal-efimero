import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react';
import GlassButton from '../components/GlassButton';
import LiquidGlassCard from '../components/LiquidGlassCard';
import '../App.css';

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  searchParams.get('order'); // Para futuro tracking

  const handleRetry = () => {
    // Redirect back to checkout to retry payment
    window.location.href = '/checkout';
  };

  return (
    <div className="payment-result-page">
      
      <div className="payment-result-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LiquidGlassCard glowColor="#ef4444" intensity={0.8} borderRadius={28}>
            <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <XCircle size={100} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
              </motion.div>
              
              <h1 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1rem', color: '#ef4444' }}>
                Pago No Procesado
              </h1>
              
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                Hubo un problema al procesar tu pago. No te preocupes, no se realizó ningún cargo.
              </p>

              <LiquidGlassCard glowColor="#D4AF37" intensity={0.4} borderRadius={16}>
                <div style={{ padding: '1.5rem', textAlign: 'left' }}>
                  <h3 style={{ color: '#D4AF37', marginBottom: '1rem' }}>¿Qué puedo hacer?</h3>
                  
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'rgba(255,255,255,0.8)' }}>
                    <li style={{ marginBottom: '0.75rem' }}>Verifica que los datos de tu tarjeta sean correctos</li>
                    <li style={{ marginBottom: '0.75rem' }}>Asegúrate de tener fondos suficientes</li>
                    <li style={{ marginBottom: '0.75rem' }}>Intenta con otro método de pago (OXXO, transferencia)</li>
                    <li>Contacta a tu banco si el problema persiste</li>
                  </ul>
                </div>
              </LiquidGlassCard>

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <GlassButton variant="primary" size="lg" onClick={handleRetry}>
                    <RefreshCw size={18} /> Intentar de Nuevo
                  </GlassButton>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/">
                    <GlassButton variant="ghost" size="md">
                      Volver a la Tienda
                    </GlassButton>
                  </Link>
                  <a href="mailto:ventas@efimero.com">
                    <GlassButton variant="ghost" size="md">
                      <MessageCircle size={16} /> Contactar Soporte
                    </GlassButton>
                  </a>
                </div>
              </div>
            </div>
          </LiquidGlassCard>
        </motion.div>
      </div>
    </div>
  );
}
