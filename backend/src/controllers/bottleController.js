const { Bottle, Product, ProductImage, Category } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las botellas (público - solo activas con stock)
exports.getAll = async (req, res) => {
  try {
    const bottles = await Bottle.findAll({
      where: { 
        isActive: true,
        stock: { [Op.gt]: 0 }
      },
      order: [['name', 'ASC']]
    });
    res.json({ bottles });
  } catch (error) {
    console.error('Error fetching bottles:', error);
    res.status(500).json({ error: 'Error al obtener botellas' });
  }
};

// Admin: Obtener todas las botellas (incluyendo inactivas)
exports.adminGetAll = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { material: { [Op.like]: `%${search}%` } }
      ];
    }

    const bottles = await Bottle.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ bottles });
  } catch (error) {
    console.error('Error fetching bottles:', error);
    res.status(500).json({ error: 'Error al obtener botellas' });
  }
};

// Admin: Crear botella
exports.create = async (req, res) => {
  try {
    const { name, description, image, price, stock, isActive, capacity, material, categoryId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const bottle = await Bottle.create({
      name,
      description,
      image,
      price: price || 0,
      stock: stock || 0,
      isActive: isActive !== false,
      capacity,
      material,
      categoryId: categoryId || null
    });

    res.status(201).json({ bottle, message: 'Botella creada exitosamente' });
  } catch (error) {
    console.error('Error creating bottle:', error);
    res.status(500).json({ error: 'Error al crear botella' });
  }
};

// Admin: Actualizar botella
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, price, stock, isActive, capacity, material, categoryId } = req.body;

    const bottle = await Bottle.findByPk(id);
    if (!bottle) {
      return res.status(404).json({ error: 'Botella no encontrada' });
    }

    await bottle.update({
      name: name !== undefined ? name : bottle.name,
      description: description !== undefined ? description : bottle.description,
      image: image !== undefined ? image : bottle.image,
      price: price !== undefined ? price : bottle.price,
      stock: stock !== undefined ? stock : bottle.stock,
      isActive: isActive !== undefined ? isActive : bottle.isActive,
      capacity: capacity !== undefined ? capacity : bottle.capacity,
      material: material !== undefined ? material : bottle.material,
      categoryId: categoryId !== undefined ? categoryId : bottle.categoryId
    });

    res.json({ bottle, message: 'Botella actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating bottle:', error);
    res.status(500).json({ error: 'Error al actualizar botella' });
  }
};

// Admin: Eliminar botella
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const bottle = await Bottle.findByPk(id);
    if (!bottle) {
      return res.status(404).json({ error: 'Botella no encontrada' });
    }

    await bottle.destroy();
    res.json({ message: 'Botella eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting bottle:', error);
    res.status(500).json({ error: 'Error al eliminar botella' });
  }
};

// Admin: Subir imagen de botella
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }
    
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, message: 'Imagen subida exitosamente' });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
};

// Obtener una botella por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const bottle = await Bottle.findByPk(id);
    
    if (!bottle) {
      return res.status(404).json({ error: 'Botella no encontrada' });
    }

    res.json({ bottle });
  } catch (error) {
    console.error('Error fetching bottle:', error);
    res.status(500).json({ error: 'Error al obtener botella' });
  }
};

// Admin: Convertir botella a producto
exports.convertToProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;

    const bottle = await Bottle.findByPk(id);
    if (!bottle) {
      return res.status(404).json({ error: 'Botella no encontrada' });
    }

    // Verificar que la categoría existe
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Categoría no válida' });
      }
    }

    // Generar SKU único
    const sku = `BOT-${bottle.id}-${Date.now().toString(36).toUpperCase()}`;

    // Crear producto desde la botella
    const product = await Product.create({
      name: bottle.name,
      description: bottle.description,
      sku,
      price: bottle.price,
      stock: bottle.stock,
      isActive: bottle.isActive,
      categoryId: categoryId || null,
      volume: bottle.capacity || null,
      agaveType: bottle.material || null, // Usamos agaveType para guardar el material
    });

    // Si la botella tiene imagen, crear ProductImage
    if (bottle.image) {
      await ProductImage.create({
        productId: product.id,
        url: bottle.image,
        isPrimary: true,
        order: 0
      });
    }

    // Marcar la botella como inactiva (para no duplicar)
    await bottle.update({ isActive: false });

    res.json({ 
      product, 
      message: 'Botella convertida a producto exitosamente',
      note: 'La botella original ha sido marcada como inactiva'
    });
  } catch (error) {
    console.error('Error converting bottle to product:', error);
    res.status(500).json({ error: 'Error al convertir botella a producto' });
  }
};
