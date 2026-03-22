// ============================================
// DASHBOARD CENTRO TÉCNICO - VERSÃO COMPLETA
// ============================================

const processor = new ProdutividadeProcessor();
const abertosProcessor = new AbertosProcessor();

// Estado dos filtros - PRODUTIVIDADE
let filtroAtual = {
    periodo: 'hoje',
    dataInicio: null,
    dataFim: null,
    tipologia: 'todas',
    mobileTipo: 'todos',
    polo: 'todos'
};

// Estado dos filtros - ABERTOS
let filtroAbertos = {
    tipologia: 'todas',
    mobileTipo: 'todos'
};

// Cache para os dados dos cards
let dadosGarantiaCache = {};

let dataPickerVisible = false;
let dadosPeriodoAtual = [];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function toggleDataPicker() {
    const container = document.getElementById('dataPickerContainer');
    if (container) {
        dataPickerVisible = !dataPickerVisible;
        container.style.display = dataPickerVisible ? 'block' : 'none';
    }
}

function getIconeTipologia(tipologia) {
    const icones = {
        'Mobile Cliente': '👥',
        'Mobile D&G': '🛡️',
        'Informática': '💻',
        'Entretenimento': '🎮',
        'Som e Imagem': '🎵',
        'Pequenos Domésticos': '🔌'
    };
    return icones[tipologia] || '📦';
}

// Função para normalizar tipo de garantia (agrupar EG+1 e EG+3)
function normalizarGarantia(tipoGarantia) {
    if (!tipoGarantia) return 'Não definido';
    
    if (tipoGarantia === 'EG+1' || tipoGarantia === 'EG+3') {
        return 'Extensão de Garantia';
    }
    return tipoGarantia;
}

// Função para calcular TAT (dias em aberto) - exclui equipamentos com checkpoint "Debit"
function calcularTAT(item) {
    // Exclui equipamentos com checkpoint_atual = "Debit"
    if (item.checkpoint_atual && item.checkpoint_atual.toString().toLowerCase() === 'debit') {
        return null;
    }
    
    if (item['TAT TSC'] !== undefined && item['TAT TSC'] !== null && item['TAT TSC'] !== '') {
        const tatValue = parseFloat(item['TAT TSC']);
        if (!isNaN(tatValue)) {
            return tatValue;
        }
    }
    
    if (item.checkin) {
        const dataCheckin = new Date(item.checkin);
        const hoje = new Date();
        if (!isNaN(dataCheckin.getTime())) {
            const diffTime = Math.abs(hoje - dataCheckin);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }
    }
    return null;
}

// Ordem dos checkpoints
const ordemCheckpoints = [
    'Pré-Análise',
    'Análise Técnica',
    'Intervenção Técnica',
    'Nível 3',
    'Orçamento',
    'Aguarda Aceitação Orçamento',
    'Validação FlatFee',
    'Controlo de Qualidade',
    'Check-Out',
    'Debit'
];

