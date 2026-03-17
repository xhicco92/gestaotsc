// Aguarda o carregamento completo da página
document.addEventListener('DOMContentLoaded', function() {
    // ===== ELEMENTOS DO DOM =====
    const btnAbertos = document.getElementById('btnAbertos');
    const btnProdutividade = document.getElementById('btnProdutividade');
    const contentArea = document.getElementById('contentArea');

    // ===== FUNÇÕES PRINCIPAIS =====

    /**
     * Função principal para carregar conteúdo
     * @param {string} page - Página a carregar ('abertos' ou 'produtividade')
     */
    async function loadContent(page) {
        // Mostra loading
        contentArea.innerHTML = '<div class="loading">Carregando...</div>';
        
        try {
            let content = '';
            
            // Carrega o conteúdo baseado na página selecionada
            switch(page) {
                case 'abertos':
                    content = loadAbertosContent();
                    break;
                case 'produtividade':
                    content = await loadProdutividadeContent();
                    break;
                default:
                    content = '<div class="mensagem-inicial"><p>Selecione uma opção do menu</p></div>';
            }
            
            // Atualiza o conteúdo
            contentArea.innerHTML = content;
            
            // Se for produtividade, adiciona os event listeners necessários
            if (page === 'produtividade') {
                setupProdutividadeListeners();
            }
            
        } catch (error) {
            contentArea.innerHTML = `<div class="error">❌ Erro ao carregar conteúdo: ${error.message}</div>`;
        }
    }

    /**
     * Carrega conteúdo da área "Abertos"
     * @returns {string} HTML da área de abertos
     */
    function loadAbertosContent() {
        return `
            <div class="abertos-container">
                <h2>📋 Abertos - Área Técnica</h2>
                <p>🔧 Esta área está em desenvolvimento. Em breve poderá visualizar todas as OS abertas aqui.</p>
                <p style="font-size: 14px; margin-top: 20px;">Número de OS abertas: <strong>0</strong></p>
            </div>
        `;
    }

    /**
     * Carrega conteúdo da área "Produtividades"
     * @returns {string} HTML do dashboard de produtividade
     */
    async function loadProdutividadeContent() {
        // Simula carregamento de dados (remover quando tiver API real)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return `
            <div class="produtividade-container">
                <h2>⚡ Dashboard de Produtividade</h2>
                
                <!-- Filtros -->
                <div class="filtros-periodo">
                    <h3>📅 Filtrar por período:</h3>
                    <select id="periodoSelect">
                        <option value="hoje">Hoje</option>
                        <option value="ontem">Ontem</option>
                        <option value="semana" selected>Esta Semana</option>
                        <option value="mes">Este Mês</option>
                        <option value="trimestre">Este Trimestre</option>
                        <option value="ano">Este Ano</option>
                    </select>
                </div>
                
                <!-- Cards de Métricas -->
                <div class="cards-produtividade">
                    <div class="card">
                        <h4>✅ OS Concluídas</h4>
                        <p class="valor" id="osConcluidas">0</p>
                    </div>
                    <div class="card">
                        <h4>⏱️ Horas Trabalhadas</h4>
                        <p class="valor" id="horasTrabalhadas">0</p>
                    </div>
                    <div class="card">
                        <h4>📊 Produtividade Média</h4>
                        <p class="valor" id="produtividadeMedia">0%</p>
                    </div>
                    <div class="card">
                        <h4>👥 Técnicos Ativos</h4>
                        <p class="valor" id="tecnicosAtivos">0</p>
                    </div>
                </div>
                
                <!-- Gráficos -->
                <div class="graficos-container">
                    <div class="grafico">
                        <h4>📈 Produtividade por Técnico</h4>
                        <div class="placeholder-grafico" id="graficoTecnicos">
                            <p>Gráfico em desenvolvimento...</p>
                        </div>
                    </div>
                    
                    <div class="grafico">
                        <h4>📊 Evolução Diária</h4>
                        <div class="placeholder-grafico" id="graficoEvolucao">
                            <p>Gráfico em desenvolvimento...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Tabela de Técnicos (opcional) -->
                <div style="margin-top: 30px;">
                    <h4>📋 Detalhamento por Técnico</h4>
                    <div class="placeholder-grafico" style="height: 150px;">
                        <p>Tabela de técnicos em desenvolvimento...</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Configura os listeners específicos da página de produtividade
     */
    function setupProdutividadeListeners() {
        const periodoSelect = document.getElementById('periodoSelect');
        if (periodoSelect) {
            periodoSelect.addEventListener('change', function(e) {
                const periodo = e.target.value;
                console.log('Período selecionado:', periodo);
                atualizarDadosProdutividade(periodo);
            });
        }
        
        // Carrega dados iniciais
        atualizarDadosProdutividade('semana');
    }

    /**
     * Atualiza os dados de produtividade baseado no período
     * @param {string} periodo - Período selecionado
     */
    function atualizarDadosProdutividade(periodo) {
        // Simula dados diferentes por período
        // ESTA FUNÇÃO SERÁ SUBSTITUÍDA QUANDO TIVERES OS DADOS REAIS
        
        let osCount, horasCount, produtividade, tecnicosCount;
        
        switch(periodo) {
            case 'hoje':
                osCount = 5;
                horasCount = 32;
                produtividade = 78;
                tecnicosCount = 4;
                break;
            case 'ontem':
                osCount = 7;
                horasCount = 41;
                produtividade = 82;
                tecnicosCount = 4;
                break;
            case 'semana':
                osCount = 42;
                horasCount = 245;
                produtividade = 85;
                tecnicosCount = 6;
                break;
            case 'mes':
                osCount = 168;
                horasCount = 980;
                produtividade = 79;
                tecnicosCount = 6;
                break;
            case 'trimestre':
                osCount = 495;
                horasCount = 2875;
                produtividade = 81;
                tecnicosCount = 6;
                break;
            case 'ano':
                osCount = 1876;
                horasCount = 11245;
                produtividade = 77;
                tecnicosCount = 8;
                break;
            default:
                osCount = 42;
                horasCount = 245;
                produtividade = 85;
                tecnicosCount = 6;
        }
        
        // Atualiza os elementos HTML
        document.getElementById('osConcluidas').textContent = osCount;
        document.getElementById('horasTrabalhadas').textContent = horasCount;
        document.getElementById('produtividadeMedia').textContent = produtividade + '%';
        document.getElementById('tecnicosAtivos').textContent = tecnicosCount;
        
        // Mostra feedback visual da atualização
        mostrarFeedbackAtualizacao(periodo);
    }

    /**
     * Mostra feedback visual quando os dados são atualizados
     * @param {string} periodo - Período atualizado
     */
    function mostrarFeedbackAtualizacao(periodo) {
        const periodoSelect = document.getElementById('periodoSelect');
        if (periodoSelect) {
            periodoSelect.style.transition = 'all 0.3s';
            periodoSelect.style.backgroundColor = '#d4edda';
            periodoSelect.style.borderColor = '#28a745';
            
            setTimeout(() => {
                periodoSelect.style.backgroundColor = '';
                periodoSelect.style.borderColor = '';
            }, 500);
        }
        
        // Traduz o período para português
        const periodos = {
            'hoje': 'Hoje',
            'ontem': 'Ontem',
            'semana': 'Esta Semana',
            'mes': 'Este Mês',
            'trimestre': 'Este Trimestre',
            'ano': 'Este Ano'
        };
        
        console.log(`✅ Dados atualizados para: ${periodos[periodo] || periodo}`);
    }

    // ===== EVENT LISTENERS =====
    
    // Botão Abertos
    btnAbertos.addEventListener('click', function() {
        loadContent('abertos');
        // Feedback visual no botão
        this.style.transform = 'scale(0.95)';
        setTimeout(() => this.style.transform = '', 200);
    });

    // Botão Produtividade
    btnProdutividade.addEventListener('click', function() {
        loadContent('produtividade');
        // Feedback visual no botão
        this.style.transform = 'scale(0.95)';
        setTimeout(() => this.style.transform = '', 200);
    });

    // ===== INICIALIZAÇÃO =====
    console.log('✅ Dashboard inicializado com sucesso!');
});
