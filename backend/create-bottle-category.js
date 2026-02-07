const { Category } = require('./src/models');

async function createBottleCategory() {
  try {
    const [category, created] = await Category.findOrCreate({
      where: { slug: 'botellas-artesanales' },
      defaults: {
        id: 'bot-art-001',
        name: 'Botellas Artesanales',
        slug: 'botellas-artesanales',
        description: 'Botellas artesanales decorativas para mezcal',
        isActive: true
      }
    });
    
    if (created) {
      console.log('✅ Categoría "Botellas Artesanales" creada exitosamente');
    } else {
      console.log('ℹ️ La categoría "Botellas Artesanales" ya existe');
    }
    console.log('ID:', category.id);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createBottleCategory();
