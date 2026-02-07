const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, isAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { Setting } = require('../models');

// Special public endpoint for MercadoPago (only exposes public key, NOT access token)
router.get('/public/mercadopago', async (req, res) => {
  try {
    const publicKey = await Setting.findOne({ where: { key: 'mp_public_key' } });
    const sandbox = await Setting.findOne({ where: { key: 'mp_sandbox' } });
    res.json({ 
      settings: {
        mp_public_key: publicKey?.value || '',
        mp_sandbox: sandbox?.value === 'true'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración.' });
  }
});

// Public endpoint for bank transfer data (safe - no sensitive info)
router.get('/public/transfer', async (req, res) => {
  try {
    const keys = ['bank_name', 'bank_holder', 'bank_clabe', 'bank_card', 'bank_email', 'bank_instructions', 'transfer_enabled'];
    const settings = await Setting.findAll({ where: { key: keys } });
    
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    
    // Only return if transfer is enabled
    if (result.transfer_enabled !== 'true') {
      return res.json({ settings: { transfer_enabled: false } });
    }
    
    res.json({ settings: result });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración.' });
  }
});

// Public endpoints (generic)
router.get('/public/:group', settingsController.getByGroup);

// Admin
router.get('/', authenticate, isAdmin, settingsController.getAll);
router.get('/group/:group', authenticate, isAdmin, settingsController.getByGroup);
router.get('/:key', authenticate, isAdmin, settingsController.get);
router.post('/', authenticate, isAdmin, settingsController.update);
router.put('/', authenticate, isAdmin, settingsController.bulkUpdate);
router.post('/bulk', authenticate, isAdmin, settingsController.bulkUpdate);
router.post('/init', authenticate, isAdmin, settingsController.initDefaults);

// Test email connection AND send test email
router.post('/test-email', authenticate, isAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Si no se proporciona email, solo probar conexión
    if (!email) {
      const result = await emailService.testConnection();
      return res.json(result);
    }
    
    // Si se proporciona email, enviar email de prueba
    const result = await emailService.sendEmail({
      to: email,
      subject: '✅ Test SMTP - EFÍMERO Mezcal',
      html: `
        <div style="background: linear-gradient(135deg, #050403 0%, #1a1208 100%); padding: 40px; text-align: center; font-family: 'Segoe UI', sans-serif; border-radius: 16px;">
          <h1 style="color: #D4AF37; letter-spacing: 8px; font-weight: 300; margin: 0 0 10px;">EFÍMERO</h1>
          <p style="color: #888; font-size: 12px; letter-spacing: 3px; margin: 0 0 30px;">MEZCAL ARTESANAL</p>
          <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #22c55e; font-size: 24px; margin: 0;">✓ Configuración Correcta</p>
          </div>
          <p style="color: #888; margin-top: 20px;">El servidor SMTP está funcionando correctamente.</p>
          <p style="color: #555; font-size: 12px; margin-top: 30px;">EFÍMERO Mezcal · San Luis Potosí, México</p>
        </div>
      `,
      text: 'Este es un email de prueba de EFÍMERO Mezcal. ¡Tu configuración SMTP está funcionando!'
    });
    
    if (result.success) {
      res.json({ success: true, message: 'Email de prueba enviado correctamente', messageId: result.messageId });
    } else {
      res.json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send test email
router.post('/send-test-email', authenticate, isAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await emailService.sendEmail({
      to: email,
      subject: 'Test - EFÍMERO Mezcal',
      html: `
        <div style="background: #0a0806; padding: 40px; text-align: center; font-family: sans-serif;">
          <h1 style="color: #D4AF37; letter-spacing: 5px;">EFÍMERO</h1>
          <p style="color: #888;">Este es un email de prueba.</p>
          <p style="color: #22c55e; font-weight: bold;">✓ Configuración correcta</p>
        </div>
      `,
      text: 'Este es un email de prueba de EFÍMERO Mezcal.'
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate MercadoPago credentials
router.post('/validate-mercadopago', authenticate, isAdmin, async (req, res) => {
  try {
    const { accessToken, publicKey } = req.body;
    
    if (!accessToken || !publicKey) {
      return res.status(400).json({ valid: false, error: 'Access Token y Public Key son requeridos' });
    }
    
    // Validate Access Token by calling MercadoPago API
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.json({ 
        valid: false, 
        error: `Access Token inválido: ${errorData.message || 'No autorizado'}` 
      });
    }
    
    const userData = await response.json();
    
    // Validate Public Key format
    if (!publicKey.startsWith('APP_USR-')) {
      return res.json({ valid: false, error: 'Public Key debe comenzar con APP_USR-' });
    }
    
    // Check if site_id exists (account is properly configured)
    if (!userData.site_id) {
      return res.json({ valid: false, error: 'La cuenta de MercadoPago no está completamente configurada' });
    }
    
    res.json({ 
      valid: true, 
      email: userData.email,
      siteId: userData.site_id,
      nickname: userData.nickname
    });
  } catch (error) {
    console.error('MercadoPago validation error:', error);
    res.status(500).json({ valid: false, error: 'Error al validar credenciales' });
  }
});

module.exports = router;
