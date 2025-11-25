const API_URL = 'http://localhost:3000/api';
let usuarioLogado = null;
let paginaAtual = 1;
let tipoFiltro = '';
let modoMinhasReceitas = false;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarEmpresa();
    carregarEstatisticas();
    carregarReceitas();
    configurarEventos();
});

// Configurar eventos
function configurarEventos() {
    document.getElementById('btn-login').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    });

    document.getElementById('btn-logout').addEventListener('click', fazerLogout);
    document.getElementById('login-form').addEventListener('submit', fazerLogin);
    const btnReceitas = document.getElementById('btn-receitas');
    const criarReceitaModal = document.getElementById('criarReceitaModal');
    
    btnReceitas.addEventListener('click', () => {
        if (usuarioLogado) {
            const modal = new bootstrap.Modal(criarReceitaModal);
            modal.show();
        } else {
            mostrarModalLogin();
        }
    });

    // Atualizar cor do botão quando modal abrir/fechar
    criarReceitaModal.addEventListener('show.bs.modal', () => {
        btnReceitas.style.backgroundColor = '#483DAD';
        btnReceitas.style.color = '#FFFFFF';
    });

    criarReceitaModal.addEventListener('hide.bs.modal', () => {
        btnReceitas.style.backgroundColor = 'transparent';
        btnReceitas.style.color = '#FFFFFF';
    });

    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!usuarioLogado) {
                mostrarModalLogin();
                return;
            }
            tipoFiltro = e.target.dataset.tipo;
            paginaAtual = 1;
            document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            modoMinhasReceitas = false;
            carregarReceitas();
        });
    });

    document.getElementById('criar-receita-form').addEventListener('submit', criarReceita);
}

// Carregar dados da empresa
async function carregarEmpresa() {
    try {
        const response = await fetch(`${API_URL}/empresa`);
        const empresa = await response.json();
        document.getElementById('empresa-nome').textContent = empresa.nome;
        
        // Atualizar logo se fornecido
        if (empresa.logo) {
            const logoEl = document.getElementById('empresa-logo');
            if (logoEl) {
                // Se o logo já tem caminho completo, usar; senão, adicionar caminho
                const logoPath = empresa.logo.startsWith('anexos/') 
                    ? empresa.logo 
                    : `anexos/logo_saepsaude/${empresa.logo}`;
                logoEl.src = logoPath;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar empresa:', error);
    }
}

// Carregar estatísticas
async function carregarEstatisticas() {
    try {
        const response = await fetch(`${API_URL}/empresa/estatisticas`);
        const stats = await response.json();
        document.getElementById('total-receitas').textContent = stats.totalReceitas;
        document.getElementById('total-dificuldade').textContent = stats.totalDificuldade;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Carregar receitas
async function carregarReceitas() {
    try {
        let url = `${API_URL}/receitas?pagina=${paginaAtual}&limite=4`;
        if (tipoFiltro) url += `&tipo=${encodeURIComponent(tipoFiltro)}`;
        
        if (modoMinhasReceitas && usuarioLogado) {
            const response = await fetch(`${API_URL}/minhas-receitas`, {
                headers: { 'user-id': usuarioLogado.id }
            });
            const receitas = await response.json();
            exibirReceitas(receitas, { total: receitas.length, pagina: 1, limite: 4 });
            return;
        }

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ erro: 'Erro ao carregar receitas' }));
            console.error('Erro ao carregar receitas:', errorData);
            document.getElementById('receitas-container').innerHTML = '<p class="text-center text-danger">Erro ao carregar receitas. Verifique o console para mais detalhes.</p>';
            return;
        }
        const data = await response.json();
        if (!data.receitas) {
            console.error('Resposta inválida do servidor:', data);
            document.getElementById('receitas-container').innerHTML = '<p class="text-center text-danger">Erro: Resposta inválida do servidor.</p>';
            return;
        }
        exibirReceitas(data.receitas, data);
    } catch (error) {
        console.error('Erro ao carregar receitas:', error);
        document.getElementById('receitas-container').innerHTML = '<p class="text-center text-danger">Erro ao carregar receitas. Verifique se o servidor está rodando.</p>';
    }
}

