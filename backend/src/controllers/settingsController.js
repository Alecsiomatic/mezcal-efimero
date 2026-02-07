const { Setting } = require('../models');

const settingsController = {
  // Get all settings (as array for admin panel)
  async getAll(req, res) {
    try {
      const settings = await Setting.findAll();
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener configuración.' });
    }
  },

  // Get settings by group
  async getByGroup(req, res) {
    try {
      const settings = await Setting.findAll({ where: { group: req.params.group } });
      const result = settings.reduce((acc, s) => {
        let value = s.value;
        if (s.type === 'number') value = parseFloat(value);
        else if (s.type === 'boolean') value = value === 'true';
        else if (s.type === 'json') value = JSON.parse(value || '{}');
        acc[s.key] = value;
        return acc;
      }, {});
      res.json({ settings: result });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener configuraci\u00f3n.' });
    }
  },

  // Get single setting
  async get(req, res) {
    try {
      const setting = await Setting.findOne({ where: { key: req.params.key } });
      if (!setting) return res.status(404).json({ error: 'Configuraci\u00f3n no encontrada.' });
      res.json({ setting });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener configuraci\u00f3n.' });
    }
  },

  // Update or create setting
  async update(req, res) {
    try {
      const { key, value, type = 'string', group = 'general', description } = req.body;
      
      const [setting, created] = await Setting.upsert({
        key,
        value: type === 'json' ? JSON.stringify(value) : String(value),
        type,
        group,
        description
      });

      res.json({ message: created ? 'Configuraci\u00f3n creada.' : 'Configuraci\u00f3n actualizada.', setting });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar configuraci\u00f3n.' });
    }
  },

  // Bulk update settings
  async bulkUpdate(req, res) {
    try {
      const { settings } = req.body;
      
      for (const s of settings) {
        await Setting.upsert({
          key: s.key,
          value: s.type === 'json' ? JSON.stringify(s.value) : String(s.value),
          type: s.type || 'string',
          group: s.group || 'general',
          description: s.description
        });
      }

      res.json({ message: 'Configuraciones actualizadas.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar configuraciones.' });
    }
  },

  // Initialize default settings
  async initDefaults(req, res) {
    try {
      const defaults = [
        { key: 'store_name', value: 'EF\u00cdMERO Mezcal', type: 'string', group: 'general' },
        { key: 'store_email', value: 'contacto@efimero.com', type: 'string', group: 'general' },
        { key: 'store_phone', value: '+52 951 123 4567', type: 'string', group: 'general' },
        { key: 'store_address', value: 'Santiago Matatl\u00e1n, Oaxaca, M\u00e9xico', type: 'string', group: 'general' },
        { key: 'currency', value: 'MXN', type: 'string', group: 'general' },
        { key: 'tax_rate', value: '16', type: 'number', group: 'general' },
        { key: 'shipping_cost', value: '150', type: 'number', group: 'shipping' },
        { key: 'free_shipping_min', value: '1500', type: 'number', group: 'shipping' },
        { key: 'delivery_time', value: '3 d\u00edas h\u00e1biles', type: 'string', group: 'shipping' },
        { key: 'mp_access_token', value: '', type: 'string', group: 'mercadopago' },
        { key: 'mp_public_key', value: '', type: 'string', group: 'mercadopago' },
        { key: 'mp_sandbox', value: 'true', type: 'boolean', group: 'mercadopago' }
      ];

      for (const d of defaults) {
        await Setting.findOrCreate({ where: { key: d.key }, defaults: d });
      }

      res.json({ message: 'Configuraciones inicializadas.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al inicializar configuraciones.' });
    }
  }
};

module.exports = settingsController;
