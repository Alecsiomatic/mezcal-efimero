const { Order, OrderItem, Product, User, Payment, Coupon, Setting, sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EFI-${timestamp}-${random}`;
};

const orderController = {
  // Get user orders
  async getMyOrders(req, res) {
    try {
      const orders = await Order.findAll({
        where: { userId: req.userId },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          },
          { model: Payment, as: 'payment' }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json({ orders });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener pedidos.' });
    }
  },

  // Get single order
  async getOrder(req, res) {
    try {
      const where = { id: req.params.id };
      if (req.user.role !== 'admin') where.userId = req.userId;
      
      const order = await Order.findOne({
        where,
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          },
          { model: Payment, as: 'payment' },
          { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
          { model: Coupon, as: 'coupon' }
        ]
      });
      
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });
      res.json({ order });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener pedido.' });
    }
  },

  // Create order from cart
  async create(req, res) {
    const t = await sequelize.transaction();
    try {
      const { items, shipping, couponCode, notes, paymentMethod } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'El carrito est\u00e1 vac\u00edo.' });
      }

      let subtotal = 0;
      const orderItems = [];

      // Validate products and calculate totals
      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        if (!product || !product.isActive) {
          await t.rollback();
          return res.status(400).json({ error: `Producto no disponible: ${item.productId}` });
        }
        if (product.stock < item.quantity) {
          await t.rollback();
          return res.status(400).json({ error: `Stock insuficiente para: ${product.name}` });
        }

        const unitPrice = parseFloat(product.price);
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: item.quantity,
          price: Number(unitPrice.toFixed(2)),
          total: Number(itemTotal.toFixed(2))
        });

        // Reduce stock
        await product.decrement('stock', { by: item.quantity, transaction: t });
        await product.increment('salesCount', { by: item.quantity, transaction: t });
      }

      subtotal = parseFloat(subtotal.toFixed(2));

      // Apply coupon if provided
      let discount = 0;
      let couponId = null;
      if (couponCode) {
        const coupon = await Coupon.findOne({ 
          where: { 
            code: couponCode, 
            isActive: true,
            [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: new Date() } }]
          } 
        });
        if (coupon && subtotal >= coupon.minPurchase) {
          if (coupon.discountType === 'percentage') {
            discount = subtotal * (coupon.discountValue / 100);
            if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
          } else {
            discount = coupon.discountValue;
          }
          couponId = coupon.id;
          await coupon.increment('usageCount', { transaction: t });
        }
      }

      const shippingCost = parseFloat(shipping?.cost || 0);
      const total = subtotal - discount + shippingCost;

      // Create order with unique order number
      const order = await Order.create({
        orderNumber: generateOrderNumber(),
        userId: req.userId,
        subtotal,
        discount,
        shipping: shippingCost,
        total,
        couponId,
        notes,
        paymentMethod: paymentMethod || 'mercadopago',
        shippingFirstName: shipping?.firstName,
        shippingLastName: shipping?.lastName,
        shippingEmail: shipping?.email,
        shippingPhone: shipping?.phone,
        shippingAddress: shipping?.address,
        shippingCity: shipping?.city,
        shippingState: shipping?.state,
        shippingZip: shipping?.zip,
        shippingCountry: shipping?.country || 'Mexico'
      }, { transaction: t });

      // Create order items
      for (const item of orderItems) {
        await OrderItem.create({ ...item, orderId: order.id }, { transaction: t });
      }

      await t.commit();

      const fullOrder = await Order.findByPk(order.id, {
        include: [{
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }]
      });

      // Obtener el usuario para enviar emails
      const user = await User.findByPk(req.userId);
      
      // Enviar email según el método de pago
      if (user) {
        const orderForEmail = {
          ...fullOrder.toJSON(),
          shippingAddress: {
            street: shipping?.address,
            city: shipping?.city,
            state: shipping?.state,
            zipCode: shipping?.zip,
            country: shipping?.country || 'México'
          },
          shippingCost: shippingCost
        };
        
        // Si es transferencia, enviar email especial con datos bancarios
        if (paymentMethod === 'transfer') {
          // Obtener datos bancarios de Settings
          const bankSettings = await Setting.findAll({
            where: {
              key: ['bank_name', 'bank_holder', 'bank_clabe', 'bank_card', 'bank_email', 'bank_instructions']
            }
          });
          const bankData = bankSettings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
          }, {});
          
          emailService.sendTransferOrderEmail(orderForEmail, user, bankData).catch(err => {
            console.error('Error sending transfer order email:', err);
          });
        } else {
          // Para otros métodos, enviar confirmación normal
          emailService.sendOrderConfirmation(orderForEmail, user).catch(err => {
            console.error('Error sending order confirmation email:', err);
          });
        }
        
        // Notificar al admin del nuevo pedido (siempre)
        emailService.sendAdminNewOrder(orderForEmail, user).catch(err => {
          console.error('Error sending admin notification:', err);
        });
      }

      res.status(201).json({ message: 'Pedido creado.', order: fullOrder });
    } catch (error) {
      await t.rollback();
      console.error('Create order error:', error);
      res.status(500).json({ error: 'Error al crear pedido.' });
    }
  },

  // ADMIN: Get all orders
  async adminGetAll(req, res) {
    try {
      const { page = 1, limit = 20, status, paymentStatus, search, startDate, endDate } = req.query;
      const where = {};

      if (status) where.status = status;
      if (paymentStatus) where.paymentStatus = paymentStatus;
      if (search) {
        where[Op.or] = [
          { orderNumber: { [Op.like]: `%${search}%` } },
          { shippingEmail: { [Op.like]: `%${search}%` } }
        ];
      }
      if (startDate && endDate) {
        where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
          { model: Payment, as: 'payment' },
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        orders: rows,
        pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener pedidos.' });
    }
  },

  // ADMIN: Update order status
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await Order.findByPk(req.params.id, {
        include: [{ model: User, as: 'user' }]
      });
      
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });

      const updateData = { status };
      if (status === 'shipped') updateData.shippedAt = new Date();
      if (status === 'delivered') updateData.deliveredAt = new Date();
      if (status === 'cancelled') updateData.cancelledAt = new Date();

      await order.update(updateData);
      
      // Enviar email de actualización de estado al cliente
      if (order.user) {
        emailService.sendOrderStatusUpdate(order, order.user, status).catch(err => {
          console.error('Error sending status update email:', err);
        });
      }
      
      res.json({ message: 'Estado actualizado.', order });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Error al actualizar estado.' });
    }
  },

  // ADMIN: Update payment status
  async updatePaymentStatus(req, res) {
    try {
      const { paymentStatus } = req.body;
      const order = await Order.findByPk(req.params.id);
      
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });

      const updateData = { paymentStatus };
      
      // If confirming payment, record who and when
      if (paymentStatus === 'paid') {
        updateData.paymentConfirmedAt = new Date();
        updateData.paymentConfirmedBy = req.userId;
        // Also update order status to confirmed if pending
        if (order.status === 'pending') {
          updateData.status = 'confirmed';
        }
      }

      await order.update(updateData);
      res.json({ message: 'Estado de pago actualizado.', order });
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({ error: 'Error al actualizar estado de pago.' });
    }
  },

  // ADMIN: Update tracking info
  async updateTracking(req, res) {
    try {
      const { trackingNumber, trackingUrl } = req.body;
      const order = await Order.findByPk(req.params.id);
      
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });

      await order.update({ 
        trackingNumber, 
        trackingUrl,
        status: order.status === 'processing' ? 'shipped' : order.status,
        shippedAt: order.status === 'processing' ? new Date() : order.shippedAt
      });
      res.json({ message: 'Información de envío actualizada.', order });
    } catch (error) {
      console.error('Update tracking error:', error);
      res.status(500).json({ error: 'Error al actualizar información de envío.' });
    }
  },

  // ADMIN: Cancel order
  async cancelOrder(req, res) {
    try {
      const { reason } = req.body;
      const order = await Order.findByPk(req.params.id, {
        include: [{ model: OrderItem, as: 'items' }]
      });
      
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado.' });

      // Restore stock for each item
      for (const item of order.items) {
        await Product.increment('stock', { by: item.quantity, where: { id: item.productId } });
        await Product.decrement('salesCount', { by: item.quantity, where: { id: item.productId } });
      }

      await order.update({ 
        status: 'cancelled', 
        cancelReason: reason,
        cancelledAt: new Date()
      });

      res.json({ message: 'Pedido cancelado.', order });
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({ error: 'Error al cancelar pedido.' });
    }
  },

  // Get order stats for dashboard
  async getStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      const [totalOrders, todayOrders, monthOrders, totalRevenue, monthRevenue, pendingOrders] = await Promise.all([
        Order.count(),
        Order.count({ where: { createdAt: { [Op.gte]: today } } }),
        Order.count({ where: { createdAt: { [Op.gte]: thisMonth } } }),
        Order.sum('total', { where: { paymentStatus: 'paid' } }),
        Order.sum('total', { where: { paymentStatus: 'paid', createdAt: { [Op.gte]: thisMonth } } }),
        Order.count({ where: { status: 'pending' } })
      ]);

      res.json({
        totalOrders,
        todayOrders,
        monthOrders,
        totalRevenue: totalRevenue || 0,
        monthRevenue: monthRevenue || 0,
        pendingOrders
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener estad\u00edsticas.' });
    }
  },

  // Upload payment receipt (for customers)
  async uploadReceipt(req, res) {
    try {
      const order = await Order.findOne({
        where: { id: req.params.id, userId: req.userId }
      });
      
      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado.' });
      }

      if (order.paymentStatus === 'paid') {
        return res.status(400).json({ error: 'El pago ya fue confirmado.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo.' });
      }

      const receiptUrl = `/uploads/receipts/${req.file.filename}`;
      const { notes } = req.body;

      await order.update({ 
        paymentReceipt: receiptUrl,
        paymentReceiptNotes: notes || null
      });

      res.json({ 
        message: 'Comprobante subido exitosamente.', 
        order: { ...order.toJSON(), paymentReceipt: receiptUrl }
      });
    } catch (error) {
      console.error('Upload receipt error:', error);
      res.status(500).json({ error: 'Error al subir comprobante.' });
    }
  },

  // Get orders pending payment verification (admin)
  async getPendingPayments(req, res) {
    try {
      const orders = await Order.findAll({
        where: {
          paymentReceipt: { [Op.ne]: null },
          paymentStatus: 'pending'
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({ orders });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener pedidos pendientes.' });
    }
  }
};

module.exports = orderController;