// Exibir receitas
async function exibirReceitas(receitas, paginacao) {
    const container = document.getElementById('receitas-container');
    container.innerHTML = '';

    if (!receitas || !Array.isArray(receitas)) {
        container.innerHTML = '<p class="text-center text-danger">Erro: Dados inválidos recebidos.</p>';
        return;
    }

    if (receitas.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhuma receita encontrada.</p>';
        document.getElementById('paginacao-container').innerHTML = '';
        return;
    }

    for (const receita of receitas) {
        const card = criarCardReceita(receita);
        container.appendChild(card);
        await carregarLikesComentarios(receita.id, card);
    }

    criarPaginacao(paginacao);
}

// Função para obter caminho da foto de perfil
function obterFotoPerfil(fotoPerfil, nomeUsuario) {
    // Se já tem o caminho completo, retornar
    if (fotoPerfil && fotoPerfil.startsWith('anexos/')) {
        return fotoPerfil;
    }
    
    // Mapear nomes de arquivo para caminhos
    if (fotoPerfil) {
        if (fotoPerfil.includes('usuario01') || fotoPerfil === 'usuario01.jpg') {
            return 'anexos/imagens_perfil/usuario01.jpg';
        }
        if (fotoPerfil.includes('usuario02') || fotoPerfil === 'usuario02.jpg') {
            return 'anexos/imagens_perfil/usuario02.jpg';
        }
        if (fotoPerfil.includes('usuario03') || fotoPerfil === 'usuario03.jpg') {
            return 'anexos/imagens_perfil/usuario03.jpg';
        }
        if (fotoPerfil.includes('saepsaude') || fotoPerfil === 'saepsaude.png') {
            return 'anexos/logo_saepsaude/SAEPSaude.png';
        }
    }
    
    // Mapear nomes de usuário para imagens
    if (nomeUsuario) {
        const nomeLower = nomeUsuario.toLowerCase();
        if (nomeLower.includes('usuario01') || nomeLower.includes('usuario1')) {
            return 'anexos/imagens_perfil/usuario01.jpg';
        }
        if (nomeLower.includes('usuario02') || nomeLower.includes('usuario2')) {
            return 'anexos/imagens_perfil/usuario02.jpg';
        }
        if (nomeLower.includes('usuario03') || nomeLower.includes('usuario3')) {
            return 'anexos/imagens_perfil/usuario03.jpg';
        }
    }
    
    return 'anexos/imagens_perfil/usuario01.jpg'; // Default
}

