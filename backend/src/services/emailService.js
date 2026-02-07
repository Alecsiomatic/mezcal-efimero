const nodemailer = require('nodemailer');
const { Setting } = require('../models');

class EmailService {
  constructor() {
    this.transporter = null;
    this.settings = {};
  }

  async loadSettings() {
    try {
      // Buscar settings de email
      const settings = await Setting.findAll({
        where: { 
          key: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'smtp_from_name', 'smtp_from_email', 'admin_notification_email', 'store_name', 'store_email']
        }
      });
      
      // IMPORTANTE: Hacer trim() a todos los valores para evitar espacios
      this.settings = settings.reduce((acc, s) => {
        acc[s.key] = s.value ? s.value.trim() : s.value;
        return acc;
      }, {});

      // Create transporter if settings exist
      if (this.settings.smtp_host && this.settings.smtp_user) {
        const port = parseInt(this.settings.smtp_port) || 587;
        const isSecure = port === 465 || this.settings.smtp_secure === 'true';
        
        this.transporter = nodemailer.createTransport({
          host: this.settings.smtp_host,
          port: port,
          secure: isSecure,
          auth: {
            user: this.settings.smtp_user,
            pass: this.settings.smtp_pass
          },
          tls: {
            rejectUnauthorized: false // Para evitar errores de certificado
          },
          debug: true, // Habilitar debug
          logger: false
        });
        
        console.log(`Email transporter configured: ${this.settings.smtp_host}:${port} (secure: ${isSecure})`);
        console.log(`Auth user: ${this.settings.smtp_user}`);
        console.log(`Auth pass length: ${this.settings.smtp_pass ? this.settings.smtp_pass.length : 0} chars`);
        console.log(`Auth pass first 3 chars: ${this.settings.smtp_pass ? this.settings.smtp_pass.substring(0, 3) : 'N/A'}***`);
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    await this.loadSettings();
    
    console.log('=== SENDING EMAIL ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Transporter exists:', !!this.transporter);
    
    if (!this.transporter) {
      console.log('Email not configured, skipping send');
      return { success: false, error: 'Email no configurado. Verifica la configuración SMTP.' };
    }

    try {
      console.log('Attempting to send email...');
      const mailOptions = {
        from: `"${this.settings.smtp_from_name || 'EFÍMERO Mezcal'}" <${this.settings.smtp_from_email || this.settings.smtp_user}>`,
        to,
        subject,
        text,
        html
      };
      console.log('From:', mailOptions.from);
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('=== EMAIL SENT SUCCESSFULLY ===');
      console.log('Message ID:', info.messageId);
      console.log('Response:', info.response);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('=== EMAIL SEND ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Full error:', error);
      
      // Mapear errores comunes a mensajes amigables
      let errorMessage = error.message;
      if (error.code === 'EAUTH') {
        errorMessage = 'Error de autenticación SMTP. Verifica el usuario y contraseña del correo.';
      } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        errorMessage = 'No se pudo conectar al servidor SMTP. Verifica el host y puerto.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Tiempo de espera agotado al conectar al servidor SMTP.';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Email Templates
  async sendOrderConfirmation(order, user) {
    const itemsHtml = order.items?.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #2a2a2a;">
          <strong style="color: #D4AF37;">${item.productName || item.name || 'Producto'}</strong><br>
          <span style="color: #888;">Cantidad: ${item.quantity}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #2a2a2a; text-align: right; color: #fff;">
          $${(item.price * item.quantity).toLocaleString()} MXN
        </td>
      </tr>
    `).join('') || '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #050403 0%, #1a1208 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #D4AF37; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: 300;">EFÍMERO</h1>
          <p style="color: #888; font-size: 12px; letter-spacing: 3px; margin-top: 8px;">MEZCAL ARTESANAL</p>
        </div>

        <!-- Main Card -->
        <div style="background: linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border-radius: 24px; border: 1px solid rgba(212, 175, 55, 0.2); padding: 40px; backdrop-filter: blur(10px);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #D4AF37 0%, #8B7355 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">✓</span>
            </div>
            <h2 style="color: #fff; font-size: 24px; margin: 0;">¡Pedido Confirmado!</h2>
            <p style="color: #888; margin-top: 10px;">Gracias por tu compra, ${user.firstName || 'estimado cliente'}</p>
          </div>

          <!-- Order Info -->
          <div style="background: rgba(0,0,0,0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #D4AF37; font-size: 14px; margin: 0 0 8px;">Número de Pedido</p>
            <p style="color: #fff; font-size: 20px; font-weight: 600; margin: 0;">#${order.orderNumber}</p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 12px; color: #888; font-weight: 500; border-bottom: 1px solid #2a2a2a;">Producto</th>
                <th style="text-align: right; padding: 12px; color: #888; font-weight: 500; border-bottom: 1px solid #2a2a2a;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="background: rgba(212, 175, 55, 0.1); border-radius: 12px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #888;">Subtotal</span>
              <span style="color: #fff;">$${order.subtotal?.toLocaleString() || '0'} MXN</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #888;">Envío</span>
              <span style="color: #fff;">$${order.shippingCost?.toLocaleString() || '0'} MXN</span>
            </div>
            ${order.discount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #22c55e;">Descuento</span>
              <span style="color: #22c55e;">-$${order.discount?.toLocaleString()} MXN</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 1px solid rgba(212, 175, 55, 0.3);">
              <span style="color: #D4AF37; font-size: 18px; font-weight: 600;">Total</span>
              <span style="color: #D4AF37; font-size: 18px; font-weight: 600;">$${order.total?.toLocaleString() || '0'} MXN</span>
            </div>
          </div>

          <!-- Shipping Address -->
          ${order.shippingAddress ? `
          <div style="margin-top: 24px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 12px;">
            <p style="color: #D4AF37; font-size: 14px; margin: 0 0 12px;">Dirección de Envío</p>
            <p style="color: #fff; margin: 0; line-height: 1.6;">
              ${order.shippingAddress.street}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
              ${order.shippingAddress.country}
            </p>
          </div>
          ` : ''}

        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px;">
          <p style="color: #888; font-size: 14px; margin: 0 0 20px;">
            ¿Preguntas? Contáctanos en <a href="mailto:contacto@efimero.mx" style="color: #D4AF37;">contacto@efimero.mx</a>
          </p>
          <p style="color: #555; font-size: 12px;">
            EFÍMERO Mezcal · San Luis Potosí, México<br>
            Creado sin prisa, disfrutado con tiempo
          </p>
        </div>

      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Pedido #${order.orderNumber} confirmado - EFÍMERO Mezcal`,
      html,
      text: `Tu pedido #${order.orderNumber} ha sido confirmado. Total: $${order.total} MXN`
    });
  }

  async sendOrderStatusUpdate(order, user, newStatus) {
    const statusMessages = {
      processing: { title: 'Pedido en Proceso', icon: '⚙️', color: '#3b82f6', message: 'Estamos preparando tu pedido con todo el cuidado que merece.' },
      shipped: { title: '¡En Camino!', icon: '🚚', color: '#22c55e', message: 'Tu mezcal ya va en camino. Pronto lo disfrutarás.' },
      delivered: { title: 'Entregado', icon: '✓', color: '#22c55e', message: '¡Tu pedido ha sido entregado! Disfruta tu mezcal.' },
      cancelled: { title: 'Pedido Cancelado', icon: '✕', color: '#ef4444', message: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.' }
    };

    const status = statusMessages[newStatus] || { title: 'Actualización', icon: '📦', color: '#D4AF37', message: 'Tu pedido ha sido actualizado.' };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #050403 0%, #1a1208 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #D4AF37; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: 300;">EFÍMERO</h1>
          <p style="color: #888; font-size: 12px; letter-spacing: 3px; margin-top: 8px;">MEZCAL ARTESANAL</p>
        </div>

        <div style="background: linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border-radius: 24px; border: 1px solid rgba(212, 175, 55, 0.2); padding: 40px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: ${status.color}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">${status.icon}</span>
            </div>
            <h2 style="color: #fff; font-size: 24px; margin: 0;">${status.title}</h2>
            <p style="color: #888; margin-top: 10px;">${status.message}</p>
          </div>

          <div style="background: rgba(0,0,0,0.3); border-radius: 16px; padding: 20px; text-align: center;">
            <p style="color: #888; font-size: 14px; margin: 0 0 8px;">Pedido</p>
            <p style="color: #D4AF37; font-size: 20px; font-weight: 600; margin: 0;">#${order.orderNumber}</p>
          </div>

        </div>

        <div style="text-align: center; margin-top: 40px;">
          <p style="color: #555; font-size: 12px;">
            EFÍMERO Mezcal · San Luis Potosí, México
          </p>
        </div>

      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `${status.title} - Pedido #${order.orderNumber}`,
      html,
      text: `${status.title}: ${status.message} Pedido #${order.orderNumber}`
    });
  }

