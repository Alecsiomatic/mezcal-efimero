const { Address } = require('../models');

const addressController = {
  async getAll(req, res) {
    try {
      const addresses = await Address.findAll({
        where: { userId: req.user.id },
        order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
      });
      res.json({ addresses });
    } catch (error) {
      console.error('Error getting addresses:', error);
      res.status(500).json({ error: 'Error al obtener direcciones' });
    }
  },

  async getById(req, res) {
    try {
      const address = await Address.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });
      if (!address) {
        return res.status(404).json({ error: 'Direccion no encontrada' });
      }
      res.json({ address });
    } catch (error) {
      console.error('Error getting address:', error);
      res.status(500).json({ error: 'Error al obtener direccion' });
    }
  },

  async create(req, res) {
    try {
      const { name, street, number, colony, city, state, zipCode, country, phone, isDefault } = req.body;
      
      if (isDefault) {
        await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
      }
      
      const address = await Address.create({
        userId: req.user.id,
        name,
        street,
        number,
        colony,
        city,
        state,
        zipCode,
        country: country || 'Mexico',
        phone,
        isDefault: isDefault || false
      });
      
      res.status(201).json({ message: 'Direccion creada', address });
    } catch (error) {
      console.error('Error creating address:', error);
      res.status(500).json({ error: 'Error al crear direccion' });
    }
  },

  async update(req, res) {
    try {
      const address = await Address.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });
      if (!address) {
        return res.status(404).json({ error: 'Direccion no encontrada' });
      }
      
      const { isDefault } = req.body;
      if (isDefault) {
        await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
      }
      
      await address.update(req.body);
      res.json({ message: 'Direccion actualizada', address });
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({ error: 'Error al actualizar direccion' });
    }
  },

  async delete(req, res) {
    try {
      const address = await Address.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });
      if (!address) {
        return res.status(404).json({ error: 'Direccion no encontrada' });
      }
      await address.destroy();
      res.json({ message: 'Direccion eliminada' });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({ error: 'Error al eliminar direccion' });
    }
  },

  async setDefault(req, res) {
    try {
      const address = await Address.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });
      if (!address) {
        return res.status(404).json({ error: 'Direccion no encontrada' });
      }
      
      await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
      await address.update({ isDefault: true });
      
      res.json({ message: 'Direccion predeterminada actualizada', address });
    } catch (error) {
      console.error('Error setting default address:', error);
      res.status(500).json({ error: 'Error al establecer direccion predeterminada' });
    }
  }
};

module.exports = addressController;
