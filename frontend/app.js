const API_URL = 'http://localhost:3000/api';
let usuarioLogado = null;
let filtroAtual = 'Corrida';
let paginaAtual = 1;
const itensPorPagina = 4;
let atividadesCache = [];

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a UI com estado deslogado
    atualizarUI();
    
    // Carrega atividades iniciais
    carregarAtividades();
    
    // Verifica se há sessão salva (Opcional, descomente se implementar persistência)
    // verificarSessao(); 
});

// --- API CALLS ---

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        return response;
    } catch (error) {
        console.error('Erro de conexão com a API:', error);
        alert('Erro de conexão com o servidor. Verifique se o backend está rodando.');
        return null;
    }
}

// --- AUTENTICAÇÃO ---

function toggleLogin() {
    if (usuarioLogado) {
        // LOGOUT
        usuarioLogado = null;
        atualizarUI();
        // Resetar estado da interface
        document.getElementById('form-atividade-container').style.display = 'none';
        document.getElementById('lista-atividades').style.display = 'block';
        document.getElementById('paginacao').style.display = 'flex';
        carregarAtividades(); // Recarrega para resetar status de likes
    } else {
        // ABRIR LOGIN
        document.getElementById('modal-login').style.display = 'flex';
    }
}

function fecharModalLogin() {
    document.getElementById('modal-login').style.display = 'none';
    document.getElementById('form-login').reset();
    const msgErro = document.getElementById('msg-erro-login');
    if(msgErro) msgErro.style.display = 'none';
    document.querySelectorAll('input').forEach(i => i.classList.remove('erro'));
}

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    const res = await fetchAPI('/login', 'POST', { email, senha });

    if (res && res.ok) {
        usuarioLogado = await res.json();
        fecharModalLogin();
        atualizarUI();
        carregarAtividades(); // Recarrega para atualizar likes do usuário
    } else {
        const msg = document.getElementById('msg-erro-login');
        msg.textContent = 'Email ou senha incorreta';
        msg.style.display = 'block';
        document.getElementById('login-email').classList.add('erro');
        document.getElementById('login-senha').classList.add('erro');
    }
});

// --- INTERFACE ---

function atualizarUI() {
    const btnLogin = document.getElementById('btn-login-logout');
    const nomeUser = document.getElementById('usuario-nome');
    const imgUser = document.getElementById('usuario-img');
    const statAtiv = document.getElementById('stat-atividades');
    const statCal = document.getElementById('stat-calorias');
    const btnCriar = document.getElementById('btn-criar-atividade');

    if (usuarioLogado) {
        // Estado LOGADO
        btnLogin.textContent = 'Logout';
        nomeUser.textContent = usuarioLogado.nome;
        // Se o caminho da imagem vier do banco, use-o. Caso contrário, fallback.
        imgUser.src = usuarioLogado.imagem || 'anexos/logo_saepsaude/SAEPSaude.png';
        statAtiv.textContent = usuarioLogado.qtd_atividades;
        statCal.textContent = usuarioLogado.qtd_calorias;
        btnCriar.disabled = false;
    } else {
        // Estado DESLOGADO
        btnLogin.textContent = 'Login';
        nomeUser.textContent = 'Visitante';
        imgUser.src = 'anexos/logo_saepsaude/SAEPSaude.png';
        statAtiv.textContent = '-';
        statCal.textContent = '-';
        btnCriar.disabled = true;
        btnCriar.style.backgroundColor = 'transparent'; // Reset estilo
    }
}

// --- ATIVIDADES ---

async function carregarAtividades() {
    const container = document.getElementById('lista-atividades');
    container.innerHTML = '<p style="text-align: center; padding: 20px;">Carregando...</p>';

    const res = await fetchAPI(`/atividades?tipo=${filtroAtual}`);
    
    if (res && res.ok) {
        atividadesCache = await res.json();
        renderizarLista();
    } else {
        container.innerHTML = '<p style="text-align: center; color: red;">Erro ao carregar atividades.</p>';
    }
}

function filtrarAtividades(tipo) {
    filtroAtual = tipo;
    paginaAtual = 1;
    
    // Atualiza visual dos botões
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === tipo) btn.classList.add('active');
    });

    // Reseta visual do botão de criar (caso estivesse ativo)
    document.getElementById('btn-criar-atividade').style.backgroundColor = 'transparent';
    
    // Mostra lista e esconde form
    document.getElementById('form-atividade-container').style.display = 'none';
    document.getElementById('lista-atividades').style.display = 'block';
    document.getElementById('paginacao').style.display = 'flex';

    carregarAtividades();
}

