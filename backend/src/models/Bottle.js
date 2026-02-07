const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bottle = sequelize.define('Bottle', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    capacity: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Capacidad de la botella (750ml, 1L, etc.)'
    },
    material: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Material de la botella (vidrio soplado, barro, cerámica, etc.)'
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'bottles',
    timestamps: true
  });

  Bottle.associate = (models) => {
    Bottle.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
  };

  return Bottle;
};
