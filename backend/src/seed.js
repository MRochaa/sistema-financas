import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Categorias padrão de RECEITA
    const incomeCategories = [
      { name: 'Salário', type: 'INCOME', color: '#10B981', icon: '💰' },
      { name: 'Freelance', type: 'INCOME', color: '#06B6D4', icon: '💻' },
      { name: 'Investimentos', type: 'INCOME', color: '#8B5CF6', icon: '📈' },
      { name: 'Vendas', type: 'INCOME', color: '#F59E0B', icon: '🛒' },
      { name: 'Outros', type: 'INCOME', color: '#6B7280', icon: '➕' }
    ];

    // Categorias padrão de DESPESA
    const expenseCategories = [
      { name: 'Alimentação', type: 'EXPENSE', color: '#EF4444', icon: '🍔' },
      { name: 'Transporte', type: 'EXPENSE', color: '#F59E0B', icon: '🚗' },
      { name: 'Moradia', type: 'EXPENSE', color: '#3B82F6', icon: '🏠' },
      { name: 'Saúde', type: 'EXPENSE', color: '#EC4899', icon: '🏥' },
      { name: 'Educação', type: 'EXPENSE', color: '#14B8A6', icon: '📚' },
      { name: 'Lazer', type: 'EXPENSE', color: '#A78BFA', icon: '🎮' },
      { name: 'Compras', type: 'EXPENSE', color: '#F97316', icon: '🛍️' },
      { name: 'Serviços', type: 'EXPENSE', color: '#0EA5E9', icon: '🔧' },
      { name: 'Impostos', type: 'EXPENSE', color: '#DC2626', icon: '📋' },
      { name: 'Outros', type: 'EXPENSE', color: '#6B7280', icon: '➖' }
    ];

    // Criar categorias
    for (const category of [...incomeCategories, ...expenseCategories]) {
      await prisma.category.upsert({
        where: { 
          name_type: {
            name: category.name,
            type: category.type
          }
        },
        update: {
          color: category.color,
          icon: category.icon
        },
        create: category
      });
      console.log(`✅ Category created/updated: ${category.name} (${category.type})`);
    }

    console.log('✨ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed
seed()
  .then(() => {
    console.log('🎉 Database seeded!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });