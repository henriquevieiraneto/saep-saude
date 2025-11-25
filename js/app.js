// VARIÁVEIS DE ESTADO (Simulando o Banco de Dados e Sessão)
let usuarioLogado = null; // Será preenchido com o objeto do usuário após o login
let atividades = [
    // Dados iniciais de atividades (simulação)
    // { id: 1, id_usuario: 1, tipo: 'Corrida', distancia: '10 km', duracao: '50 min', ... },
    // { id: 2, id_usuario: 2, tipo: 'Caminhada', distancia: '5 km', duracao: '30 min', ... },
    // ...
];
let currentPage = 1;
const activitiesPerPage = 4; // Regra 7.1

// -------------------------------------
// 1. FUNÇÕES GERAIS DE UI
// -------------------------------------

function abrirModalLogin() {
    // Regra 1 da 1.2: Exibe o pop-up/modal
    document.getElementById('login-modal').style.display = 'block';
}

function fecharModalLogin() {
    // Regra 3: Fecha o pop-up/modal
    document.getElementById('login-modal').style.display = 'none';
}

function atualizarEstadoUI() {
    const isLogado = usuarioLogado !== null;
    
    // 1. Botões de Login/Logout
    const loginButtonMain = document.querySelector('.main-header button');
    // ... (simular clique no botão Login da imagem inicial, se não logado)
    loginButtonMain.textContent = isLogado ? 'Logout' : 'Login';
    loginButtonMain.style.display = 'block'; // Mostrar sempre, mas a ação muda
    
    // 2. Botão 'Atividade' no Perfil
    const atividadeBtn = document.getElementById('atividade-btn');
    atividadeBtn.disabled = !isLogado; // Regra 1.2
    
    // 3. Informações do Perfil
    if (isLogado) {
        // Regra 2.2: Carregar dados de atividades e calorias do usuário logado
        document.getElementById('perfil-nome').textContent = usuarioLogado.nome;
        // ... (Chamar função para carregar e somar atividades/calorias do BD)
    } else {
        // Voltar para um estado padrão se deslogado
        document.getElementById('perfil-nome').textContent = 'SAEPSaúde';
        document.getElementById('qtd-atividades').textContent = '—';
        document.getElementById('qtd-calorias').textContent = '—';
    }
    
    // 4. Listar Atividades (sempre lista, mas interações mudam)
    renderActivities();
}

// -------------------------------------
// 2. LÓGICA DE AUTENTICAÇÃO
// -------------------------------------

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // Regra 3.2: Verificar credenciais no banco de dados
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    // Simulação de validação
    if (email === 'teste@senai.br' && senha === '12345') {
        usuarioLogado = { id: 1, nome: 'Usuário Logado', email: email };
        fecharModalLogin();
        atualizarEstadoUI();
        // Regra 6: Redirecionamento para a página SPA (a própria)
    } else {
        // Regra 5: Credenciais erradas
        alert('email ou senha incorreta.');
        // ... (Implementar destaque no input vermelho)
    }
});

document.getElementById('login-btn').addEventListener('click', function() {
    // A ação principal é feita no evento 'submit' do form
});

document.getElementById('cancelar-btn').addEventListener('click', fecharModalLogin);

document.getElementById('logout-btn').addEventListener('click', function() {
    // Regra 1 da 1.1: Ao clicar em logout
    usuarioLogado = null;
    atualizarEstadoUI();
});

// -------------------------------------
// 3. LÓGICA DE ATIVIDADES E RENDERIZAÇÃO
// -------------------------------------

function renderActivityCard(activity) {
    // Regra 6.1: Formato da Data HH:MM - DD/MM/YY
    const dataFormatada = formatarData(activity.data_atividade); 
    
    // Regra 6.2 e 6.3: Ícones e Quantidade de Interação
    const isLiked = isActivityLikedByCurrentUser(activity.id); // Simulação de verificação
    const likeIconClass = isLiked ? 'liked' : '';
    
    return `
        <div class="activity-card" data-id="${activity.id}">
            <img src="${activity.user_img}" alt="Perfil" width="60" height="60">
            <div>
                <h4>${activity.user_name} - ${activity.tipo}</h4>
                <div class="activity-stats">
                    <p>${activity.distancia}</p>
                    <p>${activity.duracao}</p>
                    <p>${activity.calorias} Calorias</p>
                </div>
                <p class="activity-date">${dataFormatada}</p>
            </div>
            
            <div class="activity-actions">
                <span class="like-btn ${likeIconClass}" data-activity-id="${activity.id}">
                    <img src="assets/coracao.svg" alt="Curtir">
                    <span class="like-count">${activity.num_likes}</span>
                </span>
                
                <span class="comment-btn" data-activity-id="${activity.id}">
                    <img src="assets/chat.svg" alt="Comentar">
                    <span class="comment-count">${activity.num_comments}</span>
                </span>
            </div>
            
            <div class="comment-section" style="display: none;">
                </div>
        </div>
    `;
}

function renderActivities() {
    // Filtro (Regra 5.2) e Paginação (Regra 7)
    
    // 1. Filtrar atividades
    const filtroAtivo = document.querySelector('.filter-btn.active').dataset.filter;
    const filteredActivities = atividades.filter(a => a.tipo === filtroAtivo);
    
    // 2. Paginar (Regra 7.1: máx. 4 atividades)
    const start = (currentPage - 1) * activitiesPerPage;
    const end = start + activitiesPerPage;
    const paginatedActivities = filteredActivities.slice(start, end);
    
    const listContainer = document.getElementById('activities-list');
    listContainer.innerHTML = paginatedActivities.map(renderActivityCard).join('');
    
    // 3. Renderizar Paginação
    renderPagination(filteredActivities.length);
}

// ... (Funções para Lógica de Paginação: renderPagination, goNextPage, goPrevPage, etc.)
// ... (Funções para Lógica de Interação: handleLikeClick, handleCommentClick, etc.)

// -------------------------------------
// 4. INICIALIZAÇÃO
// -------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados iniciais (simulação)
    // Inicializar listeners (filtros, paginação, interações)
    atualizarEstadoUI();
    
    // Ao carregar, o usuário não está logado, então o botão 'Atividade' fica desabilitado
    // E o botão na coluna principal deve ser 'Login' (Regra 1.2 da 1.2)
});