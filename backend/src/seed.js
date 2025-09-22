const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Test connection first
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Check if categories already exist
    const existingCategories = await prisma.category.count();
    
    if (existingCategories > 0) {
      console.log('📊 Categories already exist, skipping seed');
      return;
    }

    console.log('📝 Creating default categories...');

    // Create default categories
    const categories = [
      // Income categories
      { name: 'Salário', type: 'INCOME', color: '#10B981' },
      { name: 'Freelance', type: 'INCOME', color: '#059669' },
      { name: 'Investimentos', type: 'INCOME', color: '#047857' },
      { name: 'Outros Rendimentos', type: 'INCOME', color: '#065f46' },
      
      // Expense categories
      { name: 'Alimentação', type: 'EXPENSE', color: '#EF4444' },
      { name: 'Transporte', type: 'EXPENSE', color: '#DC2626' },
      { name: 'Moradia', type: 'EXPENSE', color: '#B91C1C' },
      { name: 'Saúde', type: 'EXPENSE', color: '#991B1B' },
      { name: 'Educação', type: 'EXPENSE', color: '#7F1D1D' },
      { name: 'Lazer', type: 'EXPENSE', color: '#F59E0B' },
      { name: 'Roupas', type: 'EXPENSE', color: '#D97706' },
      { name: 'Tecnologia', type: 'EXPENSE', color: '#B45309' },
      { name: 'Contas', type: 'EXPENSE', color: '#92400E' },
      { name: 'Outros Gastos', type: 'EXPENSE', color: '#78350F' }
    ];

    // Get the first user (admin) to assign categories to
    const firstUser = await prisma.user.findFirst();
    
    if (!firstUser) {
      console.log('⚠️ No users found, categories will be created when first user registers');
      return;
    }

    // Create categories for the first user
    let createdCount = 0;
    for (const category of categories) {
      try {
        await prisma.category.create({
          data: {
            ...category,
            userId: firstUser.id
          }
        });
        createdCount++;
      } catch (error) {
        console.error(`Error creating category ${category.name}:`, error.message);
      }
    }

    console.log(`✅ Created ${createdCount} default categories`);
    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });