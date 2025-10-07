#!/bin/bash

echo "======================================"
echo "Testando Sistema Financeiro"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL base
BASE_URL="http://localhost:3000"

echo -e "${YELLOW}1. Testando Health Check...${NC}"
HEALTH=$(curl -s "${BASE_URL}/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Health Check OK${NC}"
    echo "$HEALTH" | grep -o '"database":"[^"]*"'
else
    echo -e "${RED}✗ Health Check FALHOU${NC}"
    echo "$HEALTH"
    exit 1
fi

echo ""
echo -e "${YELLOW}2. Testando API Info...${NC}"
API=$(curl -s "${BASE_URL}/api")
if echo "$API" | grep -q "Sistema Financeiro"; then
    echo -e "${GREEN}✓ API respondendo${NC}"
else
    echo -e "${RED}✗ API não respondeu${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}3. Testando Frontend...${NC}"
FRONTEND=$(curl -s "${BASE_URL}/" | grep -o "<title>.*</title>")
if [ ! -z "$FRONTEND" ]; then
    echo -e "${GREEN}✓ Frontend carregando${NC}"
    echo "  $FRONTEND"
else
    echo -e "${RED}✗ Frontend não carregou${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}======================================"
echo "✓ Todos os testes passaram!"
echo "======================================"${NC}
echo ""
echo "Acesse: ${BASE_URL}"
echo ""