// Função para abrir modal de detalhe por garantia
function abrirDetalheGarantia(tipologia, garantia, garantiaKey) {
    const dadosGarantia = dadosGarantiaCache[garantiaKey];
    if (!dadosGarantia || dadosGarantia.length === 0) {
        alert('Nenhum dado disponível');
        return;
    }
    
    // Agrupa equipamentos por checkpoint
    const checkpointMap = new Map();
    
    // Inicializa todos os checkpoints
    ordemCheckpoints.forEach(cp => {
        checkpointMap.set(cp, { quantidade: 0, somaTAT: 0, countTAT: 0, pendentes: { sim: 0, nao: 0, somaTATSim: 0, countTATSim: 0, somaTATNao: 0, countTATNao: 0 } });
    });
    
    dadosGarantia.forEach(item => {
        let checkpoint = item.checkpoint_atual || 'Não definido';
        const tat = calcularTAT(item);
        const pendentePeca = item.pendente_peca ? item.pendente_peca.toString().toLowerCase() : '';
        
        // Normaliza o nome do checkpoint
        if (checkpoint === 'Analise Tecnica' || checkpoint === 'Análise Técnica') checkpoint = 'Análise Técnica';
        if (checkpoint === 'Intervencao Tecnica' || checkpoint === 'Intervenção Técnica') checkpoint = 'Intervenção Técnica';
        if (checkpoint === 'Aguarda Aceitacao Orcamento' || checkpoint === 'Aguarda Aceitação Orçamento') checkpoint = 'Aguarda Aceitação Orçamento';
        
        if (checkpointMap.has(checkpoint)) {
            const cpData = checkpointMap.get(checkpoint);
            cpData.quantidade++;
            if (tat !== null) {
                cpData.somaTAT += tat;
                cpData.countTAT++;
            }
            
            // Para Intervenção Técnica, registra pendência de peça
            if (checkpoint === 'Intervenção Técnica') {
                if (pendentePeca === 'sim' || pendentePeca === 's' || pendentePeca === 'true' || pendentePeca === '1') {
                    cpData.pendentes.sim++;
                    if (tat !== null) {
                        cpData.pendentes.somaTATSim += tat;
                        cpData.pendentes.countTATSim++;
                    }
                } else {
                    cpData.pendentes.nao++;
                    if (tat !== null) {
                        cpData.pendentes.somaTATNao += tat;
                        cpData.pendentes.countTATNao++;
                    }
                }
            }
        }
    });
    
    // Gerar HTML dos checkpoints na ordem definida
    const checkpointsHTML = ordemCheckpoints.map(cp => {
        const cpData = checkpointMap.get(cp);
        if (!cpData || cpData.quantidade === 0) return '';
        
        const mediaTAT = cpData.countTAT > 0 ? (cpData.somaTAT / cpData.countTAT).toFixed(1) : 'N/A';
        
        let pendentesHTML = '';
        if (cp === 'Intervenção Técnica') {
            const mediaTATSim = cpData.pendentes.countTATSim > 0 ? (cpData.pendentes.somaTATSim / cpData.pendentes.countTATSim).toFixed(1) : 'N/A';
            const mediaTATNao = cpData.pendentes.countTATNao > 0 ? (cpData.pendentes.somaTATNao / cpData.pendentes.countTATNao).toFixed(1) : 'N/A';
            pendentesHTML = `
                <div style="margin-left: 20px; margin-top: 5px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                        <span>├─ Pendente de Peça</span>
                        <div style="text-align: right;">
                            <span style="font-weight: bold;">${cpData.pendentes.sim} equip.</span>
                            <span style="font-size: 12px; color: #64748b; margin-left: 10px;">⏱️ TAT: ${mediaTATSim} dias</span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                        <span>└─ Não Pendente de Peça</span>
                        <div style="text-align: right;">
                            <span style="font-weight: bold;">${cpData.pendentes.nao} equip.</span>
                            <span style="font-size: 12px; color: #64748b; margin-left: 10px;">⏱️ TAT: ${mediaTATNao} dias</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div style="border-bottom: 1px solid #e2e8f0; padding: 10px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 500;">📌 ${cp}</span>
                    <div style="text-align: right;">
                        <span style="font-weight: bold;">${cpData.quantidade} equip.</span>
                        <span style="font-size: 12px; color: #64748b; margin-left: 15px;">⏱️ TAT Médio: ${mediaTAT} dias</span>
                    </div>
                </div>
                ${pendentesHTML}
            </div>
        `;
    }).join('');
    
    // Total de equipamentos
    const totalEquipamentos = dadosGarantia.length;
    let somaTATTotal = 0, countTATTotal = 0;
    dadosGarantia.forEach(item => {
        const tat = calcularTAT(item);
        if (tat !== null) {
            somaTATTotal += tat;
            countTATTotal++;
        }
    });
    const mediaTATTotal = countTATTotal > 0 ? (somaTATTotal / countTATTotal).toFixed(1) : 'N/A';
    
    // Criar modal
    const modal = document.createElement('div');
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
        <div style="background: white; border-radius: 12px; width: 90%; max-width: 550px; max-height: 80vh; overflow: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: slideUp 0.3s ease;">
            <div style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                <div>
                    <h2 style="margin: 0; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                        <span>${getIconeTipologia(tipologia)}</span>
                        ${tipologia}
                    </h2>
                    <p style="margin: 5px 0 0 0; color: #475569;">
                        Tipo de Garantia: <strong>${garantia}</strong>
                    </p>
                </div>
                <button onclick="fecharModalDetalhe()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #94a3b8; padding: 0 8px;">&times;</button>
            </div>
            
            <div style="padding: 20px 24px;">
                <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span><strong>Total de equipamentos:</strong></span>
                        <span style="font-size: 24px; font-weight: bold; color: #2563eb;">${totalEquipamentos}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                        <span><strong>TAT Médio Total:</strong></span>
                        <span>${mediaTATTotal} dias</span>
                    </div>
                </div>
                
                <h3 style="margin: 0 0 15px 0; color: #475569; font-size: 16px;">📊 Distribuição por Checkpoint</h3>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${checkpointsHTML || '<div style="text-align: center; color: #94a3b8; padding: 30px;">Nenhum checkpoint encontrado</div>'}
                </div>
            </div>
            
            <div style="padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; background: #f8fafc;">
                <button onclick="fecharModalDetalhe()" style="background: #f1f5f9; border: none; padding: 8px 24px; border-radius: 6px; cursor: pointer; color: #475569; font-weight: 500;">Fechar</button>
            </div>
        </div>
    `;
    
    // Adicionar estilos de animação
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
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModalDetalhe();
        }
    });
}

function fecharModalDetalhe() {
    const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 1000"]');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// ABA PRODUTIVIDADES
// ============================================

function mostrarProdutividade() {
    const html = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">📊 Produtividade dos Técnicos</h2>
                <button onclick="exportarRelatorioPDF()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold;">📄 Exportar PDF</button>
            </div>
            
            <div style="background: #f8fafc; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('hoje', this)">Hoje</button>
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('ontem', this)">Ontem</button>
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('semana', this)">7 dias</button>
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('mes', this)">30 dias</button>
                        <button class="filtro-btn" onclick="aplicarFiltroPeriodo('trimestre', this)">90 dias</button>
                        <button onclick="toggleDataPicker()" style="background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 12px;">📅 Personalizado</button>
                    </div>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                        <div><span>🏷️ Tipologia:</span>
                            <select id="filtroTipologia" onchange="onTipologiaChange(this.value)">
                                <option value="todas">Todas</option>
                                ${processor.dados && processor.dados.length ? processor.getTipologias().map(t => `<option value="${t}">${t}</option>`).join('') : ''}
                            </select>
                        </div>
                        <div id="mobileSubFiltroContainer" style="display: none;"><span>📱 Mobile:</span>
                            <select id="mobileTipo" onchange="aplicarFiltroMobileTipo(this.value)">
                                <option value="todos">Todos</option><option value="cliente">Cliente</option><option value="dg">D&G</option>
                            </select>
                        </div>
                        <div><span>📍 Localização:</span>
                            <select id="filtroPolo" onchange="aplicarFiltroPolo(this.value)">
                                <option value="todos">Todos</option><option value="TSC SOUTH">TSC SOUTH</option><option value="TSC NORTH">TSC NORTH</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div id="dataPickerContainer" style="display: none; margin-top: 15px;">
                    <input type="date" id="dataInicio"> até <input type="date" id="dataFim">
                    <button onclick="aplicarFiltroPersonalizado()">Aplicar</button>
                </div>
            </div>
            
            <div class="cards">
                <div class="card"><small>Total Reparados</small><strong id="totalRep">0</strong></div>
                <div class="card"><small>Média Diária</small><strong id="mediaDia">0</strong></div>
                <div class="card"><small>Técnicos Ativos</small><strong id="tecAtivos">0</strong></div>
                <div class="card"><small>Média/Técnico</small><strong id="mediaTec">0</strong></div>
            </div>
            
            <div id="infoFiltro" style="background: #e0f2fe; padding: 10px; border-radius: 4px; margin-bottom: 15px;">📍 Período: <strong>Hoje</strong></div>
            
            <div style="max-height: 400px; overflow: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #f1f5f9; position: sticky; top: 0;">
                        <tr><th style="padding: 10px; text-align: left;">Técnico</th><th style="padding: 10px;">Quantidade</th><th style="padding: 10px;">Média/Dia</th><th style="padding: 10px;">%</th></tr>
                    </thead>
                    <tbody id="tabela">${processor.dados && processor.dados.length ? '' : '}<td colspan="4" style="text-align:center; padding:30px;">Carregue um ficheiro para começar</td>'}</tbody>
                </table>
            </div>
            
            <div class="upload-area" id="uploadArea">
                <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" style="display:none;">
                <button class="btn-upload" onclick="document.getElementById('fileInput').click()">📂 Selecionar Ficheiro Excel</button>
                <div id="fileInfo" class="file-info"></div>
            </div>
        </div>
    `;
    
    document.getElementById('conteudo').innerHTML = html;
    
    setTimeout(() => {
        const input = document.getElementById('fileInput');
        if (input) input.onchange = handleUpload;
        
        const hoje = new Date();
        const semana = new Date(hoje);
        semana.setDate(semana.getDate() - 7);
        const dataInicio = document.getElementById('dataInicio');
        const dataFim = document.getElementById('dataFim');
        if (dataInicio) dataInicio.value = semana.toISOString().split('T')[0];
        if (dataFim) dataFim.value = hoje.toISOString().split('T')[0];
        
        if (processor.dados && processor.dados.length) {
            atualizarFiltroTipologia();
            const btn = document.querySelector('.filtro-btn');
            if (btn) aplicarFiltroPeriodo('hoje', btn);
        }
    }, 100);
}

function onTipologiaChange(tipologia) {
    const mobileDiv = document.getElementById('mobileSubFiltroContainer');
    if (tipologia === 'Mobile') {
        mobileDiv.style.display = 'block';
    } else {
        mobileDiv.style.display = 'none';
        filtroAtual.mobileTipo = 'todos';
        const sel = document.getElementById('mobileTipo');
        if (sel) sel.value = 'todos';
    }
    filtroAtual.tipologia = tipologia;
    aplicarFiltros();
    atualizarInfoFiltro();
}

function aplicarFiltroMobileTipo(tipo) { filtroAtual.mobileTipo = tipo; aplicarFiltros(); atualizarInfoFiltro(); }
function aplicarFiltroPolo(polo) { filtroAtual.polo = polo; aplicarFiltros(); atualizarInfoFiltro(); }

function aplicarFiltroPeriodo(periodo, btn) {
    if (dataPickerVisible) toggleDataPicker();
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroAtual.periodo = periodo;
    filtroAtual.dataInicio = null;
    filtroAtual.dataFim = null;
    aplicarFiltros();
    atualizarInfoFiltro();
}

function aplicarFiltroPersonalizado() {
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;
    if (!inicio || !fim) { alert('Selecione as datas'); return; }
    toggleDataPicker();
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    filtroAtual.periodo = 'personalizado';
    filtroAtual.dataInicio = new Date(inicio);
    filtroAtual.dataFim = new Date(fim);
    filtroAtual.dataFim.setHours(23,59,59,999);
    aplicarFiltros();
    atualizarInfoFiltro();
}

function atualizarInfoFiltro() {
    const el = document.getElementById('infoFiltro');
    let txt = '';
    if (filtroAtual.periodo === 'personalizado') {
        txt = `📍 Período: <strong>${filtroAtual.dataInicio.toLocaleDateString('pt-PT')}</strong> até <strong>${filtroAtual.dataFim.toLocaleDateString('pt-PT')}</strong>`;
    } else {
        const nomes = {hoje:'Hoje',ontem:'Ontem',semana:'Últimos 7 dias',mes:'Últimos 30 dias',trimestre:'Últimos 90 dias'};
        txt = `📍 Período: <strong>${nomes[filtroAtual.periodo]}</strong>`;
    }
    if (filtroAtual.tipologia !== 'todas') {
        txt += ` | Tipologia: <strong>${filtroAtual.tipologia}</strong>`;
        if (filtroAtual.tipologia === 'Mobile' && filtroAtual.mobileTipo !== 'todos') {
            txt += ` <span style="background:#2563eb20;padding:2px 6px;border-radius:12px;">${filtroAtual.mobileTipo === 'cliente' ? 'Cliente' : 'D&G'}</span>`;
        }
    }
    if (filtroAtual.polo !== 'todos') txt += ` | Localização: <strong>${filtroAtual.polo}</strong>`;
    el.innerHTML = txt;
}

function aplicarFiltros() {
    if (!processor.dados || !processor.dados.length) return;
    let dados = processor.dados;
    if (filtroAtual.periodo === 'personalizado') {
        dados = dados.filter(i => { const d = processor.getDataReparacao(i); return d && d >= filtroAtual.dataInicio && d <= filtroAtual.dataFim; });
    } else {
        dados = processor.filtrarPorPeriodo(filtroAtual.periodo);
    }
    if (filtroAtual.tipologia !== 'todas') {
        dados = dados.filter(i => i.tipologia === filtroAtual.tipologia);
        if (filtroAtual.tipologia === 'Mobile' && filtroAtual.mobileTipo !== 'todos') {
            dados = dados.filter(i => filtroAtual.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia !== 'Seguro D&G');
        }
    }
    if (filtroAtual.polo !== 'todos') dados = dados.filter(i => i.polo === filtroAtual.polo);
    dadosPeriodoAtual = dados;
    const stats = processor.calcularEstatisticas(dados, filtroAtual.periodo);
    document.getElementById('totalRep').textContent = stats.totalReparados;
    document.getElementById('mediaDia').textContent = stats.mediaDiaria.toFixed(1);
    document.getElementById('tecAtivos').textContent = stats.tecnicosAtivos;
    document.getElementById('mediaTec').textContent = stats.mediaPorTecnico.toFixed(1);
    const tabela = document.getElementById('tabela');
    if (!stats.totalReparados) { tabela.innerHTML = '}<td colspan="4" style="text-align:center;">Nenhum reparado neste período</td>'; return; }
    const maxQ = Math.max(...Object.values(stats.reparados));
    const dias = stats.numeroDias;
    tabela.innerHTML = Object.entries(stats.reparados).filter(([_,q])=>q>0).sort((a,b)=>b[1]-a[1]).map(([t,q])=>`<tr><td style="padding:8px;"><a href="javascript:void(0)" onclick="abrirDetalheTecnico('${t.replace(/'/g,"\\'")}')" style="color:#2563eb;text-decoration:none;">${t}</a></td><td style="padding:8px;text-align:center;">${q}</td><td style="padding:8px;text-align:center;">${(q/dias).toFixed(1)}</td><td style="padding:8px;"><div style="background:#e2e8f0;border-radius:10px;width:100px;height:8px;"><div style="background:#2563eb;width:${(q/maxQ*100)}%;height:8px;border-radius:10px;"></div></div></td></tr>`).join('');
}

function atualizarFiltroTipologia() {
    const sel = document.getElementById('filtroTipologia');
    if (sel && processor.dados) {
        sel.innerHTML = `<option value="todas">Todas</option>${processor.getTipologias().map(t=>`<option value="${t}">${t}</option>`).join('')}`;
    }
}

async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const info = document.getElementById('fileInfo');
    info.innerHTML = '📂 A processar...';
    try {
        await processor.carregarDados(file);
        document.getElementById('uploadArea').style.display = 'none';
        atualizarFiltroTipologia();
        const btn = document.querySelector('.filtro-btn');
        if (btn) aplicarFiltroPeriodo('hoje', btn);
        info.innerHTML = `✅ ${file.name} carregado (${processor.dados.length} registos)`;
    } catch(e) { info.innerHTML = `❌ Erro: ${e.message}`; }
}