// Criar card de receita
function criarCardReceita(receita) {
    const card = document.createElement('div');
    card.className = 'receita-card';
    card.dataset.receitaId = receita.id;

    const dataFormatada = formatarData(receita.data_criacao);
    // Converter tempo_preparo para formato de distância (km)
    const distanciaKm = (receita.tempo_preparo / 10).toFixed(1);
    // Porções como duração
    const duracaoMin = receita.porcoes;
    // Dificuldade como calorias
    const calorias = receita.dificuldade === 'Fácil' ? 200 : receita.dificuldade === 'Médio' ? 350 : 500;
    const fotoPerfil = obterFotoPerfil(receita.foto_perfil, receita.usuario_nome);

    card.innerHTML = `
        <div class="receita-left">
            <img src="${fotoPerfil}" alt="Avatar" class="receita-avatar">
            <div class="receita-usuario-nome">${receita.usuario_nome}</div>
        </div>
        <div class="receita-center">
            <div class="receita-tipo">${receita.tipo}</div>
            <div class="receita-data">${dataFormatada}</div>
            <div class="receita-info">
                <div class="receita-info-item">
                    <span class="receita-info-value">${distanciaKm} km</span>
                    <span class="receita-info-label">Distância</span>
                </div>
                <div class="receita-info-item">
                    <span class="receita-info-value">${duracaoMin} min</span>
                    <span class="receita-info-label">Duração</span>
                </div>
                <div class="receita-info-item">
                    <span class="receita-info-value">${calorias}</span>
                    <span class="receita-info-label">Calorias</span>
                </div>
            </div>
        </div>
        <div class="receita-right">
            <div class="receita-acao" data-acao="like">
                <img src="anexos/icones/coracao.svg" alt="Like" class="icon-like">
                <span class="like-count">${receita.total_likes || 0}</span>
            </div>
            <div class="receita-acao" data-acao="comentario">
                <img src="anexos/icones/comentario.svg" alt="Comentário">
                <span class="comentario-count">${receita.total_comentarios || 0}</span>
            </div>
        </div>
    `;

    // Adicionar seção de comentários separadamente para melhor controle
    const comentariosSection = document.createElement('div');
    comentariosSection.className = 'comentarios-section d-none';
    comentariosSection.setAttribute('data-comentarios-section', '');
    comentariosSection.innerHTML = `
        <div class="comentario-input-container">
            <input type="text" class="comentario-input" placeholder="Escrever um comentário..." data-comentario-input>
            <button class="btn-enviar-comentario" data-enviar-comentario type="button">
                Enviar
            </button>
        </div>
        <div class="erro-comentario d-none" data-erro-comentario></div>
        <div class="comentarios-lista" data-comentarios-lista></div>
    `;
    card.appendChild(comentariosSection);

    // Eventos de like e comentário
    const likeBtn = card.querySelector('[data-acao="like"]');
    const comentarioBtn = card.querySelector('[data-acao="comentario"]');
    const enviarComentarioBtn = card.querySelector('[data-enviar-comentario]');
    const comentarioInput = card.querySelector('[data-comentario-input]');

    likeBtn.addEventListener('click', () => {
        if (!usuarioLogado) {
            mostrarModalLogin();
            return;
        }
        toggleLike(receita.id, likeBtn);
    });

    comentarioBtn.addEventListener('click', () => {
        if (!usuarioLogado) {
            mostrarModalLogin();
            return;
        }
        const section = card.querySelector('[data-comentarios-section]');
        section.classList.toggle('d-none');
        if (!section.classList.contains('d-none')) {
            carregarComentarios(receita.id, card);
        }
    });

    enviarComentarioBtn.addEventListener('click', () => enviarComentario(receita.id, comentarioInput, card));
    comentarioInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarComentario(receita.id, comentarioInput, card);
    });

    return card;
}

