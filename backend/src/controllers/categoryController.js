const { Category, Product } = require('../models');

const categoryController = {
  async getAll(req, res) {
    try {
      const categories = await Category.findAll({
        where: { isActive: true },
        order: [['order', 'ASC'], ['name', 'ASC']]
      });
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener categor\u00edas.' });
    }
  },

  async getBySlug(req, res) {
    try {
      const category = await Category.findOne({
        where: { slug: req.params.slug, isActive: true },
        include: [{ model: Product, as: 'products', where: { isActive: true }, required: false }]
      });
      if (!category) return res.status(404).json({ error: 'Categor\u00eda no encontrada.' });
      res.json({ category });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener categor\u00eda.' });
    }
  },

  // ADMIN
  async adminGetAll(req, res) {
    try {
      const categories = await Category.findAll({ order: [['order', 'ASC']] });
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener categor\u00edas.' });
    }
  },

  async create(req, res) {
    try {
      const category = await Category.create(req.body);
      res.status(201).json({ message: 'Categor\u00eda creada.', category });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear categor\u00eda.' });
    }
  },

  async update(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Categor\u00eda no encontrada.' });
      await category.update(req.body);
      res.json({ message: 'Categor\u00eda actualizada.', category });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar categor\u00eda.' });
    }
  },

  async delete(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ error: 'Categor\u00eda no encontrada.' });
      
      const productsCount = await Product.count({ where: { categoryId: category.id } });
      if (productsCount > 0) {
        return res.status(400).json({ error: 'No se puede eliminar. Hay productos asociados.' });
      }
      
      await category.destroy();
      res.json({ message: 'Categor\u00eda eliminada.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar categor\u00eda.' });
    }
  }
};

module.exports = categoryController;
