const { Product, Category, ProductImage } = require('../models');
const { Op } = require('sequelize');

const productController = {
  // Get all products (public)
  async getAll(req, res) {
    try {
      const { page = 1, limit = 12, category, excludeCategory, search, sort = 'createdAt', order = 'DESC', featured, minPrice, maxPrice } = req.query;
      
      console.log('getAll query params:', { category, featured, excludeCategory });
      
      const where = { isActive: true };
      
      if (category) {
        const cat = await Category.findOne({ where: { slug: category } });
        if (cat) where.categoryId = cat.id;
      }
      
      // Excluir productos de una categoría específica (por slug)
      if (excludeCategory) {
        const catToExclude = await Category.findOne({ where: { slug: excludeCategory } });
        if (catToExclude) {
          where.categoryId = { [Op.or]: [{ [Op.ne]: catToExclude.id }, { [Op.is]: null }] };
        }
      }
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { sku: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Filter by featured status (must be after category filter)
      if (featured === 'true' || featured === true) {
        where.isFeatured = true;
        console.log('Adding featured filter:', where.isFeatured);
      }
      if (minPrice) where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
      if (maxPrice) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };

      console.log('Final where clause:', JSON.stringify(where));
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const { count, rows } = await Product.findAndCountAll({
        where,
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
          { model: ProductImage, as: 'images', attributes: ['id', 'url', 'alt', 'isPrimary', 'order'] }
        ],
        order: [[sort, order.toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

      res.json({
        products: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit)),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Error al obtener productos.' });
    }
  },

  // Get single product by slug
  async getBySlug(req, res) {
    try {
      const product = await Product.findOne({
        where: { slug: req.params.slug, isActive: true },
        include: [
          { model: Category, as: 'category' },
          { model: ProductImage, as: 'images', order: [['order', 'ASC']] }
        ]
      });

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }

      // Increment views
      await product.increment('views');

      res.json({ product });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener producto.' });
    }
  },

  // Get featured products
  async getFeatured(req, res) {
    try {
      const products = await Product.findAll({
        where: { isActive: true, isFeatured: true },
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
          { model: ProductImage, as: 'images', where: { isPrimary: true }, required: false }
        ],
        limit: 8,
        order: [['createdAt', 'DESC']]
      });
      res.json({ products });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener productos destacados.' });
    }
  },

  // ADMIN: Get all products
  async adminGetAll(req, res) {
    try {
      const { page = 1, limit = 20, search, category, excludeCategory, status } = req.query;
      const where = {};
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { sku: { [Op.like]: `%${search}%` } }
        ];
      }
      if (category) where.categoryId = category;
      
      // Excluir productos de una categoría específica (por slug)
      if (excludeCategory) {
        const catToExclude = await Category.findOne({ where: { slug: excludeCategory } });
        if (catToExclude) {
          where.categoryId = { [Op.or]: [{ [Op.ne]: catToExclude.id }, { [Op.is]: null }] };
        }
      }
      
      if (status === 'active') where.isActive = true;
      if (status === 'inactive') where.isActive = false;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const { count, rows } = await Product.findAndCountAll({
        where,
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'] },
          { model: ProductImage, as: 'images' }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        products: rows,
        pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener productos.' });
    }
  },

  // ADMIN: Create product
  async create(req, res) {
    try {
      const product = await Product.create(req.body);
      
      // Handle images if provided
      if (req.body.images && req.body.images.length > 0) {
        const images = req.body.images.map((img, index) => ({
          ...img,
          productId: product.id,
          isPrimary: index === 0,
          order: index
        }));
        await ProductImage.bulkCreate(images);
      }

      const fullProduct = await Product.findByPk(product.id, {
        include: [{ model: Category, as: 'category' }, { model: ProductImage, as: 'images' }]
      });

      res.status(201).json({ message: 'Producto creado.', product: fullProduct });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Error al crear producto.' });
    }
  },

  // ADMIN: Update product
  async update(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }

      await product.update(req.body);

      // Update images if provided
      if (req.body.images) {
        await ProductImage.destroy({ where: { productId: product.id } });
        const images = req.body.images.map((img, index) => ({
          ...img,
          productId: product.id,
          isPrimary: index === 0,
          order: index
        }));
        await ProductImage.bulkCreate(images);
      }

      const fullProduct = await Product.findByPk(product.id, {
        include: [{ model: Category, as: 'category' }, { model: ProductImage, as: 'images' }]
      });

      res.json({ message: 'Producto actualizado.', product: fullProduct });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar producto.' });
    }
  },

  // ADMIN: Delete product
  async delete(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      await product.destroy();
      res.json({ message: 'Producto eliminado.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar producto.' });
    }
  },

  // ADMIN: Upload single product image (legacy support)
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó imagen.' });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ error: 'Error al subir imagen.' });
    }
  },

  // ADMIN: Upload multiple product images
  async uploadImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron imágenes.' });
      }
      const urls = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename
      }));
      res.json({ images: urls });
    } catch (error) {
      res.status(500).json({ error: 'Error al subir imágenes.' });
    }
  }
};

module.exports = productController;
