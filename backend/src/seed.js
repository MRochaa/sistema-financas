import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user if not exists
  const defaultUser = await prisma.user.upsert({
    where: { email: 'admin@financas.com' },
    update: {},
    create: {
      email: 'admin@financas.com',
      name: 'Administrador',
      password: await bcrypt.hash('admin123', 12)
    }
  });

  console.log('Default user created:', defaultUser.email);

  // Create default categories
  const categories = [
    // Income categories
    { name: 'Salário', type: 'INCOME', color: '#10B981', userId: defaultUser.id },
    { name: 'Freelance', type: 'INCOME', color: '#059669', userId: defaultUser.id },
    { name: 'Investimentos', type: 'INCOME', color: '#047857', userId: defaultUser.id },
    { name: 'Outros Rendimentos', type: 'INCOME', color: '#065f46', userId: defaultUser.id },
    
    // Expense categories
    { name: 'Alimentação', type: 'EXPENSE', color: '#EF4444', userId: defaultUser.id },
    { name: 'Transporte', type: 'EXPENSE', color: '#DC2626', userId: defaultUser.id },
    { name: 'Moradia', type: 'EXPENSE', color: '#B91C1C', userId: defaultUser.id },
    { name: 'Saúde', type: 'EXPENSE', color: '#991B1B', userId: defaultUser.id },
    { name: 'Educação', type: 'EXPENSE', color: '#7F1D1D', userId: defaultUser.id },
    { name: 'Lazer', type: 'EXPENSE', color: '#F59E0B', userId: defaultUser.id },
    { name: 'Roupas', type: 'EXPENSE', color: '#D97706', userId: defaultUser.id },
    { name: 'Tecnologia', type: 'EXPENSE', color: '#B45309', userId: defaultUser.id },
    { name: 'Contas', type: 'EXPENSE', color: '#92400E', userId: defaultUser.id },
    { name: 'Outros Gastos', type: 'EXPENSE', color: '#78350F', userId: defaultUser.id }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { 
        name_userId: {
          name: category.name,
          userId: category.userId
        }
      },
      update: {},
      create: category
    });
  }

  console.log('Default categories created');
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });