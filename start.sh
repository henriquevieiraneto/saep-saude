#!/bin/bash

echo "🚀 Iniciando ReceitasDelícia..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Iniciar MySQL
echo "📦 Iniciando MySQL com Docker..."
docker-compose up -d

# Aguardar MySQL estar pronto
echo "⏳ Aguardando MySQL estar pronto..."
sleep 10

# Verificar se MySQL está rodando
if docker-compose ps | grep -q "Up"; then
    echo "✅ MySQL está rodando!"
    echo ""
    echo "📋 Informações de conexão:"
    echo "   Host: localhost"
    echo "   Porta: 3306"
    echo "   Usuário: root"
    echo "   Senha: rootpassword"
    echo "   Database: receitasdelicia"
    echo ""
    echo "🔧 Próximos passos:"
    echo "   1. Configure o arquivo backend/.env com as credenciais acima"
    echo "   2. Execute: cd backend && npm install && npm start"
    echo "   3. Execute: cd frontend && python3 -m http.server 8000"
    echo ""
    echo "📖 Para mais informações, consulte o README.md"
else
    echo "❌ Erro ao iniciar MySQL. Verifique os logs com: docker-compose logs"
    exit 1
fi

