const db = require('./src/models');

async function createBottles() {
  await db.sequelize.authenticate();
  
  const bottles = [
    {
      id: 'bot-001',
      name: 'Botella Huichol Venado Azul',
      slug: 'botella-huichol-venado-azul',
      sku: 'BOT-HUI-001',
      description: 'Botella artesanal decorada con chaquira tradicional Huichol. Diseño de venado azul, símbolo de conexión espiritual.',
      price: 1850,
      stock: 5,
      volume: '750ml',
      agaveType: 'Chaquira Huichol',
      region: 'Nayarit',
      categoryId: 'bot-art-001',
      isActive: true,
      isFeatured: true
    },
    {
      id: 'bot-002', 
      name: 'Botella Barro Negro Oaxaca',
      slug: 'botella-barro-negro-oaxaca',
      sku: 'BOT-BAR-001',
      description: 'Elegante botella de barro negro pulido, elaborada por artesanos de San Bartolo Coyotepec.',
      price: 1200,
      stock: 8,
      volume: '500ml',
      agaveType: 'Barro Negro',
      region: 'Oaxaca',
      categoryId: 'bot-art-001',
      isActive: true,
      isFeatured: true
    },
    {
      id: 'bot-003',
      name: 'Botella Vidrio Soplado Tonalá',
      slug: 'botella-vidrio-soplado-tonala',
      sku: 'BOT-VID-001',
      description: 'Botella de vidrio soplado artesanal con tonos ámbar y detalles en relieve.',
      price: 950,
      stock: 12,
      volume: '750ml',
      agaveType: 'Vidrio Soplado',
      region: 'Jalisco',
      categoryId: 'bot-art-001',
      isActive: true,
      isFeatured: false
    }
  ];

  for (const bottle of bottles) {
    await db.Product.upsert(bottle);
    console.log('Creada:', bottle.name);
  }
  
  console.log('✅ 3 botellas creadas en categoría bot-art-001');
  process.exit(0);
}

createBottles().catch(e => { console.error(e); process.exit(1); });
