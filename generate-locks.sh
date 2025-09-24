#!/bin/bash

# Script para gerar os arquivos package-lock.json
# Execute este script localmente antes do deploy se quiser usar npm ci

echo "📦 Gerando arquivos package-lock.json..."

# Verifica se existe package.json na raiz
if [ -f "package.json" ]; then
    echo "📌 Gerando package-lock.json na raiz..."
    npm install --package-lock-only
    echo "✅ package-lock.json da raiz criado!"
fi

# Frontend agora está na raiz do projeto
# O package-lock.json do frontend já é gerado na seção da raiz acima

# Gera para o backend
if [ -d "backend" ] && [ -f "backend/package.json" ]; then
    echo "📌 Gerando package-lock.json do backend..."
    cd backend
    npm install --package-lock-only
    cd ..
    echo "✅ package-lock.json do backend criado!"
fi

echo "🎉 Processo concluído! Os arquivos package-lock.json foram gerados."
echo "📤 Faça commit destes arquivos no Git antes do próximo deploy."
