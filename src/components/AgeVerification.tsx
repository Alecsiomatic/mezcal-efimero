import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import GlassButton from './GlassButton';
import LiquidGlassCard from './LiquidGlassCard';
import './AgeVerification.css';

interface AgeVerificationProps {
  onVerified: () => void;
}

export default function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user already verified age
    const verified = localStorage.getItem('age_verified');
    if (!verified) {
      setShow(true);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem('age_verified', 'true');
    localStorage.setItem('age_verified_date', new Date().toISOString());
    document.body.style.overflow = 'auto';
    setShow(false);
    onVerified();
  };

  const handleDeny = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="age-verification-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <LiquidGlassCard 
              className="age-verification-modal" 
              glowColor="#D4AF37" 
              intensity={0.8} 
              borderRadius={24}
              animate={false}
            >
              <div className="age-verification-content">
                <img 
                  src="/logo-efimero.png" 
                  alt="Efímero" 
                  className="age-verification-logo" 
                />
                
                <h2>Verificación de Edad</h2>
                
                <p className="age-verification-text">
                  Este sitio contiene información sobre bebidas alcohólicas y está 
                  destinado exclusivamente para mayores de edad.
                </p>
                
                <p className="age-verification-question">
                  ¿Eres mayor de 18 años?
                </p>

                <div className="age-verification-buttons">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <GlassButton variant="primary" size="lg" onClick={handleVerify}>
                      Sí, soy mayor de 18
                    </GlassButton>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <GlassButton variant="ghost" size="lg" onClick={handleDeny}>
                      No, soy menor
                    </GlassButton>
                  </motion.div>
                </div>

                <p className="age-verification-disclaimer">
                  Al ingresar, confirmas que tienes la edad legal para consumir 
                  alcohol en tu país de residencia y aceptas nuestros{' '}
                  <a href="/terminos">Términos y Condiciones</a>.
                </p>

                <p className="age-verification-warning">
                  🍃 El consumo excesivo de alcohol es dañino para la salud. 
                  Bebe con moderación.
                </p>
              </div>
            </LiquidGlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
