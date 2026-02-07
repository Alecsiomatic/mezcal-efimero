const { Coupon, sequelize } = require('../models');
const { Op } = require('sequelize');

const couponController = {
  // Validate coupon (public)
  async validate(req, res) {
    try {
      const { code, subtotal } = req.body;
      const coupon = await Coupon.findOne({
        where: {
          code: code.toUpperCase(),
          isActive: true,
          [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: new Date() } }],
          [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: new Date() } }],
          [Op.or]: [{ usageLimit: null }, { usageCount: { [Op.lt]: sequelize.col('usageLimit') } }]
        }
      });

      if (!coupon) return res.status(404).json({ error: 'Cup\u00f3n no v\u00e1lido o expirado.' });
      if (subtotal && subtotal < coupon.minPurchase) {
        return res.status(400).json({ error: `Compra m\u00ednima: $${coupon.minPurchase}` });
      }

      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = subtotal * (coupon.discountValue / 100);
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else {
        discount = coupon.discountValue;
      }

      res.json({ coupon, discount });
    } catch (error) {
      res.status(500).json({ error: 'Error al validar cup\u00f3n.' });
    }
  },

  // ADMIN: Get all coupons
  async getAll(req, res) {
    try {
      const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
      res.json({ coupons });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener cupones.' });
    }
  },

  // ADMIN: Create coupon
  async create(req, res) {
    try {
      const data = { ...req.body, code: req.body.code.toUpperCase() };
      const coupon = await Coupon.create(data);
      res.status(201).json({ message: 'Cup\u00f3n creado.', coupon });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'El c\u00f3digo ya existe.' });
      }
      res.status(500).json({ error: 'Error al crear cup\u00f3n.' });
    }
  },

  // ADMIN: Update coupon
  async update(req, res) {
    try {
      const coupon = await Coupon.findByPk(req.params.id);
      if (!coupon) return res.status(404).json({ error: 'Cup\u00f3n no encontrado.' });
      
      const data = { ...req.body };
      if (data.code) data.code = data.code.toUpperCase();
      
      await coupon.update(data);
      res.json({ message: 'Cup\u00f3n actualizado.', coupon });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar cup\u00f3n.' });
    }
  },

  // ADMIN: Delete coupon
  async delete(req, res) {
    try {
      const coupon = await Coupon.findByPk(req.params.id);
      if (!coupon) return res.status(404).json({ error: 'Cup\u00f3n no encontrado.' });
      await coupon.destroy();
      res.json({ message: 'Cup\u00f3n eliminado.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar cup\u00f3n.' });
    }
  }
};

module.exports = couponController;