// Carregar likes e comentários
async function carregarLikesComentarios(receitaId, card) {
    if (!usuarioLogado) return;

    try {
        const response = await fetch(`${API_URL}/receitas/${receitaId}/likes`, {
            headers: { 'user-id': usuarioLogado.id }
        });
        const data = await response.json();
        const likeBtn = card.querySelector('[data-acao="like"]');
        if (likeBtn) {
            const likeImg = likeBtn.querySelector('img');
            if (data.curtiu && likeImg) {
                likeBtn.classList.add('curtido');
                likeImg.src = 'anexos/icones/CoracaoVermelho.svg';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar likes:', error);
    }
}

// Toggle like
async function toggleLike(receitaId, btn) {
    try {
        const response = await fetch(`${API_URL}/receitas/${receitaId}/like`, {
            method: 'POST',
            headers: { 'user-id': usuarioLogado.id, 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        const countEl = btn.querySelector('.like-count');
        const likeImg = btn.querySelector('img');
        let count = parseInt(countEl.textContent);
        
        if (data.acao === 'adicionado') {
            count++;
            btn.classList.add('curtido');
            if (likeImg) {
                likeImg.src = 'anexos/icones/CoracaoVermelho.svg';
            }
        } else {
            count--;
            btn.classList.remove('curtido');
            if (likeImg) {
                likeImg.src = 'anexos/icones/coracao.svg';
            }
        }
        countEl.textContent = count;
        carregarEstatisticas();
    } catch (error) {
        console.error('Erro ao dar like:', error);
    }
}

// Carregar comentários
async function carregarComentarios(receitaId, card) {
    try {
        const response = await fetch(`${API_URL}/receitas/${receitaId}/comentarios`);
        const comentarios = await response.json();
        const lista = card.querySelector('[data-comentarios-lista]');
        lista.innerHTML = '';

        comentarios.forEach(comentario => {
            const item = document.createElement('div');
            item.className = 'comentario-item';
            const fotoPerfil = obterFotoPerfil(comentario.foto_perfil, comentario.usuario_nome);
            item.innerHTML = `
                <div class="comentario-header">
                    <img src="${fotoPerfil}" alt="Avatar" class="comentario-avatar">
                    <strong>${comentario.usuario_nome}</strong>
                </div>
                <div class="comentario-texto">${comentario.texto}</div>
            `;
            lista.appendChild(item);
        });

        const countEl = card.querySelector('.comentario-count');
        countEl.textContent = comentarios.length;
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
    }
}

// Enviar comentário
async function enviarComentario(receitaId, input, card) {
    const texto = input.value.trim();
    const erroEl = card.querySelector('[data-erro-comentario]');

    if (!texto) {
        erroEl.textContent = 'não é possível enviar um comentário vazio';
        erroEl.classList.remove('d-none');
        return;
    }

    if (texto.length < 3) {
        erroEl.textContent = 'Comentário deve ter pelo menos 3 caracteres';
        erroEl.classList.remove('d-none');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/receitas/${receitaId}/comentarios`, {
            method: 'POST',
            headers: { 'user-id': usuarioLogado.id, 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });

        if (response.ok) {
            input.value = '';
            erroEl.classList.add('d-none');
            carregarComentarios(receitaId, card);
            carregarEstatisticas();
        } else {
            const data = await response.json();
            erroEl.textContent = data.erro || 'Erro ao enviar comentário';
            erroEl.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Erro ao enviar comentário:', error);
        erroEl.textContent = 'Erro ao enviar comentário';
        erroEl.classList.remove('d-none');
    }
}

// Criar paginação
function criarPaginacao(paginacao) {
    const container = document.getElementById('paginacao-container');
    if (!paginacao || paginacao.total <= paginacao.limite) {
        container.innerHTML = '';
        return;
    }

    const totalPaginas = Math.ceil(paginacao.total / paginacao.limite);
    const paginacaoEl = document.createElement('div');
    paginacaoEl.className = 'paginacao';

    // Botão Primeira
    const btnPrimeira = document.createElement('button');
    btnPrimeira.className = 'btn-pagina';
    btnPrimeira.textContent = 'Primeira';
    btnPrimeira.disabled = paginaAtual === 1;
    btnPrimeira.addEventListener('click', () => {
        paginaAtual = 1;
        carregarReceitas();
    });
    paginacaoEl.appendChild(btnPrimeira);

    // Botão Anterior
    const btnAnterior = document.createElement('button');
    btnAnterior.className = 'btn-pagina';
    btnAnterior.textContent = 'Anterior';
    btnAnterior.disabled = paginaAtual === 1;
    btnAnterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            carregarReceitas();
        }
    });
    paginacaoEl.appendChild(btnAnterior);

    // Números de página
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-pagina';
        if (i === paginaAtual) btn.classList.add('active');
        btn.textContent = i;
        btn.addEventListener('click', () => {
            paginaAtual = i;
            carregarReceitas();
        });
        paginacaoEl.appendChild(btn);
    }

    // Botão Próxima
    const btnProxima = document.createElement('button');
    btnProxima.className = 'btn-pagina';
    btnProxima.textContent = 'Próxima';
    btnProxima.disabled = paginaAtual === totalPaginas;
    btnProxima.addEventListener('click', () => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            carregarReceitas();
        }
    });
    paginacaoEl.appendChild(btnProxima);

    // Botão Última
    const btnUltima = document.createElement('button');
    btnUltima.className = 'btn-pagina';
    btnUltima.textContent = 'Última';
    btnUltima.disabled = paginaAtual === totalPaginas;
    btnUltima.addEventListener('click', () => {
        paginaAtual = totalPaginas;
        carregarReceitas();
    });
    paginacaoEl.appendChild(btnUltima);

    container.innerHTML = '';
    container.appendChild(paginacaoEl);
}

// Fazer login
async function fazerLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const erroEl = document.getElementById('login-erro');

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (response.ok) {
            usuarioLogado = await response.json();
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal.hide();
            atualizarInterfaceLogin();
            carregarReceitas();
        } else {
            const data = await response.json();
            erroEl.textContent = data.erro || 'Erro ao fazer login';
            erroEl.classList.remove('d-none');
        }
    } catch (error) {
        erroEl.textContent = 'Erro ao fazer login';
        erroEl.classList.remove('d-none');
    }
}

// Fazer logout
function fazerLogout() {
    usuarioLogado = null;
    atualizarInterfaceLogin();
    tipoFiltro = '';
    paginaAtual = 1;
    modoMinhasReceitas = false;
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-tipo=""]').classList.add('active');
    carregarReceitas();
}

// Atualizar interface de login
function atualizarInterfaceLogin() {
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const btnReceitas = document.getElementById('btn-receitas');
    const userInfo = document.getElementById('user-info');

    if (usuarioLogado) {
        btnLogin.classList.add('d-none');
        btnLogout.classList.remove('d-none');
        btnReceitas.disabled = false;
        userInfo.textContent = `Olá, ${usuarioLogado.nome}`;
        userInfo.classList.remove('d-none');
    } else {
        btnLogin.classList.remove('d-none');
        btnLogout.classList.add('d-none');
        btnReceitas.disabled = true;
        userInfo.classList.add('d-none');
    }
}

// Mostrar modal de login
function mostrarModalLogin() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}


// Criar receita
async function criarReceita(e) {
    e.preventDefault();
    const form = e.target;
    const campos = {
        titulo: document.getElementById('receita-titulo'),
        tipo: document.getElementById('receita-tipo'),
        tempo: document.getElementById('receita-tempo'),
        porcoes: document.getElementById('receita-porcoes'),
        dificuldade: document.getElementById('receita-dificuldade')
    };

    let temErro = false;
    Object.keys(campos).forEach(key => {
        const campo = campos[key];
        const erroEl = campo.nextElementSibling;
        if (!campo.value) {
            campo.classList.add('erro');
            erroEl.textContent = 'Campo obrigatório';
            erroEl.classList.remove('d-none');
            temErro = true;
        } else {
            campo.classList.remove('erro');
            erroEl.classList.add('d-none');
        }
    });

    if (temErro) return;

    try {
        const response = await fetch(`${API_URL}/receitas`, {
            method: 'POST',
            headers: { 'user-id': usuarioLogado.id, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titulo: campos.titulo.value,
                tipo: campos.tipo.value,
                tempo_preparo: parseInt(campos.tempo.value),
                porcoes: parseInt(campos.porcoes.value),
                dificuldade: campos.dificuldade.value
            })
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('criarReceitaModal'));
            modal.hide();
            form.reset();
            tipoFiltro = '';
            paginaAtual = 1;
            modoMinhasReceitas = false;
            document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('active'));
            const btnTodas = document.querySelector('[data-tipo=""]');
            if (btnTodas) btnTodas.classList.add('active');
            carregarReceitas();
            carregarEstatisticas();
        } else {
            const data = await response.json();
            alert(data.erro || 'Erro ao criar receita');
        }
    } catch (error) {
        console.error('Erro ao criar receita:', error);
        alert('Erro ao criar receita');
    }
}

// Formatar data
function formatarData(dataString) {
    const data = new Date(dataString);
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = String(data.getFullYear()).slice(-2);
    return `${horas}:${minutos} - ${dia}/${mes}/${ano}`;
}


