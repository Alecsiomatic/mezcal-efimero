const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('mercadopago', 'transfer', 'cash'),
    defaultValue: 'mercadopago'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shipping: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shippingFirstName: { type: DataTypes.STRING(100) },
  shippingLastName: { type: DataTypes.STRING(100) },
  shippingEmail: { type: DataTypes.STRING(255) },
  shippingPhone: { type: DataTypes.STRING(20) },
  shippingAddress: { type: DataTypes.STRING(255) },
  shippingCity: { type: DataTypes.STRING(100) },
  shippingState: { type: DataTypes.STRING(100) },
  shippingZip: { type: DataTypes.STRING(20) },
  shippingCountry: { type: DataTypes.STRING(100), defaultValue: 'Mexico' },
  billingAddress: { type: DataTypes.TEXT },
  notes: { type: DataTypes.TEXT },
  trackingNumber: { type: DataTypes.STRING(100) },
  trackingUrl: { type: DataTypes.STRING(255) },
  shippedAt: { type: DataTypes.DATE },
  deliveredAt: { type: DataTypes.DATE },
  cancelledAt: { type: DataTypes.DATE },
  cancelReason: { type: DataTypes.TEXT },
  // Payment receipt/transfer proof
  paymentReceipt: { type: DataTypes.STRING(255) },  // URL/path to receipt image
  paymentReceiptNotes: { type: DataTypes.TEXT },     // Notes about the payment
  paymentConfirmedAt: { type: DataTypes.DATE },      // When admin confirmed payment
  paymentConfirmedBy: { type: DataTypes.UUID }       // Admin who confirmed
});

Order.beforeCreate(async (order) => {
  const date = new Date();
  const prefix = 'EF';
  const timestamp = date.getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  order.orderNumber = `${prefix}${timestamp}${random}`;
});

module.exports = Order;