  async sendWelcomeEmail(user) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #050403 0%, #1a1208 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #D4AF37; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: 300;">EFÍMERO</h1>
          <p style="color: #888; font-size: 12px; letter-spacing: 3px; margin-top: 8px;">MEZCAL ARTESANAL</p>
        </div>

        <div style="background: linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border-radius: 24px; border: 1px solid rgba(212, 175, 55, 0.2); padding: 40px; text-align: center;">
          
          <h2 style="color: #fff; font-size: 28px; margin: 0 0 20px;">¡Bienvenido, ${user.firstName || 'amigo'}!</h2>
          
          <p style="color: #888; line-height: 1.8; margin-bottom: 30px;">
            Gracias por unirte a la familia EFÍMERO. Ahora tienes acceso a nuestra exclusiva selección de mezcales artesanales de San Luis Potosí.
          </p>

          <div style="background: rgba(212, 175, 55, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 30px;">
            <p style="color: #D4AF37; font-size: 18px; font-style: italic; margin: 0;">
              "Creado sin prisa, disfrutado con tiempo"
            </p>
          </div>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #8B7355 100%); color: #000; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px;">
            Explorar Colección
          </a>

        </div>

        <div style="text-align: center; margin-top: 40px;">
          <p style="color: #555; font-size: 12px;">
            EFÍMERO Mezcal · San Luis Potosí, México
          </p>
        </div>

      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '¡Bienvenido a EFÍMERO Mezcal!',
      html,
      text: `¡Bienvenido a EFÍMERO Mezcal, ${user.firstName}! Gracias por unirte a nuestra familia.`
    });
  }

  async testConnection() {
    await this.loadSettings();
    
    if (!this.transporter) {
      return { success: false, error: 'Email no configurado' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Conexión SMTP exitosa' };
    } catch (error) {
      console.error('SMTP verify error:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar notificación al admin de nuevo pedido
  async sendAdminNewOrder(order, user) {
    await this.loadSettings();
    
    const adminEmails = this.settings.admin_notification_email;
    if (!adminEmails) {
      console.log('No admin email configured, skipping notification');
      return { success: false, error: 'No admin email configured' };
    }

    const itemsHtml = order.items?.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">${item.productName || item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; color: #D4AF37; text-align: right;">$${(item.price * item.quantity).toLocaleString()} MXN</td>
      </tr>
    `).join('') || '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background: #0a0806; font-family: 'Segoe UI', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 28px; letter-spacing: 6px; margin: 0;">EFÍMERO</h1>
          <p style="color: #888; font-size: 11px; letter-spacing: 2px;">NOTIFICACIÓN ADMIN</p>
        </div>

        <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 16px; padding: 30px;">
          
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="background: #22c55e; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 14px;">🛒 NUEVO PEDIDO</span>
          </div>

          <div style="background: rgba(0,0,0,0.4); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #D4AF37; font-size: 12px; margin: 0 0 5px;">Número de Pedido</p>
            <p style="color: #fff; font-size: 22px; font-weight: bold; margin: 0;">#${order.orderNumber}</p>
          </div>

          <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #888; font-size: 12px; margin: 0 0 10px;">CLIENTE</p>
            <p style="color: #fff; margin: 0; line-height: 1.6;">
              <strong>${user.firstName} ${user.lastName || ''}</strong><br>
              ${user.email}<br>
              ${user.phone || order.shippingPhone || 'Sin teléfono'}
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 10px; color: #888; font-size: 12px; border-bottom: 1px solid #333;">PRODUCTO</th>
                <th style="text-align: center; padding: 10px; color: #888; font-size: 12px; border-bottom: 1px solid #333;">CANT</th>
                <th style="text-align: right; padding: 10px; color: #888; font-size: 12px; border-bottom: 1px solid #333;">PRECIO</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="background: rgba(212, 175, 55, 0.15); border-radius: 10px; padding: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #888;">Subtotal</span>
              <span style="color: #fff;">$${order.subtotal?.toLocaleString() || '0'} MXN</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #888;">Envío</span>
              <span style="color: #fff;">$${(order.shipping || order.shippingCost || 0).toLocaleString()} MXN</span>
            </div>
            ${order.discount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #22c55e;">Descuento</span>
              <span style="color: #22c55e;">-$${order.discount?.toLocaleString()} MXN</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid rgba(212, 175, 55, 0.3);">
              <span style="color: #D4AF37; font-size: 18px; font-weight: bold;">TOTAL</span>
              <span style="color: #D4AF37; font-size: 18px; font-weight: bold;">$${order.total?.toLocaleString() || '0'} MXN</span>
            </div>
          </div>

          ${order.shippingAddress || order.shippingCity ? `
          <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px;">
            <p style="color: #888; font-size: 12px; margin: 0 0 8px;">DIRECCIÓN DE ENVÍO</p>
            <p style="color: #fff; margin: 0; line-height: 1.5;">
              ${order.shippingAddress || ''}<br>
              ${order.shippingCity || ''}, ${order.shippingState || ''} ${order.shippingZip || ''}<br>
              ${order.shippingCountry || 'México'}
            </p>
          </div>` : ''}

        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://mezcalefimero.com'}/admin/pedidos" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #8B7355 100%); color: #000; text-decoration: none; padding: 14px 30px; border-radius: 30px; font-weight: 600;">
            Ver en Admin
          </a>
        </div>

      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: adminEmails, // Puede ser múltiples emails separados por coma
      subject: `🛒 Nuevo Pedido #${order.orderNumber} - $${order.total?.toLocaleString()} MXN`,
      html,
      text: `Nuevo pedido #${order.orderNumber} de ${user.firstName} ${user.lastName || ''}. Total: $${order.total} MXN`
    });
  }

  // Enviar notificación al admin de pago recibido
  async sendAdminPaymentReceived(order, paymentInfo) {
    await this.loadSettings();
    
    const adminEmails = this.settings.admin_notification_email;
    if (!adminEmails) {
      return { success: false, error: 'No admin email configured' };
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background: #0a0806; font-family: 'Segoe UI', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #D4AF37; font-size: 28px; letter-spacing: 6px; margin: 0;">EFÍMERO</h1>
          <p style="color: #888; font-size: 11px; letter-spacing: 2px;">NOTIFICACIÓN ADMIN</p>
        </div>

        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 16px; padding: 30px;">
          
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="background: #22c55e; color: #fff; padding: 10px 20px; border-radius: 20px; font-size: 16px;">💰 PAGO RECIBIDO</span>
          </div>

          <div style="background: rgba(0,0,0,0.4); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0 0 5px;">Pedido</p>
            <p style="color: #D4AF37; font-size: 24px; font-weight: bold; margin: 0 0 15px;">#${order.orderNumber}</p>
            <p style="color: #22c55e; font-size: 32px; font-weight: bold; margin: 0;">$${order.total?.toLocaleString() || '0'} MXN</p>
          </div>

          <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #888;">Método de pago</span>
              <span style="color: #fff;">${paymentInfo.paymentMethod || 'Tarjeta'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #888;">ID de pago</span>
              <span style="color: #fff;">${paymentInfo.paymentId || paymentInfo.mpPaymentId || 'N/A'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #888;">Cliente</span>
              <span style="color: #fff;">${order.shippingEmail || 'N/A'}</span>
            </div>
          </div>

        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://mezcalefimero.com'}/admin/pedidos" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #fff; text-decoration: none; padding: 14px 30px; border-radius: 30px; font-weight: 600;">
            Ver Pedido
          </a>
        </div>

      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: adminEmails,
      subject: `💰 Pago Recibido - Pedido #${order.orderNumber} - $${order.total?.toLocaleString()} MXN`,
      html,
      text: `Pago recibido para pedido #${order.orderNumber}. Total: $${order.total} MXN`
    });
  }

  // Email para pedidos con transferencia bancaria
  async sendTransferOrderEmail(order, user, bankSettings) {
    const itemsHtml = order.items?.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #2a2a2a;">
          <strong style="color: #D4AF37;">${item.productName || item.name || 'Producto'}</strong><br>
          <span style="color: #888;">Cantidad: ${item.quantity}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #2a2a2a; text-align: right; color: #fff;">
          $${(item.price * item.quantity).toLocaleString()} MXN
        </td>
      </tr>
    `).join('') || '';

    const frontendUrl = process.env.FRONTEND_URL || 'https://mezcalefimero.com';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #050403 0%, #1a1208 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #D4AF37; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: 300;">EFÍMERO</h1>
          <p style="color: #888; font-size: 12px; letter-spacing: 3px; margin-top: 8px;">MEZCAL ARTESANAL</p>
        </div>

        <!-- Main Card -->
        <div style="background: linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%); border-radius: 24px; border: 1px solid rgba(212, 175, 55, 0.2); padding: 40px;">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">🏦</span>
            </div>
            <h2 style="color: #fff; font-size: 24px; margin: 0;">Pedido Pendiente de Pago</h2>
            <p style="color: #888; margin-top: 10px;">Gracias por tu pedido, ${user.firstName || 'estimado cliente'}</p>
          </div>

          <!-- Order Info -->
          <div style="background: rgba(0,0,0,0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #D4AF37; font-size: 14px; margin: 0 0 8px;">Número de Pedido</p>
            <p style="color: #fff; font-size: 20px; font-weight: 600; margin: 0;">#${order.orderNumber}</p>
          </div>

          <!-- DATOS BANCARIOS - IMPORTANTE -->
          <div style="background: linear-gradient(145deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%); border: 2px solid rgba(245, 158, 11, 0.4); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #f59e0b; font-size: 18px; margin: 0 0 16px; text-align: center;">💳 Datos para Transferencia</h3>
            
            ${bankSettings?.bank_name ? `<p style="margin: 8px 0; color: #fff;"><strong style="color: #888;">Banco:</strong> ${bankSettings.bank_name}</p>` : ''}
            ${bankSettings?.bank_holder ? `<p style="margin: 8px 0; color: #fff;"><strong style="color: #888;">Titular:</strong> ${bankSettings.bank_holder}</p>` : ''}
            ${bankSettings?.bank_clabe ? `<p style="margin: 8px 0; color: #fff;"><strong style="color: #888;">CLABE:</strong> <span style="font-family: monospace; letter-spacing: 2px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">${bankSettings.bank_clabe}</span></p>` : ''}
            ${bankSettings?.bank_card ? `<p style="margin: 8px 0; color: #fff;"><strong style="color: #888;">Tarjeta:</strong> <span style="font-family: monospace; letter-spacing: 2px;">${bankSettings.bank_card}</span></p>` : ''}
            
            <div style="margin-top: 16px; padding: 12px; background: rgba(212, 175, 55, 0.2); border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 4px; color: #888; font-size: 12px;">REFERENCIA (usa tu número de pedido)</p>
              <p style="margin: 0; color: #D4AF37; font-size: 20px; font-weight: bold; font-family: monospace;">${order.orderNumber}</p>
            </div>
            
            <div style="margin-top: 12px; padding: 12px; background: rgba(34, 197, 94, 0.15); border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 4px; color: #888; font-size: 12px;">MONTO EXACTO A TRANSFERIR</p>
              <p style="margin: 0; color: #22c55e; font-size: 28px; font-weight: bold;">$${order.total?.toLocaleString() || '0'} MXN</p>
            </div>
          </div>

          <!-- IMPORTANTE: SUBIR COMPROBANTE -->
          <div style="background: linear-gradient(145deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%); border: 2px solid rgba(59, 130, 246, 0.4); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #3b82f6; font-size: 18px; margin: 0 0 12px; text-align: center;">📤 ¿Dónde subir tu comprobante?</h3>
            <p style="color: #fff; text-align: center; margin: 0 0 16px; line-height: 1.6;">
              Una vez realizada la transferencia, sube tu comprobante para confirmar tu pago:
            </p>
            <div style="text-align: center;">
              <a href="${frontendUrl}/perfil" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                Ir a Mi Perfil → Mis Pedidos
              </a>
            </div>
            <p style="color: #888; text-align: center; margin: 16px 0 0; font-size: 13px;">
              En "Mis Pedidos" encontrarás la opción para subir el comprobante de este pedido.
            </p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 12px; color: #888; font-weight: 500; border-bottom: 1px solid #2a2a2a;">Producto</th>
                <th style="text-align: right; padding: 12px; color: #888; font-weight: 500; border-bottom: 1px solid #2a2a2a;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="background: rgba(212, 175, 55, 0.1); border-radius: 12px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #888;">Subtotal</span>
              <span style="color: #fff;">$${order.subtotal?.toLocaleString() || '0'} MXN</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #888;">Envío</span>
              <span style="color: #fff;">$${(order.shippingCost || order.shipping || 0).toLocaleString()} MXN</span>
            </div>
            ${order.discount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #22c55e;">Descuento</span>
              <span style="color: #22c55e;">-$${order.discount?.toLocaleString()} MXN</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 1px solid rgba(212, 175, 55, 0.3);">
              <span style="color: #D4AF37; font-size: 18px; font-weight: 600;">Total</span>
              <span style="color: #D4AF37; font-size: 18px; font-weight: 600;">$${order.total?.toLocaleString() || '0'} MXN</span>
            </div>
          </div>

          <!-- Shipping Address -->
          ${order.shippingAddress ? `
          <div style="margin-top: 24px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 12px;">
            <p style="color: #D4AF37; font-size: 14px; margin: 0 0 12px;">Dirección de Envío</p>
            <p style="color: #fff; margin: 0; line-height: 1.6;">
              ${order.shippingAddress.street || order.shippingAddress}<br>
              ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zipCode || ''}<br>
              ${order.shippingAddress.country || 'México'}
            </p>
          </div>
          ` : ''}

        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px;">
          <p style="color: #f59e0b; font-size: 14px; margin: 0 0 10px; font-weight: 600;">
            ⏰ Recuerda subir tu comprobante para procesar tu pedido
          </p>
          <p style="color: #888; font-size: 14px; margin: 0 0 20px;">
            ¿Preguntas? Contáctanos en <a href="mailto:mezcalefimeroslp@gmail.com" style="color: #D4AF37;">mezcalefimeroslp@gmail.com</a>
          </p>
          <p style="color: #555; font-size: 12px;">
            EFÍMERO Mezcal · San Luis Potosí, México<br>
            Creado sin prisa, disfrutado con tiempo
          </p>
        </div>

      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `🏦 Pedido #${order.orderNumber} - Datos para Transferencia - EFÍMERO Mezcal`,
      html,
      text: `Tu pedido #${order.orderNumber} está pendiente de pago por transferencia. Total: $${order.total} MXN. Sube tu comprobante en ${frontendUrl}/perfil`
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://mezcalefimero.com';
    const resetLink = `${frontendUrl}/restablecer-contraseña?token=${resetToken}`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a1a; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { width: 120px; margin-bottom: 20px; }
        h1 { color: #D4AF37; margin: 20px 0 10px; font-size: 24px; }
        p { color: #e0e0e0; line-height: 1.6; margin: 0 0 15px; }
        .highlight { color: #D4AF37; }
        .reset-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #D4AF37 0%, #c99f26 100%); 
          color: #000; 
          padding: 14px 32px; 
          border-radius: 8px; 
          text-decoration: none; 
          font-weight: 600; 
          margin: 20px 0; 
          font-size: 16px;
        }
        .reset-button:hover { background: linear-gradient(135deg, #e0be48 0%, #d4af37 100%); }
        .warning { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .warning-text { color: #fca5a5; font-size: 14px; }
        .footer { text-align: center; margin-top: 40px; color: #888; font-size: 12px; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 20px; }
        .footer a { color: #D4AF37; text-decoration: none; }
        .manual-link { background: rgba(212, 175, 55, 0.1); padding: 15px; border-radius: 4px; margin: 15px 0; word-break: break-all; }
        .manual-link p { color: #D4AF37; font-size: 12px; margin: 0 0 8px; }
        .manual-link code { color: #e0e0e0; font-family: monospace; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://efimero.com/logo-efimero.png" alt="EFÍMERO Mezcal" class="logo">
          <h1>🔐 Restablecer Contraseña</h1>
        </div>

        <p>Hola <span class="highlight">${user.firstName}</span>,</p>

        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no fuiste tú, puedes ignorar este correo.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" class="reset-button">Restablecer Contraseña</a>
        </p>

        <p style="text-align: center; color: #888; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
        
        <div class="manual-link">
          <p>Enlace de Recuperación:</p>
          <code>${resetLink}</code>
        </div>

        <div class="warning">
          <p class="warning-text">⏰ Este enlace vence en 1 hora por razones de seguridad.</p>
        </div>

        <p style="color: #888; font-size: 13px;">
          Si continúas teniendo problemas para acceder a tu cuenta, contacta a nuestro equipo de soporte.
        </p>

        <div class="footer">
          <p>EFÍMERO Mezcal · San Luis Potosí, México</p>
          <p>Creado sin prisa, disfrutado con tiempo</p>
          <p><a href="https://efimero.com">Visita nuestro sitio</a></p>
        </div>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🔐 Restablecer tu Contraseña - EFÍMERO Mezcal',
      html,
      text: `Tu enlace para restablecer la contraseña: ${resetLink}\n\nEste enlace vence en 1 hora.`
    });
  }
}

module.exports = new EmailService();