function abrirDetalheTecnico(tecnico) {
    if (!dadosPeriodoAtual.length) return;
    const dados = dadosPeriodoAtual.filter(i => (i.tecnico_reparacao || i.Tecnico) === tecnico);
    const dias = {};
    dados.forEach(i => { const d = processor.getDataReparacao(i); if(d) dias[d.toLocaleDateString('pt-PT')] = (dias[d.toLocaleDateString('pt-PT')] || 0) + 1; });
    const ordenado = Object.keys(dias).sort((a,b)=>{const [da,ma,aa]=a.split('/'),[db,mb,ab]=b.split('/'); if(aa!==ab)return aa-ab; if(ma!==mb)return ma-mb; return da-db;});
    const maxV = Math.max(...Object.values(dias),1);
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;';
    modal.innerHTML = `<div style="background:white;border-radius:12px;width:90%;max-width:500px;max-height:80vh;overflow:auto;"><div style="padding:20px;border-bottom:1px solid #e2e8f0;"><h2>👤 ${tecnico}</h2><p>Total: <strong>${dados.length}</strong></p></div><div style="padding:20px;"><div style="display:flex;gap:8px;align-items:flex-end;min-height:150px;">${ordenado.map(d=>`<div style="flex:1;text-align:center;"><div style="background:#2563eb;height:${(dias[d]/maxV)*120}px;border-radius:4px 4px 0 0;"></div><span style="font-size:10px;">${d}</span><div>${dias[d]}</div></div>`).join('')}</div></div><div style="padding:20px;border-top:1px solid #e2e8f0;text-align:right;"><button onclick="this.closest('div').remove()" style="background:#f1f5f9;border:none;padding:8px 20px;border-radius:6px;">Fechar</button></div></div>`;
    document.body.appendChild(modal);
}

