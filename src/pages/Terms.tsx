import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import GlassButton from '../components/GlassButton';
import LiquidGlassCard from '../components/LiquidGlassCard';
import '../App.css';

export default function Terms() {
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
                Términos y Condiciones
              </h1>

              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>
                Última actualización: Enero 2026
              </p>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>1. Aceptación de los Términos</h2>
                <p>Al acceder y utilizar el sitio web de Efímero Mezcal (en adelante "el Sitio"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al Sitio.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>2. Requisitos de Edad</h2>
                <p>El acceso a este sitio y la compra de nuestros productos está restringido exclusivamente a personas mayores de 18 años. Al utilizar este sitio, usted declara y garantiza que tiene al menos 18 años de edad. Nos reservamos el derecho de solicitar identificación oficial para verificar su edad antes de procesar cualquier pedido.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>3. Productos y Precios</h2>
                <p>Todos los precios mostrados en el Sitio están expresados en Pesos Mexicanos (MXN) e incluyen IVA. Nos reservamos el derecho de modificar los precios sin previo aviso. Las imágenes de los productos son ilustrativas y pueden variar ligeramente del producto final debido a su naturaleza artesanal.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>4. Proceso de Compra</h2>
                <p>Al realizar un pedido, usted está realizando una oferta para comprar un producto. Nos reservamos el derecho de aceptar o rechazar su pedido. Una vez que su pedido sea confirmado, recibirá un correo electrónico de confirmación con los detalles de su compra.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>5. Métodos de Pago</h2>
                <p>Aceptamos pagos a través de MercadoPago (tarjetas de crédito/débito, OXXO, transferencia bancaria) y transferencias bancarias directas (SPEI). Todos los pagos son procesados de forma segura.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>6. Envíos</h2>
                <p>Realizamos envíos a toda la República Mexicana. Los tiempos de entrega varían según la ubicación. El envío es gratuito en pedidos mayores a $1,500 MXN. Para pedidos menores, el costo de envío es de $150 MXN. Los productos son empacados con materiales especiales para garantizar su llegada en perfectas condiciones.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>7. Política de Devoluciones</h2>
                <p>Debido a la naturaleza de nuestros productos (bebidas alcohólicas), solo aceptamos devoluciones en caso de productos defectuosos o dañados durante el envío. En estos casos, debe notificarnos dentro de las 48 horas posteriores a la recepción del producto, adjuntando evidencia fotográfica.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>8. Propiedad Intelectual</h2>
                <p>Todo el contenido del Sitio, incluyendo pero no limitado a textos, gráficos, logotipos, imágenes, y software, es propiedad de Efímero Mezcal y está protegido por las leyes de propiedad intelectual aplicables.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>9. Consumo Responsable</h2>
                <p>Efímero Mezcal promueve el consumo responsable de bebidas alcohólicas. El abuso en el consumo de alcohol es nocivo para la salud. Evite el exceso.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>10. Contacto</h2>
                <p>Para cualquier consulta relacionada con estos Términos y Condiciones, puede contactarnos a través de:</p>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Email: ventas@efimero.com</li>
                  <li>Teléfono: +52 444 249 9873</li>
                </ul>
              </section>

              <section>
                <h2 style={{ color: '#D4AF37', marginBottom: '1rem' }}>11. Modificaciones</h2>
                <p>Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en el Sitio.</p>
              </section>
            </div>
          </LiquidGlassCard>
        </motion.div>
      </div>
    </div>
  );
}
