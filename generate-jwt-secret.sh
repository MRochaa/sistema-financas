#!/bin/bash

echo "Gerando JWT_SECRET seguro..."
echo ""
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo ""
echo "Copie o valor acima e adicione no seu arquivo .env"