async function exportarRelatorioPDF() {
    if (!processor.dados || !processor.dados.length) { alert('Carregue um ficheiro'); return; }
    const loading = document.createElement('div'); loading.style.cssText = 'position:fixed;top:20px;right:20px;background:#2563eb;color:white;padding:12px;border-radius:8px;z-index:1001;'; loading.innerHTML = '📄 Gerando...'; document.body.appendChild(loading);
    const stats = processor.calcularEstatisticas(dadosPeriodoAtual, filtroAtual.periodo);
    const tecnicos = Object.entries(stats.reparados).filter(([_,q])=>q>0).sort((a,b)=>b[1]-a[1]);
    const periodo = filtroAtual.periodo === 'personalizado' ? `${filtroAtual.dataInicio.toLocaleDateString('pt-PT')} a ${filtroAtual.dataFim.toLocaleDateString('pt-PT')}` : ({hoje:'Hoje',ontem:'Ontem',semana:'Últimos 7 dias',mes:'Últimos 30 dias',trimestre:'Últimos 90 dias'}[filtroAtual.periodo]);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Produtividade</title><style>body{font-family:Arial;padding:40px;}</style></head><body><h1 style="text-align:center;">📊 Relatório de Produtividade</h1><p style="text-align:center;">Gerado em ${new Date().toLocaleDateString('pt-PT')}</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0;"><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Total Reparados</small><div style="font-size:28px;">${stats.totalReparados}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Média Diária</small><div style="font-size:28px;">${stats.mediaDiaria.toFixed(1)}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Técnicos Ativos</small><div style="font-size:28px;">${stats.tecnicosAtivos}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Média/Técnico</small><div style="font-size:28px;">${stats.mediaPorTecnico.toFixed(1)}</div></div></div><p><strong>Período:</strong> ${periodo}</p><table border="1" cellpadding="8" style="width:100%;border-collapse:collapse;"><tr><th>Técnico</th><th>Quantidade</th><th>Média/Dia</th><th>%</th></tr>${tecnicos.map(([t,q])=>`<tr><td>${t}</td><td>${q}</td><td>${(q/stats.numeroDias).toFixed(1)}</td><td>${((q/stats.totalReparados)*100).toFixed(1)}%</td></tr>`).join('')}</table></body></html>`;
    const iframe = document.createElement('iframe'); iframe.style.cssText = 'position:absolute;width:0;height:0;'; document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document; doc.open(); doc.write(html); doc.close();
    iframe.contentWindow.onload = () => { iframe.contentWindow.print(); setTimeout(()=>document.body.removeChild(iframe),1000); };
    loading.remove();
}

