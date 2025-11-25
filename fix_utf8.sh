#!/bin/bash

# Script para corrigir encoding UTF-8 no banco de dados MySQL

echo "🔧 Corrigindo encoding UTF-8 no banco de dados..."

# Verificar se o Docker está rodando
if ! docker ps | grep -q receitasdelicia-mysql; then
    echo "❌ Container MySQL não está rodando. Execute: docker-compose up -d"
    exit 1
fi

# Executar o script SQL de correção
echo "📝 Aplicando correções de encoding..."
docker exec -i receitasdelicia-mysql mysql -uroot -prootpassword receitasdelicia < fix_utf8.sql

if [ $? -eq 0 ]; then
    echo "✅ Encoding UTF-8 corrigido com sucesso!"
    echo "🔄 Reinicie o backend para aplicar as mudanças."
else
    echo "❌ Erro ao aplicar correções. Verifique os logs."
    exit 1
fi

