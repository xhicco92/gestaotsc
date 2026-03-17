// ============================================
// DASHBOARD CENTRO TÉCNICO - SCRIPT PRINCIPAL
// ============================================

// Variável global para o processador de dados
const prodProcessor = new ProdutividadeProcessor();

// ============================================
// FUNÇÕES DE NAVEGAÇÃO PRINCIPAL
// ============================================

function mostrarAbertos() {
    const conteudo = document.getElementById('conteudo');
    
    conteudo.innerHTML = `
        <div class="abertos-container">
            <div class="produtividade-header">
                <h2><span class="material-icons">folder_open</span> OS Abertas - Área Técnica</h2>
                <div class="filtros-periodo">
                    <button class="filtro-btn active">Todas</button>
                    <button class="filtro-btn">Hoje</button>
                    <button class="filtro-btn">Esta semana</button>
                </div>
            </div>
            
            <div class="cards-grid">
                <div class="stat-card warning">
                    <span class="material-icons stat-icon">schedule</span>
                    <span class="stat-label">Aguardando início</span>
                    <div class="stat-value">12</div>
                    <div class="stat-trend"><span class="material-icons">arrow_upward</span> +3 hoje</div>
                </div>
                <div class="stat-card info">
                    <span class="material-icons stat-icon">build</span>
                    <span class="stat-label">Em andamento</span>
                    <div class="stat-value">8</div>
                    <div class="stat-trend"><span class="material-icons">schedule</span> Média 2h</div>
                </div>
                <div class="stat-card positive">
                    <span class="material-icons stat-icon">check_circle</span>
                    <span class="stat-label">Concluídas hoje</span>
                    <div class="stat-value">5</div>
                    <div class="stat-trend"><span class="material-icons">check</span> 100% meta</div>
                </div>
                <div class="stat-card">
                    <span class="material-icons stat-icon">warning</span>
                    <span class="stat-label">Urgentes</span>
                    <div class="stat-value">3</div>
                    <div class="stat-trend"><span class="material-icons">arrow_upward</span> +2</div>
                </div>
            </div>
            
            <div class="graficos-container">
                <div class="grafico-card">
                    <div class="grafico-header">
                        <h3>OS por prioridade</h3>
                    </div>
                    <div class="grafico-placeholder">
                        <span class="material-icons">pie_chart</span> Gráfico de distribuição
                    </div>
                </div>
                <div class="grafico-card">
                    <div class="grafico-header">
                        <h3>Técnicos disponíveis</h3>
                    </div>
                    <div class="tecnicos-list" style="margin-top: 0;">
                        <div class="tecnico-item">
                            <div class="tecnico-avatar">JC</div>
                            <div class="tecnico-info">
                                <div class="tecnico-nome">João Carlos</div>
                                <div class="tecnico-progresso">
                                    <span class="tecnico-status" style="color: #10b981;">● Disponível</span>
                                </div>
                            </div>
                        </div>
                        <div class="tecnico-item">
                            <div class="tecnico-avatar">MA</div>
                            <div class="tecnico-info">
                                <div class="tecnico-nome">Maria Antônia</div>
                                <div class="tecnico-progresso">
                                    <span class="tecnico-status" style="color: #f59e0b;">● Em OS</span>
                                </div>
                            </div>
                        </div>
                        <div class="tecnico-item">
                            <div class="tecnico-avatar">PS</div>
                            <div class="tecnico-info">
                                <div class="tecnico-nome">Pedro Santos</div>
                                <div class="tecnico-progresso">
                                    <span class="tecnico-status" style="color: #10b981;">● Disponível</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function mostrarProdutividade() {
    const conteudo = document.getElementById('conteudo');
    
    conteudo.innerHTML = `
        <div class="produtividade-container">
            <!-- Header com filtros -->
            <div class="produtividade-header">
                <h2><span class="material-icons">bar_chart</span> Produtividade dos Técnicos</h2>
                <div class="filtros-periodo">
                    <button class="filtro-btn active" onclick="filtrarProdutividade('hoje', this)">Hoje</button>
                    <button class="filtro-btn" onclick="filtrarProdutividade('ontem', this)">Ontem</button>
                    <button class="filtro-btn" onclick="filtrarProdutividade('semana', this)">Últimos 7 dias</button>
                    <button class="filtro-btn" onclick="filtrarProdutividade('mes', this)">Últimos 30 dias</button>
                    <button class="filtro-btn" onclick="filtrarProdutividade('trimestre', this)">Últimos 90 dias</button>
                </div>
            </div>

            <!-- Cards de resumo -->
            <div class="cards-resumo">
                <div class="resumo-card">
                    <span class="material-icons">build</span>
                    <div>
                        <small>Total Reparados</small>
                        <strong id="totalReparados">0</strong>
                    </div>
                </div>
                <div class="resumo-card">
                    <span class="material-icons">date_range</span>
                    <div>
                        <small>Média Diária</small>
                        <strong id="mediaDiaria">0</strong>
                    </div>
                </div>
                <div class="resumo-card">
                    <span class="material-icons">people</span>
                    <div>
                        <small>Técnicos Ativos</small>
                        <strong id="tecnicosAtivos">0</strong>
                    </div>
                </div>
                <div class="resumo-card">
                    <span class="material-icons">trending_up</span>
                    <div>
                        <small>Média por Técnico</small>
                        <strong id="mediaPorTecnico">0</strong>
                    </div>
                </div>
            </div>

            <!-- Tabela de produtividade por técnico -->
            <div class="tabela-tecnicos">
                <h3>Reparados por Técnico</h3>
                <table id="tabelaProdutividade">
                    <thead>
                        <tr>
                            <th>Técnico</th>
                            <th>Equipamentos Reparados</th>
                            <th>Média Diária</th>
                            <th>Desempenho</th>
                        </tr>
                    </thead>
                    <tbody id="corpoTabela">
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 30px;">
                                <span class="material-icons" style="font-size: 48px; color: #94a3b8;">upload_file</span>
                                <p style="margin-top: 10px;">Carregue um ficheiro Excel para ver os dados</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Gráfico de evolução diária (para períodos > 1 dia) -->
            <div class="grafico-evolucao" id="graficoEvolucao" style="display: none;">
                <h3>Evolução Diária</h3>
                <div class="grafico-barras" id="barrasEvolucao">
                    <!-- Barras serão geradas aqui -->
                </div>
            </div>

            <!-- Área de upload -->
            <div id="uploadArea" class="upload-area">
                <div class="upload-box">
                    <span class="material-icons" style="font-size: 48px;">upload_file</span>
                    <h3>Carregar ficheiro Excel</h3>
                    <p>Selecione o ficheiro com os dados da API</p>
                    <input type="file" id="fileInput" accept=".xlsx, .xls, .csv" style="display: none;">
                    <button onclick="document.getElementById('fileInput').click()" class="btn-upload">
                        Selecionar Ficheiro
                    </button>
                    <div id="fileInfo" class="file-info"></div>
                </div>
            </div>
        </div>
    `;

    // Adiciona o event listener para o upload
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
}

// ============================================
// FUNÇÕES DE PROCESSAMENTO DE DADOS
// ============================================

// Função para handle do upload
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('fileInfo').innerHTML = `
        <span class="material-icons" style="font-size: 16px; vertical-align: middle;">check_circle</span> 
        ${file.name} (${(file.size/1024).toFixed(2)} KB)
    `;

    // Mostra loading
    mostrarLoading(true);

    try {
        await prodProcessor.carregarDados(file);
        
        // Esconde área de upload
        document.getElementById('uploadArea').style.display = 'none';
        
        // Mostra gráfico de evolução
        document.getElementById('graficoEvolucao').style.display = 'block';
        
        // Carrega dados de hoje inicialmente
        const botaoHoje = document.querySelector('.filtro-btn.active');
        if (botaoHoje) {
            filtrarProdutividade('hoje', botaoHoje);
        }
        
    } catch (error) {
        alert('Erro ao processar: ' + error.message);
        console.error(error);
    } finally {
        mostrarLoading(false);
    }
}

// Função para filtrar por período
function filtrarProdutividade(periodo, elemento) {
    if (!prodProcessor.dados || !prodProcessor.dados.length) {
        alert('Carregue um ficheiro primeiro!');
        return;
    }

    // Atualiza botões ativos
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    elemento.classList.add('active');

    // Filtra dados
    const dadosFiltrados = prodProcessor.filtrarPorPeriodo(periodo);
    const stats = prodProcessor.calcularEstatisticas(dadosFiltrados, periodo);
    
    // Atualiza cards
    document.getElementById('totalReparados').textContent = stats.totalReparados;
    document.getElementById('mediaDiaria').textContent = stats.mediaDiaria.toFixed(1);
    document.getElementById('tecnicosAtivos').textContent = stats.tecnicosAtivos;
    document.getElementById('mediaPorTecnico').textContent = stats.mediaPorTecnico.toFixed(1);

    // Atualiza tabela
    atualizarTabelaTecnicos(stats.reparados, periodo);

    // Se período > 1 dia, mostra gráfico de evolução
    if (periodo !== 'hoje' && periodo !== 'ontem') {
        document.getElementById('graficoEvolucao').style.display = 'block';
        const evolucao = prodProcessor.agruparPorDia(dadosFiltrados);
        desenharGraficoEvolucao(evolucao);
    } else {
        document.getElementById('graficoEvolucao').style.display = 'none';
    }
}

// Atualiza tabela de técnicos
function atualizarTabelaTecnicos(reparados, periodo) {
    const tbody = document.getElementById('corpoTabela');
    const numeroDias = prodProcessor.calcularNumeroDias(periodo);
    
    // Ordena por número de reparados (decrescente)
    const tecnicosOrdenados = Object.entries(reparados)
        .sort((a, b) => b[1] - a[1]);
    
    if (tecnicosOrdenados.length === 0 || tecnicosOrdenados.every(([_, qtd]) => qtd === 0)) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 30px; color: #64748b;">
                    Nenhum equipamento reparado neste período
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = tecnicosOrdenados.map(([tecnico, quantidade]) => {
        const mediaDiaria = (quantidade / numeroDias).toFixed(1);
        const maxQuantidade = Math.max(...Object.values(reparados));
        const percentual = maxQuantidade > 0 ? (quantidade / maxQuantidade * 100) : 0;
        
        return `
            <tr>
                <td><strong>${tecnico}</strong></td>
                <td>${quantidade}</td>
                <td>${mediaDiaria}</td>
                <td>
                    <div class="barra-desempenho">
                        <div class="barra-preenchida" style="width: ${percentual}%"></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Desenha gráfico de evolução
function desenharGraficoEvolucao(dados) {
    const container = document.getElementById('barrasEvolucao');
    
    if (!dados || dados.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b;">Sem dados para exibir</p>';
        return;
    }
    
    const maxTotal = Math.max(...dados.map(d => d.total), 1);
    
    container.innerHTML = dados.map(dia => {
        const altura = (dia.total / maxTotal) * 180; // max 180px altura
        
        // Formata a data (dd/mm para dd/mm)
        const dataParts = dia.data.split('/');
        const dataLabel = `${dataParts[0]}/${dataParts[1]}`;
        
        return `
            <div class="barra-container">
                <div class="barra" style="height: ${altura}px">
                    <span class="barra-valor">${dia.total}</span>
                </div>
                <span class="barra-label">${dataLabel}</span>
            </div>
        `;
    }).join('');
}

// Loading
function mostrarLoading(show) {
    let loading = document.getElementById('loadingIndicator');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loadingIndicator';
        loading.className = 'loading-indicator';
        loading.innerHTML = '<div class="spinner"></div><p>A processar dados...</p>';
        document.body.appendChild(loading);
    }
    loading.style.display = show ? 'flex' : 'none';
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Atualiza a data no cabeçalho se existir
    const dataElement = document.getElementById('dataAtual');
    if (dataElement) {
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        dataElement.textContent = `📅 ${dia}/${mes}/${ano}`;
    }

    // Configura os botões do menu principal
    const btnAbertos = document.getElementById('btnAbertos');
    const btnProdutividade = document.getElementById('btnProdutividade');

    if (btnAbertos) {
        btnAbertos.addEventListener('click', function() {
            document.querySelectorAll('.botao-menu').forEach(btn => btn.classList.remove('ativo'));
            this.classList.add('ativo');
            mostrarAbertos();
        });
    }

    if (btnProdutividade) {
        btnProdutividade.addEventListener('click', function() {
            document.querySelectorAll('.botao-menu').forEach(btn => btn.classList.remove('ativo'));
            this.classList.add('ativo');
            mostrarProdutividade();
        });
    }

    // Carrega a página inicial (Abertos por padrão)
    if (btnAbertos) {
        btnAbertos.click();
    }
});
