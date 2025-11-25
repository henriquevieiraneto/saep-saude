// Script de teste para verificar conexão com banco de dados
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    try {
        const db = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'receitasdelicia',
            charset: 'utf8mb4'
        });

        console.log('Testando conexão com banco de dados...');
        
        // Testar conexão
        const [rows] = await db.execute('SELECT 1 as test');
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Verificar se as tabelas existem
        const [tables] = await db.execute('SHOW TABLES');
        console.log('\n📋 Tabelas encontradas:');
        tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });
        
        // Verificar receitas
        const [receitas] = await db.execute('SELECT COUNT(*) as total FROM receitas');
        console.log(`\n📊 Total de receitas: ${receitas[0].total}`);
        
        // Verificar usuários
        const [usuarios] = await db.execute('SELECT COUNT(*) as total FROM usuarios');
        console.log(`👥 Total de usuários: ${usuarios[0].total}`);
        
        // Testar query de receitas
        console.log('\n🔍 Testando query de receitas...');
        const [testReceitas] = await db.execute(
            'SELECT r.*, u.nome as usuario_nome, u.foto_perfil, ' +
            '(SELECT COUNT(*) FROM likes WHERE receita_id = r.id) as total_likes, ' +
            '(SELECT COUNT(*) FROM comentarios WHERE receita_id = r.id) as total_comentarios ' +
            'FROM receitas r JOIN usuarios u ON r.usuario_id = u.id ' +
            'ORDER BY r.data_criacao DESC LIMIT 5'
        );
        console.log(`✅ Query executada com sucesso! ${testReceitas.length} receitas encontradas.`);
        
        if (testReceitas.length > 0) {
            console.log('\n📝 Primeira receita:');
            console.log(JSON.stringify(testReceitas[0], null, 2));
        }
        
        await db.end();
        console.log('\n✅ Teste concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testConnection();

