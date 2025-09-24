#!/bin/bash

# Script de instalação robusta de dependências Alpine
# Implementa retry logic e fallbacks para evitar travamentos

set -e

# Configurações
MAX_RETRIES=3
RETRY_DELAY=5
TIMEOUT=300

# Função para instalar dependências com retry
install_deps() {
    local deps="$1"
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        echo "Tentativa $((retry_count + 1))/$MAX_RETRIES de instalação de dependências..."
        
        if timeout $TIMEOUT apk add --no-cache $deps; then
            echo "✅ Dependências instaladas com sucesso"
            return 0
        else
            echo "❌ Falha na tentativa $((retry_count + 1))"
            retry_count=$((retry_count + 1))
            
            if [ $retry_count -lt $MAX_RETRIES ]; then
                echo "Aguardando $RETRY_DELAY segundos antes da próxima tentativa..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    echo "❌ Falha ao instalar dependências após $MAX_RETRIES tentativas"
    return 1
}

# Atualiza repositórios
echo "Atualizando repositórios Alpine..."
timeout $TIMEOUT apk update --no-cache

# Instala dependências básicas
echo "Instalando dependências básicas..."
install_deps "openssl libc6-compat"

# Limpa cache
echo "Limpando cache..."
rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

echo "✅ Instalação de dependências concluída com sucesso"
