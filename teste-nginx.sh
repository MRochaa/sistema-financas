#!/bin/bash
echo "=== TESTE DO NGINX ==="

echo "1. Arquivos do frontend em /usr/share/nginx/html:"
ls -la /usr/share/nginx/html/

echo -e "\n2. Conteúdo do index.html:"
head -n 20 /usr/share/nginx/html/index.html

echo -e "\n3. Configuração atual do nginx:"
cat /etc/nginx/http.d/default.conf

echo -e "\n4. Testando requisições:"

# Testa a raiz (deve retornar HTML)
echo -e "\n--- GET / ---"
curl -s http://localhost/ | head -n 5

# Testa API (deve retornar JSON)
echo -e "\n--- GET /api/health ---"
curl -s http://localhost/api/health

# Testa rota inexistente (deve retornar index.html para React Router)
echo -e "\n--- GET /login (React Router) ---"
curl -s http://localhost/login | head -n 5

echo -e "\n=== FIM DO TESTE ==="
