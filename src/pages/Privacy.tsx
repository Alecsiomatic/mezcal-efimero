import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import GlassButton from '../components/GlassButton';
import LiquidGlassCard from '../components/LiquidGlassCard';
import '../App.css';

export default function Privacy() {
  return (
    <div className="legal-page">
      
      <div className="legal-container">
        <div className="legal-header">
          <Link to="/">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft size={18} /> Volver
            </GlassButton>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LiquidGlassCard glowColor="#D4AF37" intensity={0.5} borderRadius={24}>
            <div className="legal-content" style={{ padding: '3rem' }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '2rem', color: '#D4AF37' }}>
                Política de Privacidad
              </h1>

              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>
                Última actualización: Enero 2026
              </p>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>1. Introducción</h2>
                <p>En Efímero Mezcal nos comprometemos a proteger su privacidad. Esta Política de Privacidad explica cómo recopilamos, utilizamos y protegemos su información personal cuando utiliza nuestro sitio web.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>2. Información que Recopilamos</h2>
                <p>Recopilamos la siguiente información:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li><strong>Información de contacto:</strong> nombre, apellido, correo electrónico, número de teléfono</li>
                  <li><strong>Información de envío:</strong> dirección, ciudad, estado, código postal</li>
                  <li><strong>Información de pago:</strong> procesada de forma segura a través de MercadoPago (no almacenamos datos de tarjetas)</li>
                  <li><strong>Información de uso:</strong> páginas visitadas, productos vistos, historial de compras</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>3. Uso de la Información</h2>
                <p>Utilizamos su información para:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Procesar y enviar sus pedidos</li>
                  <li>Comunicarnos con usted sobre su pedido</li>
                  <li>Enviar información promocional (solo si ha dado su consentimiento)</li>
                  <li>Mejorar nuestros productos y servicios</li>
                  <li>Prevenir fraudes y garantizar la seguridad</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>4. Protección de Datos</h2>
                <p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal, incluyendo:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Encriptación SSL en todas las transacciones</li>
                  <li>Acceso restringido a datos personales</li>
                  <li>Monitoreo constante de seguridad</li>
                  <li>Procesamiento de pagos a través de plataformas certificadas (MercadoPago)</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>5. Compartir Información</h2>
                <p>No vendemos ni compartimos su información personal con terceros, excepto:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Proveedores de servicios de envío para entregar sus pedidos</li>
                  <li>Procesadores de pago para completar sus transacciones</li>
                  <li>Cuando sea requerido por ley</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>6. Cookies</h2>
                <p>Utilizamos cookies para mejorar su experiencia en nuestro sitio. Las cookies nos permiten:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Recordar su carrito de compras</li>
                  <li>Mantener su sesión iniciada</li>
                  <li>Analizar el tráfico del sitio</li>
                  <li>Personalizar su experiencia</li>
                </ul>
                <p style={{ marginTop: '0.5rem' }}>Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del sitio.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>7. Sus Derechos</h2>
                <p>De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, usted tiene derecho a:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li><strong>Acceso:</strong> Conocer qué datos tenemos sobre usted</li>
                  <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                  <li><strong>Cancelación:</strong> Solicitar la eliminación de sus datos</li>
                  <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
                </ul>
                <p style={{ marginTop: '0.5rem' }}>Para ejercer estos derechos, contáctenos a privacidad@efimero.com</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>8. Retención de Datos</h2>
                <p>Conservamos su información personal mientras sea necesario para cumplir con los fines para los que fue recopilada, incluyendo obligaciones legales, fiscales y de contabilidad.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>9. Menores de Edad</h2>
                <p>Nuestro sitio no está dirigido a menores de 18 años y no recopilamos intencionalmente información de menores. Si detectamos que hemos recopilado información de un menor, la eliminaremos inmediatamente.</p>
              </section>

              <section>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>10. Contacto</h2>
                <p>Para preguntas sobre esta Política de Privacidad, contáctenos:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Email: privacidad@efimero.com</li>
                  <li>Teléfono: +52 444 249 9873</li>
                  <li>Dirección: San Luis Potosí, México</li>
                </ul>
              </section>
            </div>
          </LiquidGlassCard>
        </motion.div>
      </div>
    </div>
  );
}
