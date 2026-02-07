require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const db = require('../models');

async function seed() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected');
    
    await db.sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');
    
    // Create admin user
    const adminEmail = 'admin@efimero.com';
    const existingAdmin = await db.User.findOne({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      await db.User.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Efimero',
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin user created: admin@efimero.com / Admin123!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    // Create default categories
    const categoriesData = [
      { name: 'Mezcal Joven', slug: 'mezcal-joven', description: 'Mezcales jóvenes sin envejecimiento, expresión pura del agave' },
      { name: 'Mezcal Reposado', slug: 'mezcal-reposado', description: 'Mezcales reposados en barrica de roble' },
      { name: 'Mezcal Añejo', slug: 'mezcal-anejo', description: 'Mezcales añejados con carácter profundo' },
      { name: 'Edición Especial', slug: 'edicion-especial', description: 'Ediciones limitadas y especiales con botellas artesanales huichol' },
      { name: 'Ancestral', slug: 'ancestral', description: 'Mezcal destilado en ollas de barro, método ancestral' }
    ];
    
    const categories = {};
    for (const cat of categoriesData) {
      let category = await db.Category.findOne({ where: { slug: cat.slug } });
      if (!category) {
        category = await db.Category.create(cat);
        console.log('✅ Category created: ' + cat.name);
      }
      categories[cat.slug] = category;
    }
    
    // Create default settings
    const settings = [
      { key: 'store_name', value: 'EFÍMERO Mezcal', group: 'general' },
      { key: 'store_description', value: 'Mezcal artesanal de San Luis Potosí - Creado sin prisa, disfrutado con tiempo', group: 'general' },
      { key: 'store_email', value: 'contacto@efimero.mx', group: 'general' },
      { key: 'store_phone', value: '+52 444 249 9873', group: 'general' },
      { key: 'store_address', value: 'San Luis Potosí, México', group: 'general' },
      { key: 'currency', value: 'MXN', group: 'general' },
      { key: 'mp_public_key', value: '', group: 'payments' },
      { key: 'mp_access_token', value: '', group: 'payments' },
      { key: 'mp_sandbox', value: 'true', group: 'payments' },
      { key: 'shipping_free_threshold', value: '1500', group: 'shipping' },
      { key: 'shipping_base_cost', value: '150', group: 'shipping' },
      { key: 'age_verification', value: 'true', group: 'legal' },
      { key: 'min_age', value: '18', group: 'legal' },
      // Email settings
      { key: 'smtp_host', value: '', group: 'email' },
      { key: 'smtp_port', value: '587', group: 'email' },
      { key: 'smtp_secure', value: 'false', group: 'email' },
      { key: 'smtp_user', value: '', group: 'email' },
      { key: 'smtp_pass', value: '', group: 'email' },
      { key: 'smtp_from_name', value: 'EFÍMERO Mezcal', group: 'email' },
      { key: 'smtp_from_email', value: '', group: 'email' },
      { key: 'email_order_confirmation', value: 'true', group: 'email' },
      { key: 'email_status_updates', value: 'true', group: 'email' },
      { key: 'email_welcome', value: 'true', group: 'email' }
    ];
    
    for (const setting of settings) {
      const exists = await db.Setting.findOne({ where: { key: setting.key } });
      if (!exists) {
        await db.Setting.create(setting);
        console.log('✅ Setting created: ' + setting.key);
      }
    }

    // Fotos de mezcal de Unsplash (libres de uso)
    const mezcalImages = [
      'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800',
      'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800',
      'https://images.unsplash.com/photo-1613063002795-1bf14e0a9012?w=800',
      'https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=800',
      'https://images.unsplash.com/photo-1574710216922-04e3c128c9f0?w=800',
      'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800',
      'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=800',
    ];

    // Create products
    const productsData = [
      {
        name: 'Efímero Joven 37°',
        slug: 'efimero-joven-37',
        sku: 'EF-JOV-37',
        description: 'Nuestro mezcal joven de entrada, suave y accesible. Elaborado con agave salmiana de San Luis Potosí, destilado en alambique de cobre. Perfecto para quienes inician su viaje en el mundo del mezcal.',
        shortDescription: 'Mezcal joven suave, ideal para iniciarse',
        price: 650,
        comparePrice: 800,
        stock: 50,
        categoryId: categories['mezcal-joven'].id,
        isActive: true,
        isFeatured: true,
        volume: '750ml',
        alcoholContent: 37,
        agaveType: 'Salmiana',
        region: 'San Luis Potosí',
        tastingNotes: 'Notas herbales frescas, ligero ahumado, final suave con toques de tierra húmeda y agave cocido.',
        pairings: 'Frutas frescas, cítricos, tacos de carnitas, quesos frescos.'
      },
      {
        name: 'Efímero Espadín 40°',
        slug: 'efimero-espadin-40',
        sku: 'EF-ESP-40',
        description: 'Nuestro mezcal insignia. Agave salmiana silvestre, cocido en horno de tierra durante 5 días, fermentación natural y doble destilación en alambique de cobre. Un mezcal con carácter.',
        shortDescription: 'El clásico de la casa, equilibrado y versátil',
        price: 890,
        comparePrice: null,
        stock: 35,
        categoryId: categories['mezcal-joven'].id,
        isActive: true,
        isFeatured: true,
        volume: '750ml',
        alcoholContent: 40,
        agaveType: 'Salmiana Silvestre',
        region: 'San Luis Potosí',
        tastingNotes: 'Ahumado medio, notas de agave cocido, hierbas del monte, mineral sutil. Final largo y elegante.',
        pairings: 'Chapulines, cecina, mole negro, chocolate amargo.'
      },
      {
        name: 'Efímero Reposado',
        slug: 'efimero-reposado',
        sku: 'EF-REP-40',
        description: 'Mezcal reposado 6 meses en barricas de roble blanco americano. El tiempo en madera suaviza el carácter ahumado y añade notas de vainilla y especias.',
        shortDescription: 'Suavizado en barrica, notas de vainilla',
        price: 1250,
        comparePrice: 1400,
        stock: 20,
        categoryId: categories['mezcal-reposado'].id,
        isActive: true,
        isFeatured: true,
        volume: '750ml',
        alcoholContent: 40,
        agaveType: 'Salmiana',
        region: 'San Luis Potosí',
        tastingNotes: 'Vainilla, caramelo suave, ahumado atenuado, especias dulces, final sedoso.',
        pairings: 'Carnes rojas, postres con nuez, quesos añejos, puros.'
      },
      {
        name: 'Efímero Ancestral 55°',
        slug: 'efimero-ancestral-55',
        sku: 'EF-ANC-55',
        description: 'Destilado en ollas de barro siguiendo el método ancestral prehispánico. Alto grado alcohólico que conserva la esencia pura del agave. Edición limitada de producción artesanal.',
        shortDescription: 'Método ancestral, destilado en olla de barro',
        price: 1650,
        comparePrice: null,
        stock: 15,
        categoryId: categories['ancestral'].id,
        isActive: true,
        isFeatured: true,
        volume: '750ml',
        alcoholContent: 55,
        agaveType: 'Salmiana Verde',
        region: 'San Luis Potosí',
        tastingNotes: 'Intenso, ahumado profundo, notas terrosas, minerales, hierbas silvestres. Potente y complejo.',
        pairings: 'Sal de gusano, naranja, botanas tradicionales, meditación.'
      },
      {
        name: 'Efímero Añejo',
        slug: 'efimero-anejo',
        sku: 'EF-ANE-40',
        description: 'Añejado 18 meses en barricas de roble francés previamente usadas para vino tinto. Un mezcal de contemplación, complejo y sofisticado.',
        shortDescription: 'Añejado 18 meses, para sibaritas',
        price: 2100,
        comparePrice: 2400,
        stock: 10,
        categoryId: categories['mezcal-anejo'].id,
        isActive: true,
        isFeatured: false,
        volume: '750ml',
        alcoholContent: 40,
        agaveType: 'Salmiana',
        region: 'San Luis Potosí',
        tastingNotes: 'Frutos secos, chocolate, tabaco, cuero, roble tostado. Final extraordinariamente largo.',
        pairings: 'Puros premium, chocolate oscuro 85%, foie gras, momento de reflexión.'
      },
      {
        name: 'Efímero Huichol Edition',
        slug: 'efimero-huichol-edition',
        sku: 'EF-HUI-40',
        description: 'Edición especial en botella decorada a mano por artesanos huicholes de la Sierra de San Luis Potosí. Cada botella es única, una obra de arte con chaquira tradicional. Mezcal joven de agave salmiana.',
        shortDescription: 'Botella artesanal huichol, pieza de colección',
        price: 2800,
        comparePrice: null,
        stock: 8,
        categoryId: categories['edicion-especial'].id,
        isActive: true,
        isFeatured: true,
        volume: '750ml',
        alcoholContent: 40,
        agaveType: 'Salmiana',
        region: 'San Luis Potosí',
        tastingNotes: 'Equilibrado, ahumado suave, notas florales, agave fresco, final limpio.',
        pairings: 'Para coleccionistas y momentos especiales.'
      },
      {
        name: 'Efímero Pechuga',
        slug: 'efimero-pechuga',
        sku: 'EF-PEC-45',
        description: 'Triple destilación con pechuga de guajolote y frutas de temporada (manzana, ciruela, plátano). Elaborado solo en temporada de fiestas. Un mezcal ceremonial único.',
        shortDescription: 'Destilado con pechuga, edición ceremonial',
        price: 3200,
        comparePrice: null,
        stock: 5,
        categoryId: categories['edicion-especial'].id,
        isActive: true,
        isFeatured: false,
        volume: '750ml',
        alcoholContent: 45,
        agaveType: 'Salmiana',
        region: 'San Luis Potosí',
        tastingNotes: 'Frutal, especiado, notas de frutas cocidas, canela, nuez moscada, carne ahumada sutil.',
        pairings: 'Mole de guajolote, pierna de cerdo, celebraciones familiares.'
      },
      {
        name: 'Miniatura Degustación 3-Pack',
        slug: 'miniatura-degustacion-3pack',
        sku: 'EF-MINI-3',
        description: 'Set de 3 miniaturas de 50ml: Joven 37°, Espadín 40° y Ancestral 55°. Perfecto para regalo o para conocer nuestra gama sin compromiso.',
        shortDescription: 'Kit de 3 miniaturas para degustación',
        price: 450,
        comparePrice: 550,
        stock: 25,
        categoryId: categories['mezcal-joven'].id,
        isActive: true,
        isFeatured: false,
        volume: '3x50ml',
        alcoholContent: 37,
        agaveType: 'Salmiana (varios)',
        region: 'San Luis Potosí',
        tastingNotes: 'Experiencia completa de la gama Efímero.',
        pairings: 'Regalo perfecto, catas en casa.'
      }
    ];

    for (let i = 0; i < productsData.length; i++) {
      const productData = productsData[i];
      const existingProduct = await db.Product.findOne({ where: { slug: productData.slug } });
      
      if (!existingProduct) {
        const product = await db.Product.create(productData);
        
        // Add image (rotate through available images)
        const imageUrl = mezcalImages[i % mezcalImages.length];
        await db.ProductImage.create({
          productId: product.id,
          url: imageUrl,
          alt: productData.name,
          isPrimary: true,
          order: 0
        });
        
        // Add second image for some products
        if (i < 4) {
          await db.ProductImage.create({
            productId: product.id,
            url: mezcalImages[(i + 4) % mezcalImages.length],
            alt: `${productData.name} - Vista adicional`,
            isPrimary: false,
            order: 1
          });
        }
        
        console.log(`✅ Product created: ${productData.name}`);
      } else {
        console.log(`ℹ️  Product already exists: ${productData.slug}`);
      }
    }
    
    console.log('\n========================================');
    console.log('🎉 SEED COMPLETADO EXITOSAMENTE');
    console.log('========================================');
    console.log('\n📋 CREDENCIALES ADMIN:');
    console.log('   Email: admin@efimero.com');
    console.log('   Password: Admin123!');
    console.log('\n📦 PRODUCTOS CREADOS: ' + productsData.length);
    console.log('📁 CATEGORÍAS: ' + Object.keys(categories).length);
    console.log('\n⚠️  IMPORTANTE: Configura MercadoPago en /admin/configuracion');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
