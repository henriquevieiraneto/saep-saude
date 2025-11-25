# Guia Rápido - Docker MySQL

## Pré-requisitos

- Docker instalado
- Docker Compose instalado

## Comandos Básicos

### Iniciar o MySQL
```bash
docker-compose up -d
```

### Verificar status
```bash
docker-compose ps
```

### Ver logs
```bash
docker-compose logs -f mysql
```

### Parar o MySQL
```bash
docker-compose down
```

### Parar e remover dados (reset completo)
```bash
docker-compose down -v
```

### Reiniciar o container
```bash
docker-compose restart
```

## Configuração

O Docker Compose está configurado com:

- **Imagem**: MySQL 8.0
- **Porta**: 3306
- **Banco de dados**: receitasdelicia (criado automaticamente)
- **Script SQL**: Executado automaticamente na primeira inicialização

### Credenciais

- **Root User**: `root` / `rootpassword`
- **App User**: `receitasuser` / `receitaspass`
- **Database**: `receitasdelicia`

## Configuração do Backend

No arquivo `backend/.env`, use:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=receitasdelicia
PORT=3000
```

## Troubleshooting

### Porta 3306 já está em uso

Se você já tem MySQL rodando na porta 3306, altere a porta no `docker-compose.yml`:

```yaml
ports:
  - "3307:3306"  # Mude 3306 para 3307 (ou outra porta)
```

E atualize o `DB_HOST` no `.env` do backend se necessário.

### Container não inicia

Verifique os logs:
```bash
docker-compose logs mysql
```

### Resetar o banco de dados

Para recriar o banco do zero:
```bash
docker-compose down -v
docker-compose up -d
```

### Acessar o MySQL via linha de comando

```bash
docker exec -it receitasdelicia-mysql mysql -u root -prootpassword receitasdelicia
```

### Backup do banco

```bash
docker exec receitasdelicia-mysql mysqldump -u root -prootpassword receitasdelicia > backup.sql
```

### Restaurar backup

```bash
docker exec -i receitasdelicia-mysql mysql -u root -prootpassword receitasdelicia < backup.sql
```