async function renderizarLista() {
    const lista = document.getElementById('lista-atividades');
    lista.innerHTML = '';

    if (atividadesCache.length === 0) {
        lista.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhuma atividade encontrada.</p>';
        renderizarPaginacao(0);
        return;
    }

    const total = atividadesCache.length;
    const totalPaginas = Math.ceil(total / itensPorPagina);
    
    // Slice para paginação
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPagina = atividadesCache.slice(inicio, fim);

    // Para cada atividade na página, precisamos checar o like
    // Fazemos isso em paralelo para não travar
    const promises = itensPagina.map(async (atv) => {
        let curtiu = false;
        if (usuarioLogado) {
            const check = await fetchAPI(`/curtidas/check?id_usuario=${usuarioLogado.id}&id_atividade=${atv.id}`);
            if (check && check.ok) curtiu = (await check.json()).liked;
        }
        return { ...atv, curtiu };
    });

    const atividadesRenderizadas = await Promise.all(promises);

    atividadesRenderizadas.forEach(atv => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Formatação de data
        const dataObj = new Date(atv.data_atividade);
        const dataFmt = `${String(dataObj.getHours()).padStart(2,'0')}:${String(dataObj.getMinutes()).padStart(2,'0')} - ${dataObj.toLocaleDateString('pt-BR')}`;

        // Ícone do coração (Regra de cor #FF0000 se curtiu)
        const iconCoracao = atv.curtiu ? 'anexos/icones/CoracaoVermelho.svg' : 'anexos/icones/coracao.svg';
        // Se a imagem do usuário falhar, usa fallback
        const imgUsuario = atv.imagem_usuario || 'anexos/imagens_perfil/usuario03.jpg';

        card.innerHTML = `
            <div class="card-header">
                <img src="${imgUsuario}" alt="User" onerror="this.src='anexos/imagens_perfil/usuario03.jpg'">
                <div class="card-info">
                    <h4>${atv.nome_usuario}</h4>
                </div>
                <span class="card-date">${dataFmt}</span>
            </div>
            <div class="card-body">
                <h4>${atv.tipo_atividade}</h4>
                <div class="card-stats">
                    <span>${atv.distancia_metros >= 1000 ? (atv.distancia_metros/1000).toFixed(1)+' km' : atv.distancia_metros+' m'}</span>
                    <span>${atv.duracao_minutos} min</span>
                    <span>${atv.calorias} kcal</span>
                </div>
            </div>
            <div class="card-actions">
                <div class="icon-btn" onclick="toggleLike(${atv.id})">
                    <img src="${iconCoracao}" alt="Like">
                    <span>${atv.num_likes}</span>
                </div>
                <div class="icon-btn" onclick="toggleComentario(${atv.id})">
                    <img src="anexos/icones/comentario.svg" alt="Comment">
                    <span id="count-comment-${atv.id}">${atv.num_comments}</span>
                </div>
            </div>
            
            <!-- Sessão de Comentários -->
            <div id="comentarios-${atv.id}" class="comment-section">
                <div class="comment-input-area">
                    <input type="text" id="input-comment-${atv.id}" placeholder="Escrever um comentário..." maxlength="200">
                    <button class="btn-send" onclick="enviarComentario(${atv.id})" title="Enviar">
                        <img src="anexos/icones/send.svg" alt="Enviar">
                    </button>
                </div>
                <small id="erro-comment-${atv.id}" style="color: red; display: none; margin-top: 5px;">O comentário deve ter mais de 2 caracteres.</small>
            </div>
        `;
        lista.appendChild(card);
    });

    renderizarPaginacao(totalPaginas);
}

function renderizarPaginacao(totalPaginas) {
    const div = document.getElementById('paginacao');
    div.innerHTML = '';
    
    if (totalPaginas <= 1) return;

    // Botão Primeira
    const btnPrim = document.createElement('button');
    btnPrim.textContent = 'Primeira';
    btnPrim.className = 'page-link';
    btnPrim.disabled = paginaAtual === 1;
    btnPrim.onclick = () => { paginaAtual = 1; renderizarLista(); };
    div.appendChild(btnPrim);

    // Botão Anterior
    const btnAnt = document.createElement('button');
    btnAnt.textContent = 'Anterior';
    btnAnt.className = 'page-link';
    btnAnt.disabled = paginaAtual === 1;
    btnAnt.onclick = () => { paginaAtual--; renderizarLista(); };
    div.appendChild(btnAnt);

    // Números das páginas
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `page-link ${i === paginaAtual ? 'active' : ''}`;
        btn.onclick = () => { paginaAtual = i; renderizarLista(); };
        div.appendChild(btn);
    }

    // Botão Próxima
    const btnProx = document.createElement('button');
    btnProx.textContent = 'Próxima';
    btnProx.className = 'page-link';
    btnProx.disabled = paginaAtual === totalPaginas;
    btnProx.onclick = () => { paginaAtual++; renderizarLista(); };
    div.appendChild(btnProx);

    // Botão Última
    const btnUlt = document.createElement('button');
    btnUlt.textContent = 'Última';
    btnUlt.className = 'page-link';
    btnUlt.disabled = paginaAtual === totalPaginas;
    btnUlt.onclick = () => { paginaAtual = totalPaginas; renderizarLista(); };
    div.appendChild(btnUlt);
}