// ============================================
// ABA ABERTOS (COM DETALHE POR CHECKPOINT - CORRIGIDO)
// ============================================

function mostrarAbertos() {
    const html = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">📋 OS Abertas - Área Técnica</h2>
                <button onclick="exportarAbertosPDF()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold;">📄 Exportar PDF</button>
            </div>
            
            <div style="background: #f8fafc; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div><span>🏷️ Tipologia:</span>
                        <select id="filtroTipologiaAbertos" onchange="onTipologiaAbertosChange(this.value)">
                            <option value="todas">Todas</option>
                            ${abertosProcessor.dados && abertosProcessor.dados.length ? abertosProcessor.getTipologiasAbertos().map(t => `<option value="${t}">${t}</option>`).join('') : ''}
                        </select>
                    </div>
                    <div id="mobileSubAbertos" style="display: none;"><span>📱 Mobile:</span>
                        <select id="mobileTipoAbertos" onchange="aplicarFiltroMobileAbertos(this.value)">
                            <option value="todos">Todos</option><option value="cliente">Cliente</option><option value="dg">D&G</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="cards">
                <div class="card"><small>Total OS Abertas</small><strong id="totalAbertos">0</strong></div>
                <div class="card"><small>Em Análise</small><strong id="emAnalise">0</strong></div>
                <div class="card"><small>Aguardam Orçamento</small><strong id="aguardamOrcamento">0</strong></div>
                <div class="card"><small>Orçamento Aceite</small><strong id="orcamentoAceite">0</strong></div>
                <div class="card"><small>TAT Médio Total</small><strong id="tatTotal">0</strong></div>
            </div>
            
            <div id="infoAbertos" style="background: #e0f2fe; padding: 10px; border-radius: 4px; margin-bottom: 15px;">📍 Mostrando todas as tipologias</div>
            
            <div id="cardsTipologias" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;"></div>
            
            <div class="upload-area" id="uploadAreaAbertos">
                <input type="file" id="fileInputAbertos" accept=".xlsx,.xls,.csv" style="display:none;">
                <button class="btn-upload" onclick="document.getElementById('fileInputAbertos').click()">📂 Selecionar Ficheiro Excel</button>
                <div id="fileInfoAbertos" class="file-info"></div>
            </div>
        </div>
    `;
    document.getElementById('conteudo').innerHTML = html;
    
    setTimeout(() => {
        const input = document.getElementById('fileInputAbertos');
        if (input) input.onchange = handleUploadAbertos;
        if (abertosProcessor.dados && abertosProcessor.dados.length) atualizarCardsAbertos();
    }, 100);
}

function onTipologiaAbertosChange(tipologia) {
    const mobileDiv = document.getElementById('mobileSubAbertos');
    if (tipologia === 'Mobile') {
        mobileDiv.style.display = 'block';
    } else {
        mobileDiv.style.display = 'none';
        filtroAbertos.mobileTipo = 'todos';
        const sel = document.getElementById('mobileTipoAbertos');
        if (sel) sel.value = 'todos';
    }
    filtroAbertos.tipologia = tipologia;
    atualizarCardsAbertos();
    const info = document.getElementById('infoAbertos');
    if (filtroAbertos.tipologia !== 'todas') {
        let txt = `📍 Tipologia: <strong>${filtroAbertos.tipologia}</strong>`;
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            txt += ` <span style="background:#2563eb20;padding:2px 6px;border-radius:12px;">${filtroAbertos.mobileTipo === 'cliente' ? 'Cliente' : 'D&G'}</span>`;
        }
        info.innerHTML = txt;
    } else {
        info.innerHTML = '📍 Mostrando todas as tipologias';
    }
}

function aplicarFiltroMobileAbertos(tipo) {
    filtroAbertos.mobileTipo = tipo;
    atualizarCardsAbertos();
    onTipologiaAbertosChange(filtroAbertos.tipologia);
}

function atualizarCardsAbertos() {
    if (!abertosProcessor.dados || !abertosProcessor.dados.length) return;
    
    let dados = abertosProcessor.dados;
    if (filtroAbertos.tipologia !== 'todas') {
        dados = dados.filter(i => i.tipologia === filtroAbertos.tipologia);
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dados = dados.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia !== 'Seguro D&G');
        }
    }
    
    function calcularTATItem(item) {
        if (item.checkpoint_atual && item.checkpoint_atual.toString().toLowerCase() === 'debit') return null;
        if (item['TAT TSC'] !== undefined && item['TAT TSC'] !== null && item['TAT TSC'] !== '') {
            const tatValue = parseFloat(item['TAT TSC']);
            if (!isNaN(tatValue)) return tatValue;
        }
        if (item.checkin) {
            const dataCheckin = new Date(item.checkin);
            const hoje = new Date();
            if (!isNaN(dataCheckin.getTime())) {
                return Math.ceil((hoje - dataCheckin) / (1000 * 60 * 60 * 24));
            }
        }
        return null;
    }
    
    // Calcula estatísticas por tipo de garantia
    const garantiasMap = new Map();
    let totalEquipamentos = 0;
    let somaTATTotal = 0;
    let countTATTotal = 0;
    
    dados.forEach(item => {
        totalEquipamentos++;
        const tat = calcularTATItem(item);
        const tipoGarantiaOriginal = item.tipo_garantia || 'Não definido';
        const tipoGarantia = normalizarGarantia(tipoGarantiaOriginal);
        
        if (!garantiasMap.has(tipoGarantia)) {
            garantiasMap.set(tipoGarantia, { quantidade: 0, somaTAT: 0, countTAT: 0, itens: [] });
        }
        
        const garantia = garantiasMap.get(tipoGarantia);
        garantia.quantidade++;
        garantia.itens.push(item);
        
        if (tat !== null) {
            garantia.somaTAT += tat;
            garantia.countTAT++;
            somaTATTotal += tat;
            countTATTotal++;
        }
    });
    
    // Guarda os dados no cache
    dadosGarantiaCache = {};
    garantiasMap.forEach((value, key) => {
        dadosGarantiaCache[key] = value.itens;
    });
    
    const mediaTATTotal = countTATTotal > 0 ? (somaTATTotal / countTATTotal).toFixed(1) : 'N/A';
    
    document.getElementById('totalAbertos').textContent = totalEquipamentos;
    document.getElementById('emAnalise').textContent = dados.filter(i => i.resultado_analise_tecnica === 'Análise Técnica Concluída' || !i.reparacao).length;
    document.getElementById('aguardamOrcamento').textContent = dados.filter(i => i.resultado_orcamento === 'Aguardar Orçamento' || i.resultado_orcamento === 'Orçamento Pendente').length;
    document.getElementById('orcamentoAceite').textContent = dados.filter(i => i.resultado_orcamento === 'Orçamento Aceite').length;
    document.getElementById('tatTotal').textContent = mediaTATTotal + ' dias';
    
    // Definir tipologias a mostrar
    let tipologiasParaMostrar = [];
    
    if (filtroAbertos.tipologia !== 'todas') {
        if (filtroAbertos.tipologia === 'Mobile') {
            if (filtroAbertos.mobileTipo === 'cliente') {
                tipologiasParaMostrar = ['Mobile Cliente'];
            } else if (filtroAbertos.mobileTipo === 'dg') {
                tipologiasParaMostrar = ['Mobile D&G'];
            } else {
                tipologiasParaMostrar = ['Mobile Cliente', 'Mobile D&G'];
            }
        } else {
            tipologiasParaMostrar = [filtroAbertos.tipologia];
        }
    } else {
        const outrasTipologias = abertosProcessor.getTipologiasAbertos().filter(t => t !== 'Mobile');
        tipologiasParaMostrar = [...outrasTipologias, 'Mobile Cliente', 'Mobile D&G'];
    }
    
    const container = document.getElementById('cardsTipologias');
    container.innerHTML = tipologiasParaMostrar.map(tip => {
        let dadosTip = [];
        
        if (tip === 'Mobile Cliente') {
            dadosTip = abertosProcessor.dados.filter(i => i.tipologia === 'Mobile' && i.tipo_garantia !== 'Seguro D&G');
        } else if (tip === 'Mobile D&G') {
            dadosTip = abertosProcessor.dados.filter(i => i.tipologia === 'Mobile' && i.tipo_garantia === 'Seguro D&G');
        } else {
            dadosTip = abertosProcessor.dados.filter(i => i.tipologia === tip);
        }
        
        totalTip = dadosTip.length;
        
        // Calcular TAT para esta tipologia
        let somaTATTip = 0, countTATTip = 0;
        dadosTip.forEach(item => {
            const tat = calcularTATItem(item);
            if (tat !== null) {
                somaTATTip += tat;
                countTATTip++;
            }
        });
        mediaTATTip = countTATTip > 0 ? (somaTATTip / countTATTip).toFixed(1) : 'N/A';
        
        // Calcular garantias para esta tipologia
        const garantiasTipMap = new Map();
        dadosTip.forEach(item => {
            const tat = calcularTATItem(item);
            const tipoGarantiaOriginal = item.tipo_garantia || 'Não definido';
            const tipoGarantia = normalizarGarantia(tipoGarantiaOriginal);
            
            if (!garantiasTipMap.has(tipoGarantia)) {
                garantiasTipMap.set(tipoGarantia, { quantidade: 0, somaTAT: 0, countTAT: 0 });
            }
            const garantia = garantiasTipMap.get(tipoGarantia);
            garantia.quantidade++;
            
            if (tat !== null) {
                garantia.somaTAT += tat;
                garantia.countTAT++;
            }
        });
        
        const garantiasHTML = Array.from(garantiasTipMap.entries()).map(([garantia, dadosGar]) => {
            const mediaTAT = dadosGar.countTAT > 0 ? (dadosGar.somaTAT / dadosGar.countTAT).toFixed(1) : 'N/A';
            const garantiaKey = garantia;
            return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e2e8f0;cursor:pointer;" onclick="abrirDetalheGarantia('${tip}', '${garantia}', '${garantiaKey}')">
                    <span><strong>${garantia}</strong></span>
                    <div style="text-align:right;">
                        <div>${dadosGar.quantidade} equip.</div>
                        <div style="font-size:12px;color:#64748b;">⏱️ TAT: ${mediaTAT} dias</div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (garantiasHTML === '') {
            garantiasHTML = '<div style="padding:8px 0;color:#64748b;">Nenhum equipamento</div>';
        }
        
        return `
            <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h3 style="margin:0;">${getIconeTipologia(tip)} ${tip}</h3>
                    <span style="background:#2563eb;color:white;padding:4px 12px;border-radius:20px;">Total: ${totalTip}</span>
                </div>
                <div style="background:#f1f5f9;padding:8px 12px;border-radius:6px;margin-bottom:15px;">
                    <span>📊 TAT Médio Geral: <strong>${mediaTATTip} dias</strong></span>
                </div>
                <div>
                    <div style="font-weight:bold;margin-bottom:8px;color:#475569;">📋 Por tipo de garantia:</div>
                    ${garantiasHTML}
                </div>
            </div>
        `;
    }).join('');
}

async function handleUploadAbertos(e) {
    const file = e.target.files[0];
    if (!file) return;
    const info = document.getElementById('fileInfoAbertos');
    info.innerHTML = '📂 A processar...';
    try {
        await abertosProcessor.carregarDados(file);
        document.getElementById('uploadAreaAbertos').style.display = 'none';
        const sel = document.getElementById('filtroTipologiaAbertos');
        if (sel) sel.innerHTML = `<option value="todas">Todas</option>${abertosProcessor.getTipologiasAbertos().map(t=>`<option value="${t}">${t}</option>`).join('')}`;
        atualizarCardsAbertos();
        info.innerHTML = `✅ ${file.name} carregado (${abertosProcessor.dados.length} registos)`;
    } catch(e) { info.innerHTML = `❌ Erro: ${e.message}`; }
}

async function exportarAbertosPDF() {
    if (!abertosProcessor.dados || !abertosProcessor.dados.length) { alert('Carregue um ficheiro'); return; }
    const loading = document.createElement('div'); loading.style.cssText = 'position:fixed;top:20px;right:20px;background:#2563eb;color:white;padding:12px;border-radius:8px;z-index:1001;'; loading.innerHTML = '📄 Gerando...'; document.body.appendChild(loading);
    
    let dados = abertosProcessor.dados;
    if (filtroAbertos.tipologia !== 'todas') {
        dados = dados.filter(i => i.tipologia === filtroAbertos.tipologia);
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dados = dados.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia !== 'Seguro D&G');
        }
    }
    
    function calcTAT(item) {
        if (item.checkpoint_atual && item.checkpoint_atual.toString().toLowerCase() === 'debit') return null;
        if (item['TAT TSC'] && !isNaN(parseFloat(item['TAT TSC']))) return parseFloat(item['TAT TSC']);
        if (item.checkin) {
            const data = new Date(item.checkin);
            if (!isNaN(data.getTime())) return Math.ceil((new Date() - data) / (1000*60*60*24));
        }
        return null;
    }
    
    let somaTAT = 0, countTAT = 0;
    dados.forEach(i => { const t = calcTAT(i); if(t){ somaTAT+=t; countTAT++; } });
    const mediaTAT = countTAT > 0 ? (somaTAT/countTAT).toFixed(1) : 'N/A';
    
    let tipologiasParaMostrar = [];
    if (filtroAbertos.tipologia !== 'todas') {
        if (filtroAbertos.tipologia === 'Mobile') {
            if (filtroAbertos.mobileTipo === 'cliente') tipologiasParaMostrar = ['Mobile Cliente'];
            else if (filtroAbertos.mobileTipo === 'dg') tipologiasParaMostrar = ['Mobile D&G'];
            else tipologiasParaMostrar = ['Mobile Cliente', 'Mobile D&G'];
        } else {
            tipologiasParaMostrar = [filtroAbertos.tipologia];
        }
    } else {
        const outras = abertosProcessor.getTipologiasAbertos().filter(t => t !== 'Mobile');
        tipologiasParaMostrar = [...outras, 'Mobile Cliente', 'Mobile D&G'];
    }
    
    const cardsHTML = tipologiasParaMostrar.map(tip => {
        let dt = [];
        if (tip === 'Mobile Cliente') {
            dt = abertosProcessor.dados.filter(i => i.tipologia === 'Mobile' && i.tipo_garantia !== 'Seguro D&G');
        } else if (tip === 'Mobile D&G') {
            dt = abertosProcessor.dados.filter(i => i.tipologia === 'Mobile' && i.tipo_garantia === 'Seguro D&G');
        } else {
            dt = abertosProcessor.dados.filter(i => i.tipologia === tip);
        }
        
        const garantiasMap = new Map();
        let somaTATTip = 0, countTATTip = 0;
        dt.forEach(item => {
            const tat = calcTAT(item);
            const tipoGar = normalizarGarantia(item.tipo_garantia || 'Não definido');
            if (!garantiasMap.has(tipoGar)) garantiasMap.set(tipoGar, { qtd: 0, soma: 0, cnt: 0 });
            const g = garantiasMap.get(tipoGar);
            g.qtd++;
            if(tat){ g.soma += tat; g.cnt++; somaTATTip += tat; countTATTip++; }
        });
        const mediaTATTip = countTATTip > 0 ? (somaTATTip/countTATTip).toFixed(1) : 'N/A';
        
        const garantiasHTML = Array.from(garantiasMap.entries()).map(([nome, g]) => {
            const media = g.cnt > 0 ? (g.soma/g.cnt).toFixed(1) : 'N/A';
            return `<div><strong>${nome}:</strong> ${g.qtd} equip. | TAT: ${media} dias</div>`;
        }).join('');
        
        return `<div style="margin-bottom:20px;"><h3>${getIconeTipologia(tip)} ${tip}</h3><div><strong>TAT Médio Geral:</strong> ${mediaTATTip} dias</div><div><strong>Por garantia:</strong> ${garantiasHTML}</div></div>`;
    }).join('');
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório OS Abertas</title><style>body{font-family:Arial;padding:40px;}</style></head><body><h1 style="text-align:center;">📋 Relatório de OS Abertas</h1><p style="text-align:center;">Gerado em ${new Date().toLocaleDateString('pt-PT')}</p><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:15px;margin:20px 0;"><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Total OS</small><div style="font-size:28px;">${dados.length}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Em Análise</small><div style="font-size:28px;">${dados.filter(i=>i.resultado_analise_tecnica==='Análise Técnica Concluída'||!i.reparacao).length}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Aguardam</small><div style="font-size:28px;">${dados.filter(i=>i.resultado_orcamento==='Aguardar Orçamento'||i.resultado_orcamento==='Orçamento Pendente').length}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Aceite</small><div style="font-size:28px;">${dados.filter(i=>i.resultado_orcamento==='Orçamento Aceite').length}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>TAT Médio</small><div style="font-size:28px;">${mediaTAT}</div></div></div><h3>Detalhamento por Tipologia</h3>${cardsHTML}</body></html>`;
    
    const iframe = document.createElement('iframe'); iframe.style.cssText = 'position:absolute;width:0;height:0;'; document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document; doc.open(); doc.write(html); doc.close();
    iframe.contentWindow.onload = () => { iframe.contentWindow.print(); setTimeout(()=>document.body.removeChild(iframe),1000); };
    loading.remove();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const btnAbertos = document.getElementById('btnAbertos');
    const btnProd = document.getElementById('btnProdutividade');
    if (btnAbertos) btnAbertos.addEventListener('click', () => { btnAbertos.classList.add('ativo'); btnProd.classList.remove('ativo'); mostrarAbertos(); });
    if (btnProd) btnProd.addEventListener('click', () => { btnProd.classList.add('ativo'); btnAbertos.classList.remove('ativo'); mostrarProdutividade(); });
    mostrarAbertos();
});
