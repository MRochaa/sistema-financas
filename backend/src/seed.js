import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

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

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  console.log('Default categories created');
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Erro durante seed:', e.message);
    // Não usar process.exit(1) para evitar crash do container
    // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });