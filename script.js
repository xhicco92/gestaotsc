// ============================================
// DASHBOARD CENTRO TÉCNICO - VERSÃO ESTÁVEL
// ============================================

const processor = new ProdutividadeProcessor();
const abertosProcessor = new AbertosProcessor();

// Estado atual dos filtros - PRODUTIVIDADES
let filtroAtual = {
    periodo: 'hoje',
    dataInicio: null,
    dataFim: null,
    tipologia: 'todas',
    mobileTipo: 'todos',
    polo: 'todos'
};

// Estado para a aba Abertos
let filtroAbertos = {
    tipologia: 'todas',
    mobileTipo: 'todos'
};

// Controlo do seletor de datas personalizado
let dataPickerVisible = false;

// Variável para guardar os dados atuais do período - PRODUTIVIDADES
let dadosPeriodoAtual = [];

// ============================================
// ABA PRODUTIVIDADES (TUDO COMO ESTAVA)
// ============================================

function mostrarProdutividade() {
    const html = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">📊 Produtividade dos Técnicos</h2>
                <button onclick="exportarRelatorioPDF()" 
                        style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; transition: all 0.3s;"
                        onmouseover="this.style.transform='scale(1.05)'" 
                        onmouseout="this.style.transform='scale(1)'">
                    <span style="font-size: 18px;">📄</span>
                    Exportar PDF
                </button>
            </div>
            
            <!-- FILTROS - TUDO NA MESMA LINHA -->
            <div style="background: #f8fafc; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    
                    <!-- FILTROS DE PERÍODO (esquerda) -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('hoje', this)">Hoje</button>
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('ontem', this)">Ontem</button>
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('semana', this)">7 dias</button>
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('mes', this)">30 dias</button>
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('trimestre', this)">90 dias</button>
                        
                        <!-- Botão para período personalizado -->
                        <button onclick="toggleDataPicker()" style="background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 14px;">
                            <span style="font-size: 16px;">📅</span>
                            Personalizado
                        </button>
                    </div>
                    
                    <!-- FILTROS DE TIPOLOGIA E LOCALIZAÇÃO (direita) -->
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
                        <!-- Tipologia -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 500; color: #475569; font-size: 14px;">🏷️ Tipologia:</span>
                            <select id="filtroTipologia" onchange="onTipologiaChange(this.value)" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; min-width: 150px; font-size: 14px;">
                                <option value="todas">Todas</option>
                                ${gerarOpcoesTipologia()}
                            </select>
                        </div>
                        
                        <!-- SUB-FILTRO MOBILE (aparece apenas quando Mobile é selecionado) -->
                        <div id="mobileSubFiltroContainer" style="display: none; align-items: center; gap: 8px;">
                            <span style="font-weight: 500; color: #475569; font-size: 14px;">📱 Mobile:</span>
                            <select id="mobileTipo" onchange="aplicarFiltroMobileTipo(this.value)" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; min-width: 120px; font-size: 14px;">
                                <option value="todos">Todos</option>
                                <option value="cliente">Cliente</option>
                                <option value="dg">D&G</option>
                            </select>
                        </div>
                        
                        <!-- Localização (Polo) -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 500; color: #475569; font-size: 14px;">📍 Localização:</span>
                            <select id="filtroPolo" onchange="aplicarFiltroPolo(this.value)" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; min-width: 130px; font-size: 14px;">
                                <option value="todos">Todos</option>
                                <option value="TSC SOUTH">TSC SOUTH</option>
                                <option value="TSC NORTH">TSC NORTH</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- SELETOR DE DATAS PERSONALIZADO (expansível) -->
                <div id="dataPickerContainer" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <span style="font-weight: bold; color: #475569;">📅 Selecionar período:</span>
                        <div>
                            <label style="font-size: 12px; color: #64748b; margin-right: 5px;">De:</label>
                            <input type="date" id="dataInicio" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #64748b; margin-right: 5px;">Até:</label>
                            <input type="date" id="dataFim" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;">
                        </div>
                        <button onclick="aplicarFiltroPersonalizado()" style="background: #2563eb; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer;">
                            Aplicar
                        </button>
                        <button onclick="toggleDataPicker()" style="background: transparent; border: 1px solid #94a3b8; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- CARDS DE RESUMO -->
            <div class="cards">
                <div class="card">
                    <small>Total Reparados</small>
                    <strong id="totalRep">0</strong>
                </div>
                <div class="card">
                    <small>Média Diária</small>
                    <strong id="mediaDia">0</strong>
                </div>
                <div class="card">
                    <small>Técnicos Ativos</small>
                    <strong id="tecAtivos">0</strong>
                </div>
                <div class="card">
                    <small>Média/Técnico</small>
                    <strong id="mediaTec">0</strong>
                </div>
            </div>
            
            <!-- INFORMAÇÃO DO FILTRO ATIVO -->
            <div id="infoFiltro" style="background: #e0f2fe; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 14px; color: #0369a1;">
                📍 Mostrando dados do período: <strong>Hoje</strong>
            </div>
            
            <!-- TABELA -->
            <div style="margin: 20px 0;">
                <h3 style="margin-bottom: 10px;">👥 Reparados por Técnico</h3>
                <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="position: sticky; top: 0; background: #f1f5f9;">
                            <tr>
                                <th style="padding: 10px; text-align: left;">Técnico</th>
                                <th style="padding: 10px; text-align: left;">Quantidade</th>
                                <th style="padding: 10px; text-align: left;">Média/Dia</th>
                                <th style="padding: 10px; text-align: left;">%</th>
                            </tr>
                        </thead>
                        <tbody id="tabela">
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 30px;">
                                    Carregue um ficheiro para começar
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- UPLOAD -->
            <div class="upload-area" id="uploadArea">
                <span style="font-size: 48px;">📤</span>
                <h3 style="margin: 15px 0;">Carregar Ficheiro Excel</h3>
                <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" style="display: none;">
                <button class="btn-upload" onclick="document.getElementById('fileInput').click()">
                    Selecionar Ficheiro
                </button>
                <div id="fileInfo" class="file-info"></div>
            </div>
        </div>
    `;
    
    document.getElementById('conteudo').innerHTML = html;
    
    setTimeout(() => {
        const input = document.getElementById('fileInput');
        if (input) {
            input.onchange = handleUpload;
        }
        
        const hoje = new Date();
        const seteDiasAtras = new Date(hoje);
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        
        const dataInicioInput = document.getElementById('dataInicio');
        const dataFimInput = document.getElementById('dataFim');
        
        if (dataInicioInput) {
            dataInicioInput.value = seteDiasAtras.toISOString().split('T')[0];
        }
        if (dataFimInput) {
            dataFimInput.value = hoje.toISOString().split('T')[0];
        }
        
        if (processor.dados && processor.dados.length > 0) {
            atualizarFiltroTipologia();
            const botoes = document.querySelectorAll('.filtro-btn');
            if (botoes.length > 0) {
                aplicarFiltroPeriodo('hoje', botoes[0]);
            }
        }
    }, 100);
}

function toggleDataPicker() {
    const container = document.getElementById('dataPickerContainer');
    if (container) {
        dataPickerVisible = !dataPickerVisible;
        container.style.display = dataPickerVisible ? 'block' : 'none';
    }
}

function gerarOpcoesTipologia() {
    if (!processor.dados || processor.dados.length === 0) {
        return '';
    }
    
    const tipologias = processor.getTipologias();
    
    return tipologias.map(tipologia => 
        `<option value="${tipologia}">${tipologia}</option>`
    ).join('');
}

function atualizarFiltroTipologia() {
    const select = document.getElementById('filtroTipologia');
    if (select) {
        const options = gerarOpcoesTipologia();
        select.innerHTML = `<option value="todas">Todas</option>${options}`;
    }
}

function onTipologiaChange(tipologia) {
    const mobileSubFiltro = document.getElementById('mobileSubFiltroContainer');
    
    if (tipologia === 'Mobile') {
        mobileSubFiltro.style.display = 'flex';
    } else {
        mobileSubFiltro.style.display = 'none';
        filtroAtual.mobileTipo = 'todos';
        const mobileSelect = document.getElementById('mobileTipo');
        if (mobileSelect) mobileSelect.value = 'todos';
    }
    
    filtroAtual.tipologia = tipologia;
    aplicarFiltros();
    atualizarInfoFiltro();
}

function aplicarFiltroMobileTipo(tipo) {
    filtroAtual.mobileTipo = tipo;
    aplicarFiltros();
    atualizarInfoFiltro();
}

function aplicarFiltroPolo(polo) {
    filtroAtual.polo = polo;
    aplicarFiltros();
    atualizarInfoFiltro();
}

function aplicarFiltroPeriodo(periodo, botao) {
    if (dataPickerVisible) {
        toggleDataPicker();
    }
    
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    botao.classList.add('active');
    
    filtroAtual.periodo = periodo;
    filtroAtual.dataInicio = null;
    filtroAtual.dataFim = null;
    
    aplicarFiltros();
    atualizarInfoFiltro();
}

function aplicarFiltroPersonalizado() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    if (!dataInicio || !dataFim) {
        alert('Selecione as datas de início e fim');
        return;
    }
    
    toggleDataPicker();
    
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    filtroAtual.periodo = 'personalizado';
    filtroAtual.dataInicio = new Date(dataInicio);
    filtroAtual.dataFim = new Date(dataFim);
    filtroAtual.dataFim.setHours(23, 59, 59, 999);
    
    aplicarFiltros();
    atualizarInfoFiltro();
}

function atualizarInfoFiltro() {
    const infoElement = document.getElementById('infoFiltro');
    let infoText = '';
    
    if (filtroAtual.periodo === 'personalizado') {
        const formatarData = (data) => {
            return data.toLocaleDateString('pt-PT');
        };
        infoText = `📍 Período: <strong>${formatarData(filtroAtual.dataInicio)}</strong> até <strong>${formatarData(filtroAtual.dataFim)}</strong>`;
    } else {
        const nomesPeriodo = {
            'hoje': 'Hoje',
            'ontem': 'Ontem',
            'semana': 'Últimos 7 dias',
            'mes': 'Últimos 30 dias',
            'trimestre': 'Últimos 90 dias'
        };
        infoText = `📍 Período: <strong>${nomesPeriodo[filtroAtual.periodo]}</strong>`;
    }
    
    if (filtroAtual.tipologia !== 'todas') {
        infoText += ` | Tipologia: <strong>${filtroAtual.tipologia}</strong>`;
        
        if (filtroAtual.tipologia === 'Mobile' && filtroAtual.mobileTipo !== 'todos') {
            const mobileTexto = filtroAtual.mobileTipo === 'cliente' ? 'Cliente' : 'D&G';
            infoText += ` <span style="background: #2563eb20; padding: 2px 6px; border-radius: 12px;">${mobileTexto}</span>`;
        }
    }
    
    if (filtroAtual.polo !== 'todos') {
        infoText += ` | Localização: <strong>${filtroAtual.polo}</strong>`;
    }
    
    infoElement.innerHTML = infoText;
}

function aplicarFiltros() {
    if (!processor.dados || processor.dados.length === 0) return;
    
    let dadosFiltrados = processor.dados;
    
    if (filtroAtual.periodo === 'personalizado') {
        dadosFiltrados = dadosFiltrados.filter(item => {
            const dataItem = processor.getDataReparacao(item);
            return dataItem && dataItem >= filtroAtual.dataInicio && dataItem <= filtroAtual.dataFim;
        });
    } else {
        dadosFiltrados = processor.filtrarPorPeriodo(filtroAtual.periodo);
    }
    
    if (filtroAtual.tipologia !== 'todas') {
        dadosFiltrados = dadosFiltrados.filter(item => 
            item.tipologia && item.tipologia === filtroAtual.tipologia
        );
        
        if (filtroAtual.tipologia === 'Mobile' && filtroAtual.mobileTipo !== 'todos') {
            dadosFiltrados = dadosFiltrados.filter(item => {
                if (filtroAtual.mobileTipo === 'dg') {
                    return item.tipo_garantia === 'Seguro D&G';
                } else if (filtroAtual.mobileTipo === 'cliente') {
                    return item.tipo_garantia && item.tipo_garantia !== 'Seguro D&G';
                }
                return true;
            });
        }
    }
    
    if (filtroAtual.polo !== 'todos') {
        dadosFiltrados = dadosFiltrados.filter(item => 
            item.polo && item.polo === filtroAtual.polo
        );
    }
    
    dadosPeriodoAtual = dadosFiltrados;
    
    const stats = processor.calcularEstatisticas(dadosFiltrados, filtroAtual.periodo);
    
    document.getElementById('totalRep').textContent = stats.totalReparados;
    document.getElementById('mediaDia').textContent = stats.mediaDiaria.toFixed(1);
    document.getElementById('tecAtivos').textContent = stats.tecnicosAtivos;
    document.getElementById('mediaTec').textContent = stats.mediaPorTecnico.toFixed(1);
    
    atualizarTabela(stats);
}

function atualizarTabela(stats) {
    const tabela = document.getElementById('tabela');
    
    if (stats.totalReparados === 0) {
        tabela.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum reparado neste período</td></tr>`;
        return;
    }
    
    const maxQuantidade = Math.max(...Object.values(stats.reparados));
    const diasComRegisto = stats.numeroDias;
    
    const tecnicosOrdenados = Object.entries(stats.reparados)
        .filter(([_, qtd]) => qtd > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);
    
    tabela.innerHTML = tecnicosOrdenados.map(([tecnico, qtd]) => {
        const media = diasComRegisto > 0 ? (qtd / diasComRegisto).toFixed(1) : '0.0';
        const percentual = (qtd / maxQuantidade * 100).toFixed(0);
        return `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                    <a href="javascript:void(0)" onclick="abrirDetalheTecnico('${tecnico.replace(/'/g, "\\'")}')" 
                       style="color: #2563eb; text-decoration: none; font-weight: 600; cursor: pointer;">
                        ${tecnico}
                    </a>
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${qtd}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${media}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                    <div style="background: #e2e8f0; border-radius: 10px; width: 100px; height: 8px;">
                        <div style="background: linear-gradient(90deg, #2563eb, #7c3aed); width: ${percentual}%; height: 8px; border-radius: 10px;"></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.innerHTML = `📂 A processar ${file.name}...`;
    
    try {
        await processor.carregarDados(file);
        
        document.getElementById('uploadArea').style.display = 'none';
        atualizarFiltroTipologia();
        
        const botoes = document.querySelectorAll('.filtro-btn');
        if (botoes.length > 0) {
            aplicarFiltroPeriodo('hoje', botoes[0]);
        }
        
        fileInfo.innerHTML = `✅ ${file.name} carregado (${processor.dados.length} registos)`;
        
    } catch (error) {
        fileInfo.innerHTML = `❌ Erro: ${error.message}`;
        console.error(error);
    }
}

function abrirDetalheTecnico(tecnico) {
    if (!processor.dados || processor.dados.length === 0) {
        alert('Carregue um ficheiro primeiro!');
        return;
    }
    
    let dadosTecnico = dadosPeriodoAtual.filter(item => {
        const tecnicoItem = item.tecnico_reparacao || item.Tecnico || 'Não atribuído';
        return tecnicoItem === tecnico;
    });
    
    const evolucaoDiaria = {};
    
    dadosTecnico.forEach(item => {
        const dataItem = processor.getDataReparacao(item);
        if (dataItem) {
            const dataStr = dataItem.toLocaleDateString('pt-PT');
            evolucaoDiaria[dataStr] = (evolucaoDiaria[dataStr] || 0) + 1;
        }
    });
    
    const diasOrdenados = Object.keys(evolucaoDiaria).sort((a, b) => {
        const [diaA, mesA, anoA] = a.split('/').map(Number);
        const [diaB, mesB, anoB] = b.split('/').map(Number);
        
        if (anoA !== anoB) return anoA - anoB;
        if (mesA !== mesB) return mesA - mesB;
        return diaA - diaB;
    });
    
    const valores = diasOrdenados.map(dia => evolucaoDiaria[dia]);
    const maxValor = Math.max(...valores, 1);
    
    const modal = document.createElement('div');
    modal.id = 'modalDetalhe';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: slideUp 0.3s ease;">
            <div style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 24px;">👤</span>
                        ${tecnico}
                    </h2>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">
                        Total reparado no período: <strong>${dadosTecnico.length}</strong>
                    </p>
                </div>
                <button onclick="fecharModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; padding: 4px 8px;">&times;</button>
            </div>
            
            <div style="padding: 24px;">
                <h3 style="margin: 0 0 20px 0; color: #475569; font-size: 16px;">📊 Evolução Diária</h3>
                
                <div style="background: #f8fafc; border-radius: 8px; padding: 20px;">
                    <div style="display: flex; align-items: flex-end; gap: 8px; min-height: 200px; padding: 10px 0;">
                        ${diasOrdenados.map((dia, index) => {
                            const altura = (valores[index] / maxValor) * 150;
                            return `
                                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                    <div style="width: 100%; display: flex; justify-content: center;">
                                        <div style="width: 30px; background: linear-gradient(180deg, #2563eb, #7c3aed); border-radius: 6px 6px 0 0; height: ${altura}px; transition: height 0.3s; position: relative;">
                                            <span style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #475569; font-weight: bold;">${valores[index]}</span>
                                        </div>
                                    </div>
                                    <span style="font-size: 10px; color: #64748b; text-align: center;">${dia}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${diasOrdenados.length === 0 ? '<p style="text-align: center; color: #94a3b8; padding: 40px;">Nenhum registo neste período</p>' : ''}
                </div>
                
                <div style="margin-top: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #475569; font-size: 14px;">📋 Detalhamento Diário</h3>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="position: sticky; top: 0; background: #f1f5f9;">
                                <tr><th style="padding: 8px; text-align: left;">Data</th><th style="padding: 8px; text-align: center;">Quantidade</th></tr>
                            </thead>
                            <tbody>
                                ${diasOrdenados.map(dia => `
                                    <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${dia}</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${evolucaoDiaria[dia]}</td></tr>
                                `).join('')}
                                ${diasOrdenados.length === 0 ? '<tr><td colspan="2" style="padding: 20px; text-align: center;">Sem dados</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div style="padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;">
                <button onclick="fecharModal()" style="background: #f1f5f9; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; color: #475569;">Fechar</button>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    modal.appendChild(style);
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });
}

