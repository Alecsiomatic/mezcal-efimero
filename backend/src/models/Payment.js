const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  mpPaymentId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  mpPreferenceId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  mpMerchantOrderId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process'),
    defaultValue: 'pending'
  },
  statusDetail: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  paymentType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'MXN'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rawResponse: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

module.exports = Payment;
