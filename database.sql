-- Banco de dados para o sistema ReceitasDelícia
CREATE DATABASE IF NOT EXISTS receitasdelicia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE receitasdelicia;

-- Tabela de empresa
CREATE TABLE empresa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    logo VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de usuários
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE NOT NULL,
    senha VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    foto_perfil VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'default-avatar.png'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de receitas
CREATE TABLE receitas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    tipo ENUM('Sobremesa', 'Prato Principal', 'Aperitivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    tempo_preparo INT NOT NULL COMMENT 'em minutos',
    porcoes INT NOT NULL,
    dificuldade ENUM('Facil', 'Medio', 'Dificil') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    usuario_id INT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de likes
CREATE TABLE likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    receita_id INT NOT NULL,
    usuario_id INT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receita_id) REFERENCES receitas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (receita_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de comentários
CREATE TABLE comentarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    receita_id INT NOT NULL,
    usuario_id INT NOT NULL,
    texto TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receita_id) REFERENCES receitas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados da empresa
INSERT INTO empresa (nome, logo) VALUES ('ReceitasDelícia', 'anexos/logo_saepsaude/SAEPSaude.png');

-- Inserir usuários de exemplo (baseado no CSV)
INSERT INTO usuarios (id, nome, email, senha, foto_perfil) VALUES
(1, 'saepsaude', 'saepsaude@email.com', '123456', 'saepsaude.png'),
(2, 'usuario1', 'usuario1@email.com', '123456', 'usuario01.jpg'),
(3, 'usuario2', 'usuario2@email.com', '123456', 'usuario02.jpg'),
(4, 'usuario3', 'usuario3@email.com', '123456', 'usuario03.jpg');

-- Inserir receitas de exemplo
INSERT INTO receitas (titulo, tipo, tempo_preparo, porcoes, dificuldade, usuario_id) VALUES
('Bolo de Chocolate', 'Sobremesa', 60, 8, 'Facil', 1),
('Lasanha à Bolonhesa', 'Prato Principal', 90, 6, 'Medio', 2),
('Bruschetta Italiana', 'Aperitivo', 15, 4, 'Facil', 1),
('Tiramisu', 'Sobremesa', 45, 6, 'Medio', 3),
('Risotto de Cogumelos', 'Prato Principal', 40, 4, 'Dificil', 2),
('Canapés de Salmão', 'Aperitivo', 20, 8, 'Facil', 3),
('Cheesecake de Morango', 'Sobremesa', 120, 10, 'Medio', 1),
('Frango Grelhado', 'Prato Principal', 30, 4, 'Facil', 2);

-- Inserir alguns likes de exemplo
INSERT INTO likes (receita_id, usuario_id) VALUES
(1, 2), (1, 3), (2, 1), (3, 2), (4, 1);

-- Inserir alguns comentários de exemplo
INSERT INTO comentarios (receita_id, usuario_id, texto) VALUES
(1, 2, 'Ficou delicioso! Vou fazer novamente.'),
(1, 3, 'Receita perfeita, muito fácil de seguir.'),
(2, 1, 'Adorei o resultado final!');