function fecharModal() {
    const modal = document.getElementById('modalDetalhe');
    if (modal) {
        modal.remove();
    }
}

async function exportarRelatorioPDF() {
    if (!processor.dados || processor.dados.length === 0) {
        alert('Carregue um ficheiro primeiro!');
        return;
    }
    
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2563eb;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1001;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    loadingMsg.innerHTML = '📄 A gerar relatório...';
    document.body.appendChild(loadingMsg);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const stats = processor.calcularEstatisticas(dadosPeriodoAtual, filtroAtual.periodo);
        
        const tecnicosOrdenados = Object.entries(stats.reparados)
            .filter(([_, qtd]) => qtd > 0)
            .sort((a, b) => b[1] - a[1]);
        
        const periodoTexto = filtroAtual.periodo === 'personalizado' ? 
            `${filtroAtual.dataInicio.toLocaleDateString('pt-PT')} a ${filtroAtual.dataFim.toLocaleDateString('pt-PT')}` : 
            {hoje:'Hoje',ontem:'Ontem',semana:'Últimos 7 dias',mes:'Últimos 30 dias',trimestre:'Últimos 90 dias'}[filtroAtual.periodo];
        
        let filtrosTexto = [];
        if (filtroAtual.tipologia !== 'todas') {
            let texto = `Tipologia: ${filtroAtual.tipologia}`;
            if (filtroAtual.tipologia === 'Mobile' && filtroAtual.mobileTipo !== 'todos') {
                texto += ` (${filtroAtual.mobileTipo === 'cliente' ? 'Cliente' : 'D&G'})`;
            }
            filtrosTexto.push(texto);
        }
        if (filtroAtual.polo !== 'todos') {
            filtrosTexto.push(`Localização: ${filtroAtual.polo}`);
        }
        
        const relatorioHTML = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Produtividade - Centro Técnico</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
                .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; }
                .header h1 { color: #1e293b; margin-bottom: 10px; }
                .info-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
                .info-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
                .info-card small { color: #64748b; font-size: 12px; }
                .info-card strong { display: block; font-size: 28px; color: #2563eb; margin-top: 5px; }
                .filtros-info { background: #e0f2fe; padding: 12px; border-radius: 6px; font-size: 14px; color: #0369a1; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #f1f5f9; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
                td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
                .footer { margin-top: 30px; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Relatório de Produtividade</h1>
                <p>Centro Técnico - Gerado em ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT')}</p>
            </div>
            
            <div class="info-section">
                <div class="info-grid">
                    <div class="info-card"><small>Total Reparados</small><strong>${stats.totalReparados}</strong></div>
                    <div class="info-card"><small>Média Diária</small><strong>${stats.mediaDiaria.toFixed(1)}</strong></div>
                    <div class="info-card"><small>Técnicos Ativos</small><strong>${stats.tecnicosAtivos}</strong></div>
                    <div class="info-card"><small>Média/Técnico</small><strong>${stats.mediaPorTecnico.toFixed(1)}</strong></div>
                </div>
                <div class="filtros-info">
                    <strong>📅 Período:</strong> ${periodoTexto}<br>
                    <strong>🔍 Filtros aplicados:</strong> ${filtrosTexto.length > 0 ? filtrosTexto.join(' | ') : 'Nenhum'}<br>
                    <strong>📆 Dias com registo:</strong> ${stats.numeroDias} dia(s)
                </div>
            </div>
            
            <h3>👥 Reparados por Técnico</h3>
            <table>
                <thead><tr><th>Técnico</th><th>Quantidade</th><th>Média/Dia</th><th>% do Total</th></tr></thead>
                <tbody>
                    ${tecnicosOrdenados.map(([tecnico, qtd]) => `
                        <tr>
                            <td><strong>${tecnico}</strong></td>
                            <td>${qtd}</td>
                            <td>${(qtd / stats.numeroDias).toFixed(1)}</td>
                            <td>${((qtd / stats.totalReparados) * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>Relatório gerado automaticamente pelo Dashboard Centro Técnico</p>
                <p>Os valores apresentados excluem registos com "Orçamento Rejeitado"</p>
            </div>
        </body>
        </html>`;
        
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(relatorioHTML);
        doc.close();
        
        iframe.contentWindow.onload = () => {
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        };
        
        loadingMsg.remove();
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        loadingMsg.style.background = '#ef4444';
        loadingMsg.innerHTML = '❌ Erro ao gerar relatório';
        setTimeout(() => loadingMsg.remove(), 2000);
        alert('Erro ao gerar relatório: ' + error.message);
    }
}

// ============================================
// ABA ABERTOS (NOVO)
// ============================================

function mostrarAbertos() {
    const html = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">📋 OS Abertas - Área Técnica</h2>
                <button onclick="exportarAbertosPDF()" 
                        style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold;">
                    <span style="font-size: 18px;">📄</span>
                    Exportar PDF
                </button>
            </div>
            
            <div style="background: #f8fafc; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 500;">🏷️ Tipologia:</span>
                        <select id="filtroTipologiaAbertos" onchange="onTipologiaAbertosChange(this.value)" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; min-width: 180px;">
                            <option value="todas">Todas as tipologias</option>
                            ${gerarOpcoesTipologiaAbertos()}
                        </select>
                    </div>
                    <div id="mobileSubFiltroAbertosContainer" style="display: none; align-items: center; gap: 8px;">
                        <span style="font-weight: 500;">📱 Mobile:</span>
                        <select id="mobileTipoAbertos" onchange="aplicarFiltroMobileAbertos(this.value)" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px;">
                            <option value="todos">Todos</option>
                            <option value="cliente">Cliente</option>
                            <option value="dg">D&G</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="cards" style="margin-bottom: 20px;">
                <div class="card"><small>Total OS Abertas</small><strong id="totalAbertos">0</strong></div>
                <div class="card"><small>Em Análise</small><strong id="emAnalise">0</strong></div>
                <div class="card"><small>Aguardam Orçamento</small><strong id="aguardamOrcamento">0</strong></div>
                <div class="card"><small>Orçamento Aceite</small><strong id="orcamentoAceite">0</strong></div>
            </div>
            
            <div id="infoFiltroAbertos" style="background: #e0f2fe; padding: 10px; border-radius: 4px; margin-bottom: 15px;">📍 Mostrando todas as tipologias</div>
            
            <div id="cardsTipologiasAbertos" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;"></div>
            
            <div class="upload-area" id="uploadAreaAbertos">
                <span style="font-size: 48px;">📤</span>
                <h3 style="margin: 15px 0;">Carregar Ficheiro Excel</h3>
                <input type="file" id="fileInputAbertos" accept=".xlsx,.xls,.csv" style="display: none;">
                <button class="btn-upload" onclick="document.getElementById('fileInputAbertos').click()">Selecionar Ficheiro</button>
                <div id="fileInfoAbertos" class="file-info"></div>
            </div>
        </div>
    `;
    document.getElementById('conteudo').innerHTML = html;
    
    setTimeout(() => {
        const input = document.getElementById('fileInputAbertos');
        if (input) input.onchange = handleUploadAbertos;
        if (abertosProcessor.dados && abertosProcessor.dados.length > 0) atualizarCardsAbertos();
    }, 100);
}

function gerarOpcoesTipologiaAbertos() {
    if (!abertosProcessor.dados || abertosProcessor.dados.length === 0) return '';
    return abertosProcessor.getTipologiasAbertos().map(t => `<option value="${t}">${t}</option>`).join('');
}

function onTipologiaAbertosChange(tipologia) {
    const mobileSub = document.getElementById('mobileSubFiltroAbertosContainer');
    if (tipologia === 'Mobile') {
        mobileSub.style.display = 'flex';
    } else {
        mobileSub.style.display = 'none';
        filtroAbertos.mobileTipo = 'todos';
        const ms = document.getElementById('mobileTipoAbertos');
        if (ms) ms.value = 'todos';
    }
    filtroAbertos.tipologia = tipologia;
    atualizarCardsAbertos();
    const infoEl = document.getElementById('infoFiltroAbertos');
    if (filtroAbertos.tipologia !== 'todas') {
        let texto = `📍 Tipologia: <strong>${filtroAbertos.tipologia}</strong>`;
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            texto += ` <span style="background:#2563eb20;padding:2px 6px;border-radius:12px;">${filtroAbertos.mobileTipo === 'cliente' ? 'Cliente' : 'D&G'}</span>`;
        }
        infoEl.innerHTML = texto;
    } else {
        infoEl.innerHTML = '📍 Mostrando todas as tipologias';
    }
}

function aplicarFiltroMobileAbertos(tipo) {
    filtroAbertos.mobileTipo = tipo;
    atualizarCardsAbertos();
    onTipologiaAbertosChange(filtroAbertos.tipologia);
}

function atualizarCardsAbertos() {
    if (!abertosProcessor.dados || abertosProcessor.dados.length === 0) return;
    
    let dados = abertosProcessor.dados;
    
    if (filtroAbertos.tipologia !== 'todas') {
        dados = dados.filter(i => i.tipologia === filtroAbertos.tipologia);
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dados = dados.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia && i.tipo_garantia !== 'Seguro D&G');
        }
    }
    
    const total = dados.length;
    const emAnalise = dados.filter(i => i.resultado_analise_tecnica === 'Análise Técnica Concluída' || !i.reparacao).length;
    const aguardam = dados.filter(i => i.resultado_orcamento === 'Aguardar Orçamento' || i.resultado_orcamento === 'Orçamento Pendente').length;
    const aceite = dados.filter(i => i.resultado_orcamento === 'Orçamento Aceite').length;
    
    document.getElementById('totalAbertos').textContent = total;
    document.getElementById('emAnalise').textContent = emAnalise;
    document.getElementById('aguardamOrcamento').textContent = aguardam;
    document.getElementById('orcamentoAceite').textContent = aceite;
    
    let tipologias = abertosProcessor.getTipologiasAbertos();
    if (filtroAbertos.tipologia !== 'todas') tipologias = [filtroAbertos.tipologia];
    
    const container = document.getElementById('cardsTipologiasAbertos');
    container.innerHTML = tipologias.map(tip => {
        let dadosTip = abertosProcessor.dados.filter(i => i.tipologia === tip);
        
        if (tip === 'Mobile' && filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dadosTip = dadosTip.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia && i.tipo_garantia !== 'Seguro D&G');
        }
        
        if (tip === 'Mobile' && filtroAbertos.tipologia === 'todas') {
            const cliente = dadosTip.filter(i => i.tipo_garantia !== 'Seguro D&G');
            const dg = dadosTip.filter(i => i.tipo_garantia === 'Seguro D&G');
            return `
                <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
                    <div style="display:flex;justify-content:space-between;"><h3>📱 ${tip}</h3><span style="background:#2563eb;color:white;padding:4px 12px;border-radius:20px;">Total: ${dadosTip.length}</span></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:15px;">
                        <div style="background:#f0f9ff;padding:12px;border-radius:8px;"><strong>Cliente</strong><div style="font-size:28px;font-weight:bold;">${cliente.length}</div></div>
                        <div style="background:#fef3c7;padding:12px;border-radius:8px;"><strong>D&G</strong><div style="font-size:28px;font-weight:bold;">${dg.length}</div></div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
                <div style="display:flex;justify-content:space-between;"><h3>${getIconeTipologia(tip)} ${tip}</h3><span style="background:#2563eb;color:white;padding:4px 12px;border-radius:20px;">Total: ${dadosTip.length}</span></div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:15px;">
                    <div><div style="color:#64748b;">Em Análise</div><div style="font-size:24px;font-weight:bold;">${dadosTip.filter(i => i.resultado_analise_tecnica === 'Análise Técnica Concluída' || !i.reparacao).length}</div></div>
                    <div><div style="color:#64748b;">Aguardam Orçamento</div><div style="font-size:24px;font-weight:bold;color:#f59e0b;">${dadosTip.filter(i => i.resultado_orcamento === 'Aguardar Orçamento' || i.resultado_orcamento === 'Orçamento Pendente').length}</div></div>
                    <div><div style="color:#64748b;">Orçamento Aceite</div><div style="font-size:24px;font-weight:bold;color:#10b981;">${dadosTip.filter(i => i.resultado_orcamento === 'Orçamento Aceite').length}</div></div>
                    <div><div style="color:#64748b;">% Aceitação</div><div style="font-size:24px;font-weight:bold;">${dadosTip.length ? Math.round(dadosTip.filter(i=>i.resultado_orcamento==='Orçamento Aceite').length/dadosTip.length*100) : 0}%</div></div>
                </div>
            </div>
        `;
    }).join('');
}

function getIconeTipologia(t) {
    const icones = {'Mobile':'📱','Informática':'💻','Entretenimento':'🎮','Som e Imagem':'🎵','Pequenos Domésticos':'🔌'};
    return icones[t] || '📦';
}

async function handleUploadAbertos(e) {
    const file = e.target.files[0];
    if (!file) return;
    const info = document.getElementById('fileInfoAbertos');
    info.innerHTML = `📂 A processar ${file.name}...`;
    try {
        await abertosProcessor.carregarDados(file);
        document.getElementById('uploadAreaAbertos').style.display = 'none';
        atualizarCardsAbertos();
        info.innerHTML = `✅ ${file.name} carregado (${abertosProcessor.dados.length} registos)`;
    } catch (error) {
        info.innerHTML = `❌ Erro: ${error.message}`;
        console.error(error);
    }
}

async function exportarAbertosPDF() {
    if (!abertosProcessor.dados || abertosProcessor.dados.length === 0) {
        alert('Carregue um ficheiro primeiro!');
        return;
    }
    
    const loading = document.createElement('div');
    loading.style.cssText = 'position:fixed;top:20px;right:20px;background:#2563eb;color:white;padding:12px 20px;border-radius:8px;z-index:1001;';
    loading.innerHTML = '📄 A gerar relatório...';
    document.body.appendChild(loading);
    
    try {
        let dados = abertosProcessor.dados;
        if (filtroAbertos.tipologia !== 'todas') {
            dados = dados.filter(i => i.tipologia === filtroAbertos.tipologia);
            if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
                dados = dados.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia && i.tipo_garantia !== 'Seguro D&G');
            }
        }
        
        const total = dados.length;
        const emAnalise = dados.filter(i => i.resultado_analise_tecnica === 'Análise Técnica Concluída' || !i.reparacao).length;
        const aguardam = dados.filter(i => i.resultado_orcamento === 'Aguardar Orçamento' || i.resultado_orcamento === 'Orçamento Pendente').length;
        const aceite = dados.filter(i => i.resultado_orcamento === 'Orçamento Aceite').length;
        
        let tipologias = abertosProcessor.getTipologiasAbertos();
        if (filtroAbertos.tipologia !== 'todas') tipologias = [filtroAbertos.tipologia];
        
        const cardsHTML = tipologias.map(tip => {
            let dt = abertosProcessor.dados.filter(i => i.tipologia === tip);
            if (tip === 'Mobile' && filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
                dt = dt.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia && i.tipo_garantia !== 'Seguro D&G');
            }
            if (tip === 'Mobile' && filtroAbertos.tipologia === 'todas') {
                const c = dt.filter(i => i.tipo_garantia !== 'Seguro D&G');
                const dg = dt.filter(i => i.tipo_garantia === 'Seguro D&G');
                return `<div style="background:white;border-radius:12px;padding:20px;margin-bottom:20px;"><h3>📱 ${tip}</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;"><div style="background:#f0f9ff;padding:15px;"><strong>Cliente</strong><div style="font-size:32px;">${c.length}</div></div><div style="background:#fef3c7;padding:15px;"><strong>D&G</strong><div style="font-size:32px;">${dg.length}</div></div></div></div>`;
            }
            return `<div style="background:white;border-radius:12px;padding:20px;margin-bottom:20px;"><h3>${getIconeTipologia(tip)} ${tip}</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;"><div><div>Em Análise</div><div style="font-size:24px;">${dt.filter(i => i.resultado_analise_tecnica === 'Análise Técnica Concluída' || !i.reparacao).length}</div></div><div><div>Aguardam Orçamento</div><div style="font-size:24px;">${dt.filter(i => i.resultado_orcamento === 'Aguardar Orçamento' || i.resultado_orcamento === 'Orçamento Pendente').length}</div></div><div><div>Orçamento Aceite</div><div style="font-size:24px;">${dt.filter(i => i.resultado_orcamento === 'Orçamento Aceite').length}</div></div><div><div>% Aceitação</div><div style="font-size:24px;">${dt.length ? Math.round(dt.filter(i=>i.resultado_orcamento==='Orçamento Aceite').length/dt.length*100) : 0}%</div></div></div></div>`;
        }).join('');
        
        const filtroTexto = filtroAbertos.tipologia !== 'todas' ? 
            `Tipologia: ${filtroAbertos.tipologia}${filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos' ? ` (${filtroAbertos.mobileTipo === 'cliente' ? 'Cliente' : 'D&G'})` : ''}` : 
            'Nenhum filtro';
        
        const html = `<!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Relatório OS Abertas</title>
        <style>
            body{font-family:Arial;padding:40px;}
            .info-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0;}
            .info-card{background:#f8fafc;padding:15px;border-radius:8px;text-align:center;}
        </style>
        </head>
        <body>
            <div style="text-align:center;"><h1>📋 Relatório de OS Abertas</h1><p>Gerado em ${new Date().toLocaleDateString('pt-PT')}</p></div>
            <div class="info-grid">
                <div class="info-card"><small>Total OS Abertas</small><strong>${total}</strong></div>
                <div class="info-card"><small>Em Análise</small><strong>${emAnalise}</strong></div>
                <div class="info-card"><small>Aguardam Orçamento</small><strong>${aguardam}</strong></div>
                <div class="info-card"><small>Orçamento Aceite</small><strong>${aceite}</strong></div>
            </div>
            <div><strong>Filtros:</strong> ${filtroTexto}</div>
            <h3>📊 Detalhamento por Tipologia</h3>
            ${cardsHTML}
            <div style="margin-top:30px;text-align:center;font-size:12px;">Relatório gerado automaticamente</div>
        </body>
        </html>`;
        
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        iframe.contentWindow.onload = () => {
            iframe.contentWindow.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        };
        loading.remove();
    } catch(e) {
        loading.remove();
        alert('Erro ao gerar PDF');
        console.error(e);
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard iniciado');
    const btnAbertos = document.getElementById('btnAbertos');
    const btnProd = document.getElementById('btnProdutividade');
    if (btnAbertos) btnAbertos.addEventListener('click', () => { btnAbertos.classList.add('ativo'); btnProd.classList.remove('ativo'); mostrarAbertos(); });
    if (btnProd) btnProd.addEventListener('click', () => { btnProd.classList.add('ativo'); btnAbertos.classList.remove('ativo'); mostrarProdutividade(); });
    mostrarAbertos();
});
