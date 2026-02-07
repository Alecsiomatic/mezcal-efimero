const { Cart, CartItem, Product, ProductImage } = require('../models');

const cartController = {
  async getCart(req, res) {
    try {
      let cart = await Cart.findOne({
        where: { userId: req.userId },
        include: [{
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [{ model: ProductImage, as: 'images', where: { isPrimary: true }, required: false }]
            }
          ]
        }]
      });

      if (!cart) {
        cart = await Cart.create({ userId: req.userId });
        cart.items = [];
      }

      const total = cart.items?.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0) || 0;
      res.json({ cart, total });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener carrito.' });
    }
  },

  async addItem(req, res) {
    try {
      const { productId, quantity = 1 } = req.body;

      const product = await Product.findByPk(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ error: 'Stock insuficiente.' });
      }

      let cart = await Cart.findOne({ where: { userId: req.userId } });
      if (!cart) cart = await Cart.create({ userId: req.userId });

      let cartItem = await CartItem.findOne({
        where: { cartId: cart.id, productId }
      });

      const unitPrice = Number(parseFloat(product.price).toFixed(2));

      if (cartItem) {
        const newQty = cartItem.quantity + quantity;
        if (newQty > product.stock) {
          return res.status(400).json({ error: 'Stock insuficiente.' });
        }
        await cartItem.update({
          quantity: newQty,
          price: unitPrice
        });
      } else {
        cartItem = await CartItem.create({
          cartId: cart.id,
          productId,
          quantity,
          price: unitPrice
        });
      }

      res.json({ message: 'Producto agregado.', cartItem });
    } catch (error) {
      res.status(500).json({ error: 'Error al agregar producto.' });
    }
  },

  async updateItem(req, res) {
    try {
      const { quantity } = req.body;
      const cartItem = await CartItem.findByPk(req.params.itemId, {
        include: [{ model: Product, as: 'product' }]
      });

      if (!cartItem) return res.status(404).json({ error: 'Item no encontrado.' });
      if (quantity > cartItem.product.stock) {
        return res.status(400).json({ error: 'Stock insuficiente.' });
      }

      if (quantity <= 0) {
        await cartItem.destroy();
        return res.json({ message: 'Item eliminado.' });
      }

      await cartItem.update({ quantity });
      res.json({ message: 'Cantidad actualizada.', cartItem });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar item.' });
    }
  },

  async removeItem(req, res) {
    try {
      const cartItem = await CartItem.findByPk(req.params.itemId);
      if (!cartItem) return res.status(404).json({ error: 'Item no encontrado.' });
      await cartItem.destroy();
      res.json({ message: 'Item eliminado.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar item.' });
    }
  },

  async clearCart(req, res) {
    try {
      const cart = await Cart.findOne({ where: { userId: req.userId } });
      if (cart) {
        await CartItem.destroy({ where: { cartId: cart.id } });
      }
      res.json({ message: 'Carrito vaciado.' });
    } catch (error) {
      res.status(500).json({ error: 'Error al vaciar carrito.' });
    }
  }
};

module.exports = cartController;
