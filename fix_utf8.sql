-- Script para corrigir encoding UTF-8 no banco de dados existente
USE receitasdelicia;

-- Converter o banco de dados para utf8mb4
ALTER DATABASE receitasdelicia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Converter tabela empresa
ALTER TABLE empresa CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE empresa MODIFY nome VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE empresa MODIFY logo VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Converter tabela usuarios
ALTER TABLE usuarios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE usuarios MODIFY nome VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE usuarios MODIFY email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE usuarios MODIFY senha VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE usuarios MODIFY foto_perfil VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'default-avatar.png';

-- Converter tabela receitas
ALTER TABLE receitas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE receitas MODIFY titulo VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE receitas MODIFY tipo ENUM('Sobremesa', 'Prato Principal', 'Aperitivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE receitas MODIFY dificuldade ENUM('Facil', 'Medio', 'Dificil') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Converter tabela comentarios
ALTER TABLE comentarios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE comentarios MODIFY texto TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Atualizar o nome da empresa com o valor correto em UTF-8
UPDATE empresa SET nome = 'ReceitasDelícia' WHERE id = 1;

-- Atualizar receitas que podem ter problemas de encoding
UPDATE receitas SET titulo = 'Lasanha à Bolonhesa' WHERE titulo LIKE '%Lasanha%';

