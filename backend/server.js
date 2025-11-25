const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do banco de dados
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'receitasdelicia',
    charset: 'utf8mb4',
    connectionLimit: 10,
    enableKeepAlive: true
});

// Garantir que todas as conexões usem UTF-8
(async () => {
    try {
        const connection = await db.getConnection();
        await connection.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
        await connection.query('SET CHARACTER SET utf8mb4');
        connection.release();
        console.log('✅ Configuração UTF-8 aplicada ao banco de dados');
    } catch (error) {
        console.error('⚠️ Erro ao configurar UTF-8 (pode ser normal se o banco ainda não existe):', error.message);
    }
})();

// Middleware para verificar autenticação
const verificarAuth = (req, res, next) => {
    const userId = req.headers['user-id'];
    if (!userId) {
        return res.status(401).json({ erro: 'Não autenticado' });
    }
    req.userId = parseInt(userId);
    next();
};

// Rotas da empresa
app.get('/api/empresa', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM empresa LIMIT 1');
        if (rows.length === 0) return res.status(404).json({ erro: 'Empresa não encontrada' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.get('/api/empresa/estatisticas', async (req, res) => {
    try {
        const [receitas] = await db.execute('SELECT COUNT(*) as total FROM receitas');
        const [calorias] = await db.execute(`
            SELECT SUM(CASE dificuldade 
                WHEN 'Facil' THEN 1 
                WHEN 'Medio' THEN 2 
                WHEN 'Dificil' THEN 3 
                ELSE 0 END) as total 
            FROM receitas
        `);
        res.json({
            totalReceitas: receitas[0].total,
            totalDificuldade: calorias[0].total || 0
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Rotas de autenticação
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }
        const usuario = rows[0];
        // Para simplificar, comparando senha em texto (em produção usar bcrypt)
        if (senha === '123456') { // Senha padrão para todos os usuários de exemplo
            res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, foto_perfil: usuario.foto_perfil });
        } else {
            res.status(401).json({ erro: 'Email ou senha inválidos' });
        }
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Função para converter dificuldade do banco para exibição
function formatarDificuldade(dificuldade) {
    const map = {
        'Facil': 'Fácil',
        'Medio': 'Médio',
        'Dificil': 'Difícil'
    };
    return map[dificuldade] || dificuldade;
}

// Rotas de receitas
app.get('/api/receitas', async (req, res) => {
    try {
        const { tipo, pagina = 1, limite = 4 } = req.query;
        
        // Garantir que os valores são números válidos e positivos
        const paginaNum = Math.max(1, parseInt(pagina) || 1);
        const limiteNum = Math.max(1, Math.min(100, parseInt(limite) || 4)); // Limitar entre 1 e 100
        const offsetNum = (paginaNum - 1) * limiteNum;
        
        // Construir query base
        let query = 'SELECT r.*, u.nome as usuario_nome, u.foto_perfil, ' +
                    '(SELECT COUNT(*) FROM likes WHERE receita_id = r.id) as total_likes, ' +
                    '(SELECT COUNT(*) FROM comentarios WHERE receita_id = r.id) as total_comentarios ' +
                    'FROM receitas r JOIN usuarios u ON r.usuario_id = u.id';
        const params = [];
        
        // Adicionar filtro de tipo se fornecido
        if (tipo && tipo.trim() !== '') {
            query += ' WHERE r.tipo = ?';
            params.push(tipo);
        }
        
        // Usar valores diretos para LIMIT e OFFSET (mysql2 tem problemas com placeholders aqui)
        // Valores já validados acima, então são seguros
        query += ` ORDER BY r.data_criacao DESC LIMIT ${limiteNum} OFFSET ${offsetNum}`;
        
        // Executar query
        const [rows] = await db.execute(query, params);
        
        // Converter dificuldade para exibição e garantir caminhos corretos
        const receitas = rows.map(receita => ({
            ...receita,
            dificuldade: formatarDificuldade(receita.dificuldade || 'Facil'),
            total_likes: parseInt(receita.total_likes) || 0,
            total_comentarios: parseInt(receita.total_comentarios) || 0,
            // Garantir que foto_perfil tenha caminho completo se necessário
            foto_perfil: receita.foto_perfil && !receita.foto_perfil.startsWith('anexos/')
                ? (receita.foto_perfil.includes('usuario') 
                    ? `anexos/imagens_perfil/${receita.foto_perfil}`
                    : receita.foto_perfil.includes('saepsaude')
                    ? `anexos/logo_saepsaude/${receita.foto_perfil}`
                    : receita.foto_perfil)
                : receita.foto_perfil
        }));
        
        // Buscar total de receitas
        let totalQuery = 'SELECT COUNT(*) as total FROM receitas';
        const totalParams = [];
        if (tipo && tipo.trim() !== '') {
            totalQuery += ' WHERE tipo = ?';
            totalParams.push(tipo);
        }
        
        const [total] = await db.execute(totalQuery, totalParams);
        
        res.json({ 
            receitas, 
            total: parseInt(total[0].total) || 0, 
            pagina: paginaNum, 
            limite: limiteNum
        });
    } catch (error) {
        console.error('Erro ao buscar receitas:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            erro: error.message, 
            detalhes: process.env.NODE_ENV === 'development' ? error.stack : 'Erro interno do servidor'
        });
    }
});

app.get('/api/receitas/:id/likes', verificarAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM likes WHERE receita_id = ? AND usuario_id = ?', [id, req.userId]);
        res.json({ curtiu: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.post('/api/receitas', verificarAuth, async (req, res) => {
    try {
        const { titulo, tipo, tempo_preparo, porcoes, dificuldade } = req.body;
        if (!titulo || !tipo || !tempo_preparo || !porcoes || !dificuldade) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
        }
        
        // Mapear dificuldade com acento para valor sem acento no banco
        const dificuldadeMap = {
            'Fácil': 'Facil',
            'Médio': 'Medio',
            'Difícil': 'Dificil'
        };
        const dificuldadeDB = dificuldadeMap[dificuldade] || dificuldade;
        
        const [result] = await db.execute(
            'INSERT INTO receitas (titulo, tipo, tempo_preparo, porcoes, dificuldade, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
            [titulo, tipo, tempo_preparo, porcoes, dificuldadeDB, req.userId]
        );
        res.json({ id: result.insertId, mensagem: 'Receita criada com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Rotas de likes
app.post('/api/receitas/:id/like', verificarAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const [exists] = await db.execute('SELECT * FROM likes WHERE receita_id = ? AND usuario_id = ?', [id, req.userId]);
        if (exists.length > 0) {
            await db.execute('DELETE FROM likes WHERE receita_id = ? AND usuario_id = ?', [id, req.userId]);
            res.json({ acao: 'removido' });
        } else {
            await db.execute('INSERT INTO likes (receita_id, usuario_id) VALUES (?, ?)', [id, req.userId]);
            res.json({ acao: 'adicionado' });
        }
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Rotas de comentários
app.get('/api/receitas/:id/comentarios', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute(
            'SELECT c.*, u.nome as usuario_nome, u.foto_perfil FROM comentarios c JOIN usuarios u ON c.usuario_id = u.id WHERE c.receita_id = ? ORDER BY c.data_criacao DESC',
            [id]
        );
        // Garantir que foto_perfil tenha caminho completo
        const comentarios = rows.map(comentario => ({
            ...comentario,
            foto_perfil: comentario.foto_perfil && !comentario.foto_perfil.startsWith('anexos/')
                ? (comentario.foto_perfil.includes('usuario') 
                    ? `anexos/imagens_perfil/${comentario.foto_perfil}`
                    : comentario.foto_perfil.includes('saepsaude')
                    ? `anexos/logo_saepsaude/${comentario.foto_perfil}`
                    : comentario.foto_perfil)
                : comentario.foto_perfil
        }));
        res.json(comentarios);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.post('/api/receitas/:id/comentarios', verificarAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { texto } = req.body;
        if (!texto || texto.trim().length < 3) {
            return res.status(400).json({ erro: 'Comentário deve ter pelo menos 3 caracteres' });
        }
        const [result] = await db.execute(
            'INSERT INTO comentarios (receita_id, usuario_id, texto) VALUES (?, ?, ?)',
            [id, req.userId, texto.trim()]
        );
        res.json({ id: result.insertId, mensagem: 'Comentário adicionado com sucesso' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// Rota para receitas do usuário logado
app.get('/api/minhas-receitas', verificarAuth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT r.*, u.nome as usuario_nome, u.foto_perfil, ' +
            '(SELECT COUNT(*) FROM likes WHERE receita_id = r.id) as total_likes, ' +
            '(SELECT COUNT(*) FROM comentarios WHERE receita_id = r.id) as total_comentarios ' +
            'FROM receitas r JOIN usuarios u ON r.usuario_id = u.id WHERE r.usuario_id = ? ORDER BY r.data_criacao DESC',
            [req.userId]
        );
        // Converter dificuldade para exibição e garantir caminhos corretos
        const receitas = rows.map(receita => ({
            ...receita,
            dificuldade: formatarDificuldade(receita.dificuldade || 'Facil'),
            // Garantir que foto_perfil tenha caminho completo se necessário
            foto_perfil: receita.foto_perfil && !receita.foto_perfil.startsWith('anexos/')
                ? (receita.foto_perfil.includes('usuario') 
                    ? `anexos/imagens_perfil/${receita.foto_perfil}`
                    : receita.foto_perfil.includes('saepsaude')
                    ? `anexos/logo_saepsaude/${receita.foto_perfil}`
                    : receita.foto_perfil)
                : receita.foto_perfil
        }));
        res.json(receitas);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

