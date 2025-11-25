-- Script para importar dados do CSV de usuários
-- Execute este script após criar o banco de dados

USE receitasdelicia;

-- Limpar dados existentes (opcional - descomente se quiser recriar)
-- DELETE FROM receitas;
-- DELETE FROM comentarios;
-- DELETE FROM likes;
-- DELETE FROM usuarios;

-- Inserir usuários do CSV
INSERT INTO usuarios (id, nome, email, senha, foto_perfil) VALUES
(1, 'saepsaude', 'saepsaude@email.com', '123456', 'saepsaude.png'),
(2, 'usuario1', 'usuario1@email.com', '123456', 'usuario01.jpg'),
(3, 'usuario2', 'usuario2@email.com', '123456', 'usuario02.jpg'),
(4, 'usuario3', 'usuario3@email.com', '123456', 'usuario03.jpg')
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    email = VALUES(email),
    foto_perfil = VALUES(foto_perfil);

-- Nota: As atividades do CSV precisam ser convertidas para receitas
-- pois o sistema atual trabalha com receitas, não atividades físicas
-- Você pode criar receitas manualmente ou adaptar os dados conforme necessário