// --- AÇÕES (LIKE E COMENTÁRIO) ---

async function toggleLike(idAtividade) {
    if (!usuarioLogado) {
        alert('Faça login para curtir atividades.');
        toggleLogin();
        return;
    }
    
    await fetchAPI('/curtidas', 'POST', { 
        id_usuario: usuarioLogado.id, 
        id_atividade: idAtividade 
    });
    
    // Recarrega a lista para atualizar o ícone e o contador corretamente
    // (Poderia ser otimizado atualizando só o DOM, mas assim garante sincronia)
    renderizarLista(); 
}

function toggleComentario(idAtividade) {
    const div = document.getElementById(`comentarios-${idAtividade}`);
    // Toggle display
    div.style.display = (div.style.display === 'none' || div.style.display === '') ? 'block' : 'none';
}

async function enviarComentario(idAtividade) {
    if (!usuarioLogado) {
        alert('Faça login para comentar.');
        return;
    }
    
    const input = document.getElementById(`input-comment-${idAtividade}`);
    const texto = input.value.trim();
    const erro = document.getElementById(`erro-comment-${idAtividade}`);

    // Validação: Maior que 2 caracteres e não vazio
    if (texto.length === 0) {
        alert("Não é possível enviar um comentário vazio.");
        return;
    }

    if (texto.length <= 2) {
        erro.style.display = 'block';
        return;
    }
    erro.style.display = 'none';

    const res = await fetchAPI('/comentarios', 'POST', {
        id_usuario: usuarioLogado.id,
        id_atividade: idAtividade,
        comentario: texto
    });

    if (res && res.ok) {
        alert('Comentário enviado com sucesso!');
        input.value = '';
        toggleComentario(idAtividade); // Esconde a área
        
        // Atualiza contador visualmente
        const countSpan = document.getElementById(`count-comment-${idAtividade}`);
        countSpan.textContent = parseInt(countSpan.textContent) + 1;
    }
}

// --- NOVA ATIVIDADE ---

function mostrarFormAtividade() {
    // Esconde lista e paginação
    document.getElementById('lista-atividades').style.display = 'none';
    document.getElementById('paginacao').style.display = 'none';
    // Mostra formulário
    document.getElementById('form-atividade-container').style.display = 'block';
    
    // Estilo visual no botão lateral (ativo)
    document.getElementById('btn-criar-atividade').style.backgroundColor = '#483DAD';
    // Remove ativo dos filtros
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
}

function cancelarCriacao() {
    document.getElementById('form-atividade-container').style.display = 'none';
    document.getElementById('form-nova-atividade').reset();
    
    document.getElementById('lista-atividades').style.display = 'block';
    document.getElementById('paginacao').style.display = 'flex';
    
    // Restaura estilo botão e filtro
    document.getElementById('btn-criar-atividade').style.backgroundColor = 'transparent';
    // Restaura filtro visualmente
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        if (btn.textContent === filtroAtual) btn.classList.add('active');
    });
}

document.getElementById('form-nova-atividade').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dados = {
        id_usuario: usuarioLogado.id,
        tipo: document.getElementById('novo-tipo').value,
        distancia: document.getElementById('novo-distancia').value,
        duracao: document.getElementById('novo-duracao').value,
        calorias: document.getElementById('novo-calorias').value
    };

    const res = await fetchAPI('/atividades', 'POST', dados);
    
    if (res && res.ok) {
        alert('Atividade criada com sucesso!');
        
        // Atualiza dados locais do usuário (qtd atividades/calorias) para refletir na sidebar
        usuarioLogado.qtd_atividades++;
        usuarioLogado.qtd_calorias += parseInt(dados.calorias);
        atualizarUI();
        
        cancelarCriacao();
        // Força recarregamento para incluir a nova atividade se ela corresponder ao filtro atual
        filtroAtual = dados.tipo; 
        filtrarAtividades(filtroAtual);
    } else {
        alert('Erro ao criar atividade. Verifique os dados.');
    }
});