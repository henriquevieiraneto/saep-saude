-- Script para atualizar o banco de dados existente
-- Execute este script se você já criou o banco antes das correções

USE receitasdelicia;

-- Alterar o ENUM da coluna dificuldade para valores sem acentos
ALTER TABLE receitas MODIFY COLUMN dificuldade ENUM('Facil', 'Medio', 'Dificil') NOT NULL;

-- Atualizar os valores existentes
UPDATE receitas SET dificuldade = 'Facil' WHERE dificuldade = 'Fácil';
UPDATE receitas SET dificuldade = 'Medio' WHERE dificuldade = 'Médio';
UPDATE receitas SET dificuldade = 'Dificil' WHERE dificuldade = 'Difícil';

-- Verificar se há valores que não correspondem (caso tenha algum problema)
-- SELECT DISTINCT dificuldade FROM receitas;

