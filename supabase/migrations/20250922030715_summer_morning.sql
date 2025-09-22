/*
  # Sistema de Finanças do Lar - Schema Inicial

  1. Tabelas Criadas
    - `users` - Usuários do sistema
      - `id` (texto, chave primária)
      - `email` (texto, único)
      - `name` (texto)
      - `password` (texto, hash bcrypt)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `categories` - Categorias de transações
      - `id` (texto, chave primária)
      - `name` (texto)
      - `type` (enum: INCOME/EXPENSE)
      - `color` (texto, hex color)
      - `userId` (texto, FK para users)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `transactions` - Transações financeiras
      - `id` (texto, chave primária)
      - `type` (enum: INCOME/EXPENSE)
      - `amount` (decimal)
      - `description` (texto, opcional)
      - `date` (timestamp)
      - `categoryId` (texto, FK para categories)
      - `userId` (texto, FK para users)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  2. Relacionamentos
    - User -> Categories (1:N)
    - User -> Transactions (1:N)
    - Category -> Transactions (1:N)

  3. Índices
    - users.email (único)
    - categories.userId
    - transactions.userId
    - transactions.categoryId
    - transactions.date

  4. Constraints
    - Cascade delete para manter integridade
    - Validação de tipos enum
*/

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "categories_userId_idx" ON "categories"("userId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_categoryId_idx" ON "transactions"("categoryId");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;