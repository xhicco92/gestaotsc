// ============================================
// DASHBOARD CENTRO TÉCNICO - VERSÃO COM PERSISTÊNCIA
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
    mobileTipo: 'todos',
    marca: 'todas'
};

// Cache para os dados dos cards (chave = tipologia|garantia)
let dadosGarantiaCache = {};

let dataPickerVisible = false;
let dadosPeriodoAtual = [];

// ============================================
// FUNÇÕES DE PERSISTÊNCIA
// ============================================

const STORAGE_KEYS = {
    PRODUTIVIDADE_DADOS: 'dashboard_produtividade_dados',
    PRODUTIVIDADE_FILTROS: 'dashboard_produtividade_filtros',
    ABERTOS_DADOS: 'dashboard_abertos_dados',
    ABERTOS_FILTROS: 'dashboard_abertos_filtros',
    ULTIMA_ATUALIZACAO: 'dashboard_ultima_atualizacao'
};

function salvarDadosProdutividade() {
    if (processor.dados && processor.dados.length) {
        localStorage.setItem(STORAGE_KEYS.PRODUTIVIDADE_DADOS, JSON.stringify(processor.dados));
        localStorage.setItem(STORAGE_KEYS.PRODUTIVIDADE_FILTROS, JSON.stringify({
            periodo: filtroAtual.periodo,
            tipologia: filtroAtual.tipologia,
            mobileTipo: filtroAtual.mobileTipo,
            polo: filtroAtual.polo,
            dataInicio: filtroAtual.dataInicio ? filtroAtual.dataInicio.toISOString() : null,
            dataFim: filtroAtual.dataFim ? filtroAtual.dataFim.toISOString() : null
        }));
    }
}

function salvarDadosAbertos() {
    if (abertosProcessor.dados && abertosProcessor.dados.length) {
        localStorage.setItem(STORAGE_KEYS.ABERTOS_DADOS, JSON.stringify(abertosProcessor.dados));
        localStorage.setItem(STORAGE_KEYS.ABERTOS_FILTROS, JSON.stringify({
            tipologia: filtroAbertos.tipologia,
            mobileTipo: filtroAbertos.mobileTipo,
            marca: filtroAbertos.marca
        }));
    }
}

function salvarUltimaAtualizacao() {
    const agora = new Date();
    localStorage.setItem(STORAGE_KEYS.ULTIMA_ATUALIZACAO, agora.toISOString());
}

function carregarDadosPersistidos() {
    // Carregar dados de produtividade
    const prodDados = localStorage.getItem(STORAGE_KEYS.PRODUTIVIDADE_DADOS);
    if (prodDados) {
        try {
            processor.dados = JSON.parse(prodDados);
            console.log('Dados de produtividade carregados do storage:', processor.dados.length);
            
            const prodFiltros = localStorage.getItem(STORAGE_KEYS.PRODUTIVIDADE_FILTROS);
            if (prodFiltros) {
                const filtros = JSON.parse(prodFiltros);
                filtroAtual.periodo = filtros.periodo || 'hoje';
                filtroAtual.tipologia = filtros.tipologia || 'todas';
                filtroAtual.mobileTipo = filtros.mobileTipo || 'todos';
                filtroAtual.polo = filtros.polo || 'todos';
                if (filtros.dataInicio) filtroAtual.dataInicio = new Date(filtros.dataInicio);
                if (filtros.dataFim) filtroAtual.dataFim = new Date(filtros.dataFim);
            }
        } catch(e) { console.error('Erro ao carregar produtividade:', e); }
    }
    
    // Carregar dados de abertos
    const abertosDados = localStorage.getItem(STORAGE_KEYS.ABERTOS_DADOS);
    if (abertosDados) {
        try {
            abertosProcessor.dados = JSON.parse(abertosDados);
            console.log('Dados de abertos carregados do storage:', abertosProcessor.dados.length);
            
            const abertosFiltros = localStorage.getItem(STORAGE_KEYS.ABERTOS_FILTROS);
            if (abertosFiltros) {
                const filtros = JSON.parse(abertosFiltros);
                filtroAbertos.tipologia = filtros.tipologia || 'todas';
                filtroAbertos.mobileTipo = filtros.mobileTipo || 'todos';
                filtroAbertos.marca = filtros.marca || 'todas';
            }
        } catch(e) { console.error('Erro ao carregar abertos:', e); }
    }
}

function atualizarFooterData() {
    const footer = document.getElementById('footerInfo');
    if (footer) {
        const ultimaAtualizacao = localStorage.getItem(STORAGE_KEYS.ULTIMA_ATUALIZACAO);
        if (ultimaAtualizacao) {
            const data = new Date(ultimaAtualizacao);
            footer.innerHTML = `📅 Última atualização: ${data.toLocaleDateString('pt-PT')} às ${data.toLocaleTimeString('pt-PT')} | <span style="cursor:pointer; color:#2563eb;" onclick="document.getElementById('fileInputProd').click()">📂 Carregar novo ficheiro</span>`;
        } else {
            footer.innerHTML = `📅 Nenhum ficheiro carregado | <span style="cursor:pointer; color:#2563eb;" onclick="document.getElementById('fileInputProd').click()">📂 Carregar ficheiro</span>`;
        }
    }
}

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

function normalizarGarantia(tipoGarantia) {
    if (!tipoGarantia) return 'Não definido';
    if (tipoGarantia === 'EG+1' || tipoGarantia === 'EG+3') {
        return 'Extensão de Garantia';
    }
    return tipoGarantia;
}

function calcularTAT(item) {
    if (item.checkpoint_atual && item.checkpoint_atual.toString().toLowerCase() === 'debit') {
        return null;
    }
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

const ordemCheckpoints = [
    'Pré-Análise', 'Análise Técnica', 'Intervenção Técnica', 'Nível 3',
    'Orçamento', 'Aguarda Aceitação Orçamento', 'Validação FlatFee',
    'Controlo de Qualidade', 'Check-Out', 'Debit'
];

// ============================================
// ABA PRODUTIVIDADES
// ============================================

function mostrarProdutividade() {
    const html = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">📊 Produtividade dos Técnicos</h2>
                <button onclick="exportarRelatorioPDF()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">📄 Exportar PDF</button>
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
                        <div><span>🏷️ Tipologia:</span> <select id="filtroTipologia" onchange="onTipologiaChange(this.value)"><option value="todas">Todas</option>${processor.dados && processor.dados.length ? processor.getTipologias().map(t=>`<option value="${t}">${t}</option>`).join('') : ''}</select></div>
                        <div id="mobileSubFiltroContainer" style="display: none;"><span>📱 Mobile:</span> <select id="mobileTipo" onchange="aplicarFiltroMobileTipo(this.value)"><option value="todos">Todos</option><option value="cliente">Cliente</option><option value="dg">D&G</option></select></div>
                        <div><span>📍 Localização:</span> <select id="filtroPolo" onchange="aplicarFiltroPolo(this.value)"><option value="todos">Todos</option><option value="TSC SOUTH">TSC SOUTH</option><option value="TSC NORTH">TSC NORTH</option></select></div>
                    </div>
                </div>
                <div id="dataPickerContainer" style="display: none; margin-top: 15px;"><input type="date" id="dataInicio"> até <input type="date" id="dataFim"> <button onclick="aplicarFiltroPersonalizado()">Aplicar</button></div>
            </div>
            <div class="cards">
                <div class="card"><small>Total Reparados</small><strong id="totalRep">0</strong></div>
                <div class="card"><small>Média Diária</small><strong id="mediaDia">0</strong></div>
                <div class="card"><small>Técnicos Ativos</small><strong id="tecAtivos">0</strong></div>
                <div class="card"><small>Média/Técnico</small><strong id="mediaTec">0</strong></div>
            </div>
            <div id="infoFiltro" style="background: #e0f2fe; padding: 10px; border-radius: 4px; margin-bottom: 15px;">📍 Período: <strong>Hoje</strong></div>
            <div style="max-height: 400px; overflow: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
                <table style="width: 100%;"><thead style="background: #f1f5f9;"> <th>Técnico</th><th>Quantidade</th><th>Média/Dia</th><th>%</th> </thead><tbody id="tabela"> <td colspan="4" style="text-align:center;padding:30px;">Carregue um ficheiro para começar</td> </tbody> </table>
            </div>
            <input type="file" id="fileInputProd" accept=".xlsx,.xls,.csv" style="display:none;">
        </div>
    `;
    document.getElementById('conteudo').innerHTML = html;
    setTimeout(() => {
        const input = document.getElementById('fileInputProd');
        if (input) input.onchange = handleUploadProdutividade;
        
        const hoje = new Date(), semana = new Date(hoje); semana.setDate(semana.getDate() - 7);
        const di = document.getElementById('dataInicio'), df = document.getElementById('dataFim');
        if (di) di.value = semana.toISOString().split('T')[0];
        if (df) df.value = hoje.toISOString().split('T')[0];
        
        if (processor.dados && processor.dados.length) {
            atualizarFiltroTipologia();
            const btn = document.querySelector('.filtro-btn');
            if (btn) aplicarFiltroPeriodo(filtroAtual.periodo, btn);
            // Restaurar valores dos selects
            const selTipologia = document.getElementById('filtroTipologia');
            if (selTipologia) selTipologia.value = filtroAtual.tipologia;
            const selMobile = document.getElementById('mobileTipo');
            if (selMobile) selMobile.value = filtroAtual.mobileTipo;
            const selPolo = document.getElementById('filtroPolo');
            if (selPolo) selPolo.value = filtroAtual.polo;
            if (filtroAtual.tipologia === 'Mobile') document.getElementById('mobileSubFiltroContainer').style.display = 'block';
        }
    }, 100);
}

function onTipologiaChange(tipologia) {
    const mobileDiv = document.getElementById('mobileSubFiltroContainer');
    if (tipologia === 'Mobile') mobileDiv.style.display = 'block';
    else { mobileDiv.style.display = 'none'; filtroAtual.mobileTipo = 'todos'; const sel = document.getElementById('mobileTipo'); if(sel) sel.value = 'todos'; }
    filtroAtual.tipologia = tipologia; aplicarFiltros(); atualizarInfoFiltro(); salvarDadosProdutividade();
}
function aplicarFiltroMobileTipo(tipo) { filtroAtual.mobileTipo = tipo; aplicarFiltros(); atualizarInfoFiltro(); salvarDadosProdutividade(); }
function aplicarFiltroPolo(polo) { filtroAtual.polo = polo; aplicarFiltros(); atualizarInfoFiltro(); salvarDadosProdutividade(); }
function aplicarFiltroPeriodo(periodo, btn) {
    if (dataPickerVisible) toggleDataPicker();
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroAtual.periodo = periodo; filtroAtual.dataInicio = null; filtroAtual.dataFim = null;
    aplicarFiltros(); atualizarInfoFiltro(); salvarDadosProdutividade();
}
function aplicarFiltroPersonalizado() {
    const inicio = document.getElementById('dataInicio').value, fim = document.getElementById('dataFim').value;
    if (!inicio || !fim) { alert('Selecione as datas'); return; }
    toggleDataPicker();
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    filtroAtual.periodo = 'personalizado';
    filtroAtual.dataInicio = new Date(inicio);
    filtroAtual.dataFim = new Date(fim);
    filtroAtual.dataFim.setHours(23,59,59,999);
    aplicarFiltros(); atualizarInfoFiltro(); salvarDadosProdutividade();
}
function atualizarInfoFiltro() {
    const el = document.getElementById('infoFiltro');
    let txt = '';
    if (filtroAtual.periodo === 'personalizado') txt = `📍 Período: <strong>${filtroAtual.dataInicio.toLocaleDateString('pt-PT')}</strong> até <strong>${filtroAtual.dataFim.toLocaleDateString('pt-PT')}</strong>`;
    else { const n = {hoje:'Hoje',ontem:'Ontem',semana:'Últimos 7 dias',mes:'Últimos 30 dias',trimestre:'Últimos 90 dias'}; txt = `📍 Período: <strong>${n[filtroAtual.periodo]}</strong>`; }
    if (filtroAtual.tipologia !== 'todas') { txt += ` | Tipologia: <strong>${filtroAtual.tipologia}</strong>`; if (filtroAtual.tipologia === 'Mobile' && filtroAtual.mobileTipo !== 'todos') txt += ` <span style="background:#2563eb20;padding:2px 6px;border-radius:12px;">${filtroAtual.mobileTipo === 'cliente' ? 'Cliente' : 'D&G'}</span>`; }
    if (filtroAtual.polo !== 'todos') txt += ` | Localização: <strong>${filtroAtual.polo}</strong>`;
    el.innerHTML = txt;
}
function aplicarFiltros() {
    if (!processor.dados || !processor.dados.length) return;
    let dados = processor.dados;
    if (filtroAtual.periodo === 'personalizado') dados = dados.filter(i => { const d = processor.getDataReparacao(i); return d && d >= filtroAtual.dataInicio && d <= filtroAtual.dataFim; });
    else dados = processor.filtrarPorPeriodo(filtroAtual.periodo);
    if (filtroAtual.tipologia !== 'todas') { dados = dados.filter(i => i.tipologia === filtroAtual.tipologia); if (filtroAtual.tipologia === 'Mobile' && filtroAtual.mobileTipo !== 'todos') dados = dados.filter(i => filtroAtual.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia !== 'Seguro D&G'); }
    if (filtroAtual.polo !== 'todos') dados = dados.filter(i => i.polo === filtroAtual.polo);
    dadosPeriodoAtual = dados;
    const stats = processor.calcularEstatisticas(dados, filtroAtual.periodo);
    document.getElementById('totalRep').textContent = stats.totalReparados;
    document.getElementById('mediaDia').textContent = stats.mediaDiaria.toFixed(1);
    document.getElementById('tecAtivos').textContent = stats.tecnicosAtivos;
    document.getElementById('mediaTec').textContent = stats.mediaPorTecnico.toFixed(1);
    const tabela = document.getElementById('tabela');
    if (!stats.totalReparados) { tabela.innerHTML = ' <td colspan="4" style="text-align:center;">Nenhum reparado neste período</td> '; return; }
    const maxQ = Math.max(...Object.values(stats.reparados)), dias = stats.numeroDias;
    tabela.innerHTML = Object.entries(stats.reparados).filter(([_,q])=>q>0).sort((a,b)=>b[1]-a[1]).map(([t,q])=>`<tr><td style="padding:8px;"><a href="javascript:void(0)" onclick="abrirDetalheTecnico('${t.replace(/'/g,"\\'")}')" style="color:#2563eb;text-decoration:none;">${t}</a></td><td style="text-align:center;">${q}</td><td style="text-align:center;">${(q/dias).toFixed(1)}</td><td><div style="background:#e2e8f0;border-radius:10px;width:100px;height:8px;"><div style="background:#2563eb;width:${(q/maxQ*100)}%;height:8px;border-radius:10px;"></div></div></td></tr>`).join('');
}
function atualizarFiltroTipologia() { const sel = document.getElementById('filtroTipologia'); if (sel && processor.dados) sel.innerHTML = `<option value="todas">Todas</option>${processor.getTipologias().map(t=>`<option value="${t}">${t}</option>`).join('')}`; }
async function handleUploadProdutividade(e) {
    const file = e.target.files[0];
    if (!file) return;
    const loadingMsg = document.createElement('div'); loadingMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#2563eb;color:white;padding:12px;border-radius:8px;z-index:1001;'; loadingMsg.innerHTML = '📂 A processar...'; document.body.appendChild(loadingMsg);
    try {
        await processor.carregarDados(file);
        salvarDadosProdutividade();
        salvarUltimaAtualizacao();
        atualizarFooterData();
        atualizarFiltroTipologia();
        const btn = document.querySelector('.filtro-btn');
        if (btn) aplicarFiltroPeriodo('hoje', btn);
        loadingMsg.remove();
        alert(`✅ Ficheiro carregado! ${processor.dados.length} registos importados.`);
    } catch(e) { loadingMsg.remove(); alert(`❌ Erro: ${e.message}`); }
}
function abrirDetalheTecnico(tecnico) { if (!dadosPeriodoAtual.length) return; const dados = dadosPeriodoAtual.filter(i => (i.tecnico_reparacao || i.Tecnico) === tecnico); const dias = {}; dados.forEach(i => { const d = processor.getDataReparacao(i); if(d) dias[d.toLocaleDateString('pt-PT')] = (dias[d.toLocaleDateString('pt-PT')] || 0) + 1; }); const ordenado = Object.keys(dias).sort((a,b)=>{const [da,ma,aa]=a.split('/'),[db,mb,ab]=b.split('/'); if(aa!==ab)return aa-ab; if(ma!==mb)return ma-mb; return da-db;}); const maxV = Math.max(...Object.values(dias),1); const modal = document.createElement('div'); modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;'; modal.innerHTML = `<div style="background:white;border-radius:12px;width:90%;max-width:500px;max-height:80vh;overflow:auto;"><div style="padding:20px;border-bottom:1px solid #e2e8f0;"><h2>👤 ${tecnico}</h2><p>Total: <strong>${dados.length}</strong></p></div><div style="padding:20px;"><div style="display:flex;gap:8px;align-items:flex-end;min-height:150px;">${ordenado.map(d=>`<div style="flex:1;text-align:center;"><div style="background:#2563eb;height:${(dias[d]/maxV)*120}px;border-radius:4px 4px 0 0;"></div><span style="font-size:10px;">${d}</span><div>${dias[d]}</div></div>`).join('')}</div></div><div style="padding:20px;border-top:1px solid #e2e8f0;text-align:right;"><button onclick="this.closest(\'div[style*="position:fixed"]\').remove()" style="background:#f1f5f9;border:none;padding:8px 20px;border-radius:6px;">Fechar</button></div></div>`; document.body.appendChild(modal); }
async function exportarRelatorioPDF() { if (!processor.dados || !processor.dados.length) { alert('Carregue um ficheiro'); return; } const loading = document.createElement('div'); loading.style.cssText = 'position:fixed;top:20px;right:20px;background:#2563eb;color:white;padding:12px;border-radius:8px;z-index:1001;'; loading.innerHTML = '📄 Gerando...'; document.body.appendChild(loading); const stats = processor.calcularEstatisticas(dadosPeriodoAtual, filtroAtual.periodo); const tecnicos = Object.entries(stats.reparados).filter(([_,q])=>q>0).sort((a,b)=>b[1]-a[1]); const periodo = filtroAtual.periodo === 'personalizado' ? `${filtroAtual.dataInicio.toLocaleDateString('pt-PT')} a ${filtroAtual.dataFim.toLocaleDateString('pt-PT')}` : ({hoje:'Hoje',ontem:'Ontem',semana:'Últimos 7 dias',mes:'Últimos 30 dias',trimestre:'Últimos 90 dias'}[filtroAtual.periodo]); const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Produtividade</title><style>body{font-family:Arial;padding:40px;}</style></head><body><h1 style="text-align:center;">📊 Relatório de Produtividade</h1><p style="text-align:center;">Gerado em ${new Date().toLocaleDateString('pt-PT')}</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0;"><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Total Reparados</small><div style="font-size:28px;">${stats.totalReparados}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Média Diária</small><div style="font-size:28px;">${stats.mediaDiaria.toFixed(1)}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Técnicos Ativos</small><div style="font-size:28px;">${stats.tecnicosAtivos}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Média/Técnico</small><div style="font-size:28px;">${stats.mediaPorTecnico.toFixed(1)}</div></div></div><p><strong>Período:</strong> ${periodo}</p><table border="1" cellpadding="8" style="width:100%;border-collapse:collapse;"><tr><th>Técnico</th><th>Quantidade</th><th>Média/Dia</th><th>%</th></tr>${tecnicos.map(([t,q])=>`<tr><td>${t}</td><td>${q}</td><td>${(q/stats.numeroDias).toFixed(1)}</td><td>${((q/stats.totalReparados)*100).toFixed(1)}%</td></tr>`).join('')}</table></body></html>`;
    const iframe = document.createElement('iframe'); iframe.style.cssText = 'position:absolute;width:0;height:0;'; document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document; doc.open(); doc.write(html); doc.close();
    iframe.contentWindow.onload = () => { iframe.contentWindow.print(); setTimeout(()=>document.body.removeChild(iframe),1000); };
    loading.remove();
}

// ============================================
// ABA ABERTOS
// ============================================

function mostrarAbertos() {
    let marcasUnicas = [];
    if (abertosProcessor.dados && abertosProcessor.dados.length) {
        const marcasSet = new Set();
        abertosProcessor.dados.forEach(item => {
            if (item.marca && item.marca.trim() !== '') marcasSet.add(item.marca);
        });
        marcasUnicas = Array.from(marcasSet).sort();
    }
    
    const marcasOptions = marcasUnicas.map(m => `<option value="${m}">${m}</option>`).join('');
    
    const html = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">📋 Abertos - Área Técnica</h2>
                <button onclick="exportarAbertosPDF()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">📄 Exportar PDF</button>
            </div>
            <div style="background: #f8fafc; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div><span>🏷️ Tipologia:</span> <select id="filtroTipologiaAbertos" onchange="onTipologiaAbertosChange(this.value)"><option value="todas">Todas</option>${abertosProcessor.dados && abertosProcessor.dados.length ? abertosProcessor.getTipologiasAbertos().map(t=>`<option value="${t}">${t}</option>`).join('') : ''}</select></div>
                    <div id="mobileSubAbertos" style="display: none;"><span>📱 Mobile:</span> <select id="mobileTipoAbertos" onchange="aplicarFiltroMobileAbertos(this.value)"><option value="todos">Todos</option><option value="cliente">Cliente</option><option value="dg">D&G</option></select></div>
                    <div><span>🏷️ Marca:</span> <select id="filtroMarcaAbertos" onchange="aplicarFiltroMarcaAbertos(this.value)"><option value="todas">Todas as marcas</option>${marcasOptions}</select></div>
                </div>
            </div>
            <div class="cards">
                <div class="card"><small>Total Abertos</small><strong id="totalAbertos">0</strong></div>
                <div class="card"><small>Análise Técnica</small><strong id="analiseTecnica">0</strong><div style="font-size:12px; color:#64748b;" id="tatAnaliseTecnica">TAT: --</div></div>
                <div class="card"><small>Intervenção Técnica (Não Pendente)</small><strong id="intervencaoTecnica">0</strong><div style="font-size:12px; color:#64748b;" id="tatIntervencaoTecnica">TAT: --</div></div>
                <div class="card"><small>TAT Médio Total</small><strong id="tatTotal">0</strong></div>
            </div>
            <div id="infoAbertos" style="background: #e0f2fe; padding: 10px; border-radius: 4px; margin-bottom: 15px;">📍 Mostrando todas as tipologias</div>
            <div id="cardsTipologias" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;"></div>
            <input type="file" id="fileInputAbertos" accept=".xlsx,.xls,.csv" style="display:none;">
        </div>
    `;
    document.getElementById('conteudo').innerHTML = html;
    setTimeout(() => {
        const input = document.getElementById('fileInputAbertos');
        if (input) input.onchange = handleUploadAbertos;
        if (abertosProcessor.dados && abertosProcessor.dados.length) {
            // Restaurar valores dos selects
            const selTipologia = document.getElementById('filtroTipologiaAbertos');
            if (selTipologia) selTipologia.value = filtroAbertos.tipologia;
            const selMobile = document.getElementById('mobileTipoAbertos');
            if (selMobile) selMobile.value = filtroAbertos.mobileTipo;
            const selMarca = document.getElementById('filtroMarcaAbertos');
            if (selMarca) selMarca.value = filtroAbertos.marca;
            if (filtroAbertos.tipologia === 'Mobile') document.getElementById('mobileSubAbertos').style.display = 'block';
            atualizarCardsAbertos();
        }
    }, 100);
}

function onTipologiaAbertosChange(tipologia) {
    const mobileDiv = document.getElementById('mobileSubAbertos');
    if (tipologia === 'Mobile') mobileDiv.style.display = 'block';
    else { mobileDiv.style.display = 'none'; filtroAbertos.mobileTipo = 'todos'; const sel = document.getElementById('mobileTipoAbertos'); if(sel) sel.value = 'todos'; }
    filtroAbertos.tipologia = tipologia;
    atualizarCardsAbertos();
    salvarDadosAbertos();
    const info = document.getElementById('infoAbertos');
    if (filtroAbertos.tipologia !== 'todas') {
        let txt = `📍 Tipologia: <strong>${filtroAbertos.tipologia}</strong>`;
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') txt += ` <span style="background:#2563eb20;padding:2px 6px;border-radius:12px;">${filtroAbertos.mobileTipo === 'cliente' ? 'Cliente' : 'D&G'}</span>`;
        if (filtroAbertos.marca !== 'todas') txt += ` | Marca: <strong>${filtroAbertos.marca}</strong>`;
        info.innerHTML = txt;
    } else {
        let txt = '📍 Mostrando todas as tipologias';
        if (filtroAbertos.marca !== 'todas') txt = `📍 Marca: <strong>${filtroAbertos.marca}</strong>`;
        info.innerHTML = txt;
    }
}

function aplicarFiltroMobileAbertos(tipo) { filtroAbertos.mobileTipo = tipo; atualizarCardsAbertos(); salvarDadosAbertos(); onTipologiaAbertosChange(filtroAbertos.tipologia); }
function aplicarFiltroMarcaAbertos(marca) { filtroAbertos.marca = marca; atualizarCardsAbertos(); salvarDadosAbertos(); onTipologiaAbertosChange(filtroAbertos.tipologia); }

function atualizarCardsAbertos() {
    if (!abertosProcessor.dados || !abertosProcessor.dados.length) return;
    
    let dados = abertosProcessor.dados;
    
    if (filtroAbertos.tipologia !== 'todas') {
        dados = dados.filter(i => i.tipologia === filtroAbertos.tipologia);
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dados = dados.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia !== 'Seguro D&G');
        }
    }
    if (filtroAbertos.marca !== 'todas') {
        dados = dados.filter(i => i.marca === filtroAbertos.marca);
    }
    
    function calcTAT(item) {
        if (item.checkpoint_atual && item.checkpoint_atual.toString().toLowerCase() === 'debit') return null;
        if (item['TAT TSC'] && !isNaN(parseFloat(item['TAT TSC']))) return parseFloat(item['TAT TSC']);
        if (item.checkin) { const d = new Date(item.checkin); if (!isNaN(d.getTime())) return Math.ceil((new Date() - d) / (1000*60*60*24)); }
        return null;
    }
    
    // Cards superiores
    const analiseEquip = dados.filter(i => {
        const cp = i.checkpoint_atual;
        return cp === 'Pré-Análise' || cp === 'Pré Analise' || cp === 'Pré-Analise' ||
               cp === 'Análise Técnica' || cp === 'Analise Tecnica';
    });
    const intervencaoEquip = dados.filter(i => {
        const isInt = i.checkpoint_atual === 'Intervenção Técnica' || i.checkpoint_atual === 'Intervencao Tecnica';
        const pend = i.pendente_peca ? i.pendente_peca.toString().toLowerCase() : '';
        return isInt && pend !== 'sim' && pend !== 's' && pend !== 'true' && pend !== '1';
    });
    
    let somaTA = 0, cntTA = 0; analiseEquip.forEach(i => { const t = calcTAT(i); if(t){ somaTA += t; cntTA++; } });
    let somaTI = 0, cntTI = 0; intervencaoEquip.forEach(i => { const t = calcTAT(i); if(t){ somaTI += t; cntTI++; } });
    let somaTT = 0, cntTT = 0; dados.forEach(i => { const t = calcTAT(i); if(t){ somaTT += t; cntTT++; } });
    
    document.getElementById('totalAbertos').textContent = dados.length;
    document.getElementById('analiseTecnica').textContent = analiseEquip.length;
    document.getElementById('tatAnaliseTecnica').innerHTML = `TAT: ${cntTA>0?(somaTA/cntTA).toFixed(1):'N/A'} dias`;
    document.getElementById('intervencaoTecnica').textContent = intervencaoEquip.length;
    document.getElementById('tatIntervencaoTecnica').innerHTML = `TAT: ${cntTI>0?(somaTI/cntTI).toFixed(1):'N/A'} dias`;
    document.getElementById('tatTotal').textContent = cntTT>0?(somaTT/cntTT).toFixed(1)+' dias':'N/A';
    
    // Cards por tipologia
    let tipologiasParaMostrar = [];
    if (filtroAbertos.tipologia !== 'todas') {
        if (filtroAbertos.tipologia === 'Mobile') {
            if (filtroAbertos.mobileTipo === 'cliente') tipologiasParaMostrar = ['Mobile Cliente'];
            else if (filtroAbertos.mobileTipo === 'dg') tipologiasParaMostrar = ['Mobile D&G'];
            else tipologiasParaMostrar = ['Mobile Cliente', 'Mobile D&G'];
        } else tipologiasParaMostrar = [filtroAbertos.tipologia];
    } else {
        const outras = abertosProcessor.getTipologiasAbertos().filter(t => t !== 'Mobile');
        tipologiasParaMostrar = [...outras, 'Mobile Cliente', 'Mobile D&G'];
    }
    
    const container = document.getElementById('cardsTipologias');
    container.innerHTML = tipologiasParaMostrar.map(tip => {
        let dadosTip = [];
        let tipologiaOriginal = '';
        
        if (tip === 'Mobile Cliente') {
            dadosTip = abertosProcessor.dados.filter(i => i.tipologia === 'Mobile' && i.tipo_garantia !== 'Seguro D&G');
            tipologiaOriginal = 'Mobile';
        } else if (tip === 'Mobile D&G') {
            dadosTip = abertosProcessor.dados.filter(i => i.tipologia === 'Mobile' && i.tipo_garantia === 'Seguro D&G');
            tipologiaOriginal = 'Mobile';
        } else {
            dadosTip = abertosProcessor.dados.filter(i => i.tipologia === tip);
            tipologiaOriginal = tip;
        }
        
        if (filtroAbertos.marca !== 'todas') dadosTip = dadosTip.filter(i => i.marca === filtroAbertos.marca);
        
        const totalTip = dadosTip.length;
        let somaTTip = 0, cntTTip = 0;
        dadosTip.forEach(i => { const t = calcTAT(i); if(t){ somaTTip += t; cntTTip++; } });
        const mediaTip = cntTTip>0?(somaTTip/cntTTip).toFixed(1):'N/A';
        
        const garantiasTip = new Map();
        dadosTip.forEach(item => {
            const garantia = normalizarGarantia(item.tipo_garantia || 'Não definido');
            if (!garantiasTip.has(garantia)) {
                garantiasTip.set(garantia, { qtd: 0, somaTAT: 0, cntTAT: 0, itens: [] });
            }
            const g = garantiasTip.get(garantia);
            g.qtd++;
            g.itens.push(item);
            const tat = calcTAT(item);
            if(tat){ g.somaTAT += tat; g.cntTAT++; }
        });
        
        garantiasTip.forEach((value, garantia) => {
            const cacheKey = `${tipologiaOriginal}|${garantia}`;
            dadosGarantiaCache[cacheKey] = value.itens;
        });
        
        const garantiasHTML = Array.from(garantiasTip.entries()).map(([garantia, g]) => {
            const media = g.cntTAT>0?(g.somaTAT/g.cntTAT).toFixed(1):'N/A';
            const cacheKey = `${tipologiaOriginal}|${garantia}`;
            return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;cursor:pointer;" onclick="abrirDetalheGarantia('${tip}', '${garantia}', '${cacheKey}')"><span><strong>${garantia}</strong></span><div style="text-align:right;"><div>${g.qtd} equip.</div><div style="font-size:12px;">TAT: ${media} dias</div></div></div>`;
        }).join('');
        
        return `<div style="background:white;border-radius:12px;padding:20px;border:1px solid #e2e8f0;"><div style="display:flex;justify-content:space-between;"><h3>${getIconeTipologia(tip)} ${tip}</h3><span style="background:#2563eb;color:white;padding:4px 12px;border-radius:20px;">Total: ${totalTip}</span></div><div style="background:#f1f5f9;padding:8px 12px;border-radius:6px;margin:15px 0;">📊 TAT Médio Geral: <strong>${mediaTip} dias</strong></div><div><div style="font-weight:bold;">📋 Por tipo de garantia:</div>${garantiasHTML}</div></div>`;
    }).join('');
}

// Função para abrir modal de detalhe por garantia
function abrirDetalheGarantia(tipologia, garantia, cacheKey) {
    let dadosGarantia = dadosGarantiaCache[cacheKey];
    if (!dadosGarantia || dadosGarantia.length === 0) {
        alert(`Nenhum dado disponível para ${garantia} em ${tipologia}`);
        return;
    }
    
    const checkpointMap = new Map();
    ordemCheckpoints.forEach(cp => {
        checkpointMap.set(cp, { quantidade: 0, somaTAT: 0, countTAT: 0, pendentes: { sim: 0, nao: 0, somaTATSim: 0, countTATSim: 0, somaTATNao: 0, countTATNao: 0 } });
    });
    
    dadosGarantia.forEach(item => {
        let checkpoint = item.checkpoint_atual || 'Não definido';
        const tat = calcularTAT(item);
        const pendentePeca = item.pendente_peca ? item.pendente_peca.toString().toLowerCase() : '';
        
        if (checkpoint === 'Analise Tecnica') checkpoint = 'Análise Técnica';
        if (checkpoint === 'Intervencao Tecnica') checkpoint = 'Intervenção Técnica';
        if (checkpoint === 'Aguarda Aceitacao Orcamento') checkpoint = 'Aguarda Aceitação Orçamento';
        if (checkpoint === 'Pre Analise') checkpoint = 'Pré-Análise';
        if (checkpoint === 'Nivel 3') checkpoint = 'Nível 3';
        if (checkpoint === 'Validacao FlatFee') checkpoint = 'Validação FlatFee';
        if (checkpoint === 'Controlo Qualidade') checkpoint = 'Controlo de Qualidade';
        
        if (checkpointMap.has(checkpoint)) {
            const cpData = checkpointMap.get(checkpoint);
            cpData.quantidade++;
            if (tat !== null) { cpData.somaTAT += tat; cpData.countTAT++; }
            if (checkpoint === 'Intervenção Técnica') {
                const isPendente = pendentePeca === 'sim' || pendentePeca === 's' || pendentePeca === 'true' || pendentePeca === '1';
                if (isPendente) {
                    cpData.pendentes.sim++;
                    if (tat !== null) { cpData.pendentes.somaTATSim += tat; cpData.pendentes.countTATSim++; }
                } else {
                    cpData.pendentes.nao++;
                    if (tat !== null) { cpData.pendentes.somaTATNao += tat; cpData.pendentes.countTATNao++; }
                }
            }
        }
    });
    
    const checkpointsHTML = ordemCheckpoints.map(cp => {
        const cpData = checkpointMap.get(cp);
        if (!cpData || cpData.quantidade === 0) return '';
        const mediaTAT = cpData.countTAT > 0 ? (cpData.somaTAT / cpData.countTAT).toFixed(1) : 'N/A';
        let pendentesHTML = '';
        if (cp === 'Intervenção Técnica' && (cpData.pendentes.sim > 0 || cpData.pendentes.nao > 0)) {
            const mediaSim = cpData.pendentes.countTATSim > 0 ? (cpData.pendentes.somaTATSim / cpData.pendentes.countTATSim).toFixed(1) : 'N/A';
            const mediaNao = cpData.pendentes.countTATNao > 0 ? (cpData.pendentes.somaTATNao / cpData.pendentes.countTATNao).toFixed(1) : 'N/A';
            pendentesHTML = `<div style="margin-left:20px;margin-top:5px;"><div style="display:flex;justify-content:space-between;padding:4px 0;"><span>├─ Pendente de Peça</span><div><strong>${cpData.pendentes.sim} equip.</strong> <span style="font-size:12px;">TAT: ${mediaSim} dias</span></div></div><div style="display:flex;justify-content:space-between;padding:4px 0;"><span>└─ Não Pendente de Peça</span><div><strong>${cpData.pendentes.nao} equip.</strong> <span style="font-size:12px;">TAT: ${mediaNao} dias</span></div></div></div>`;
        }
        return `<div style="border-bottom:1px solid #e2e8f0;padding:10px 0;"><div style="display:flex;justify-content:space-between;"><span>📌 ${cp}</span><div><strong>${cpData.quantidade} equip.</strong> <span style="font-size:12px;">TAT: ${mediaTAT} dias</span></div></div>${pendentesHTML}</div>`;
    }).join('');
    
    const totalEquipamentos = dadosGarantia.length;
    let somaTATTotal = 0, countTATTotal = 0;
    dadosGarantia.forEach(item => { const tat = calcularTAT(item); if (tat !== null) { somaTATTotal += tat; countTATTotal++; } });
    const mediaTATTotal = countTATTotal > 0 ? (somaTATTotal / countTATTotal).toFixed(1) : 'N/A';
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;';
    modal.innerHTML = `<div style="background:white;border-radius:12px;width:90%;max-width:550px;max-height:80vh;overflow:auto;box-shadow:0 20px 40px rgba(0,0,0,0.2);"><div style="padding:20px;border-bottom:1px solid #e2e8f0;background:#f8fafc;"><h2 style="margin:0;">${getIconeTipologia(tipologia)} ${tipologia}</h2><p style="margin:5px 0 0 0;">Tipo de Garantia: <strong>${garantia}</strong></p></div><div style="padding:20px;"><div style="background:#f1f5f9;padding:12px;border-radius:8px;margin-bottom:20px;"><div style="display:flex;justify-content:space-between;"><strong>Total de equipamentos:</strong><span style="font-size:24px;font-weight:bold;color:#2563eb;">${totalEquipamentos}</span></div><div style="display:flex;justify-content:space-between;margin-top:8px;"><strong>TAT Médio Total:</strong><span>${mediaTATTotal} dias</span></div></div><h3 style="margin:0 0 15px 0;">📊 Distribuição por Checkpoint</h3><div>${checkpointsHTML || '<div style="text-align:center;padding:30px;">Nenhum checkpoint encontrado</div>'}</div></div><div style="padding:16px;border-top:1px solid #e2e8f0;text-align:right;"><button onclick="this.closest(\'div[style*="position:fixed"]\').remove()" style="background:#f1f5f9;border:none;padding:8px 24px;border-radius:6px;">Fechar</button></div></div>`;
    document.body.appendChild(modal);
}

async function handleUploadAbertos(e) {
    const file = e.target.files[0];
    if (!file) return;
    const loadingMsg = document.createElement('div'); loadingMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#2563eb;color:white;padding:12px;border-radius:8px;z-index:1001;'; loadingMsg.innerHTML = '📂 A processar...'; document.body.appendChild(loadingMsg);
    try {
        await abertosProcessor.carregarDados(file);
        salvarDadosAbertos();
        salvarUltimaAtualizacao();
        atualizarFooterData();
        
        const selTipologia = document.getElementById('filtroTipologiaAbertos');
        if (selTipologia) selTipologia.innerHTML = `<option value="todas">Todas</option>${abertosProcessor.getTipologiasAbertos().map(t=>`<option value="${t}">${t}</option>`).join('')}`;
        
        const marcasSet = new Set();
        abertosProcessor.dados.forEach(item => { if (item.marca && item.marca.trim() !== '') marcasSet.add(item.marca); });
        const marcasOptions = Array.from(marcasSet).sort().map(m => `<option value="${m}">${m}</option>`).join('');
        const selMarca = document.getElementById('filtroMarcaAbertos');
        if (selMarca) selMarca.innerHTML = `<option value="todas">Todas as marcas</option>${marcasOptions}`;
        
        atualizarCardsAbertos();
        loadingMsg.remove();
        alert(`✅ Ficheiro carregado! ${abertosProcessor.dados.length} registos importados.`);
    } catch(e) { loadingMsg.remove(); alert(`❌ Erro: ${e.message}`); }
}

async function exportarAbertosPDF() {
    if (!abertosProcessor.dados || !abertosProcessor.dados.length) { alert('Carregue um ficheiro'); return; }
    const loading = document.createElement('div'); loading.style.cssText = 'position:fixed;top:20px;right:20px;background:#2563eb;color:white;padding:12px;border-radius:8px;z-index:1001;'; loading.innerHTML = '📄 Gerando...'; document.body.appendChild(loading);
    
    let dados = abertosProcessor.dados;
    if (filtroAbertos.tipologia !== 'todas') {
        dados = dados.filter(i => i.tipologia === filtroAbertos.tipologia);
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') dados = dados.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia !== 'Seguro D&G');
    }
    if (filtroAbertos.marca !== 'todas') dados = dados.filter(i => i.marca === filtroAbertos.marca);
    
    function calcTATpdf(i) {
        if (i.checkpoint_atual && i.checkpoint_atual.toString().toLowerCase() === 'debit') return null;
        if (i['TAT TSC'] && !isNaN(parseFloat(i['TAT TSC']))) return parseFloat(i['TAT TSC']);
        if (i.checkin) { const d = new Date(i.checkin); if (!isNaN(d.getTime())) return Math.ceil((new Date() - d) / (1000*60*60*24)); }
        return null;
    }
    
    const analiseEq = dados.filter(i => i.checkpoint_atual === 'Pré-Análise' || i.checkpoint_atual === 'Pré Analise' || i.checkpoint_atual === 'Análise Técnica' || i.checkpoint_atual === 'Analise Tecnica');
    const interEq = dados.filter(i => { const isInt = i.checkpoint_atual === 'Intervenção Técnica' || i.checkpoint_atual === 'Intervencao Tecnica'; const pend = i.pendente_peca ? i.pendente_peca.toString().toLowerCase() : ''; return isInt && pend !== 'sim' && pend !== 's' && pend !== 'true' && pend !== '1'; });
    
    let sTA=0,cTA=0; analiseEq.forEach(i=>{const t=calcTATpdf(i);if(t){sTA+=t;cTA++;}});
    let sTI=0,cTI=0; interEq.forEach(i=>{const t=calcTATpdf(i);if(t){sTI+=t;cTI++;}});
    let sTT=0,cTT=0; dados.forEach(i=>{const t=calcTATpdf(i);if(t){sTT+=t;cTT++;}});
    
    let tipologias = [];
    if (filtroAbertos.tipologia !== 'todas') {
        if (filtroAbertos.tipologia === 'Mobile') {
            if (filtroAbertos.mobileTipo === 'cliente') tipologias = ['Mobile Cliente'];
            else if (filtroAbertos.mobileTipo === 'dg') tipologias = ['Mobile D&G'];
            else tipologias = ['Mobile Cliente', 'Mobile D&G'];
        } else tipologias = [filtroAbertos.tipologia];
    } else {
        const outras = abertosProcessor.getTipologiasAbertos().filter(t => t !== 'Mobile');
        tipologias = [...outras, 'Mobile Cliente', 'Mobile D&G'];
    }
    
    const cardsHTML = tipologias.map(tip => {
        let dt = [];
        if (tip === 'Mobile Cliente') dt = abertosProcessor.dados.filter(i => i.tipologia === 'Mobile' && i.tipo_garantia !== 'Seguro D&G');
        else if (tip === 'Mobile D&G') dt = abertosProcessor.dados.filter(i => i.tipologia === 'Mobile' && i.tipo_garantia === 'Seguro D&G');
        else dt = abertosProcessor.dados.filter(i => i.tipologia === tip);
        if (filtroAbertos.marca !== 'todas') dt = dt.filter(i => i.marca === filtroAbertos.marca);
        
        const gMap = new Map();
        let sTip=0,cTip=0;
        dt.forEach(i => { const t=calcTATpdf(i); if(t){ sTip+=t; cTip++; } const g=normalizarGarantia(i.tipo_garantia||'Não definido'); if(!gMap.has(g))gMap.set(g,{qtd:0,soma:0,cnt:0}); const gg=gMap.get(g); gg.qtd++; if(t){gg.soma+=t;gg.cnt++;} });
        const mediaTip = cTip>0?(sTip/cTip).toFixed(1):'N/A';
        const gHTML = Array.from(gMap.entries()).map(([n,g])=>`<div><strong>${n}:</strong> ${g.qtd} equip. | TAT: ${g.cnt>0?(g.soma/g.cnt).toFixed(1):'N/A'} dias</div>`).join('');
        return `<div style="margin-bottom:20px;"><h3>${getIconeTipologia(tip)} ${tip}</h3><div><strong>TAT Médio Geral:</strong> ${mediaTip} dias</div><div><strong>Por garantia:</strong> ${gHTML}</div></div>`;
    }).join('');
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Abertos</title><style>body{font-family:Arial;padding:40px;}</style></head><body><h1 style="text-align:center;">📋 Relatório de Abertos</h1><p style="text-align:center;">Gerado em ${new Date().toLocaleDateString('pt-PT')}</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0;"><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Total Abertos</small><div style="font-size:28px;">${dados.length}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Análise Técnica</small><div style="font-size:28px;">${analiseEq.length}</div><div>TAT: ${cTA>0?(sTA/cTA).toFixed(1):'N/A'} dias</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Intervenção Técnica (Não Pendente)</small><div style="font-size:28px;">${interEq.length}</div><div>TAT: ${cTI>0?(sTI/cTI).toFixed(1):'N/A'} dias</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>TAT Médio Total</small><div style="font-size:28px;">${cTT>0?(sTT/cTT).toFixed(1):'N/A'} dias</div></div></div><h3>Detalhamento por Tipologia</h3>${cardsHTML}</body></html>`;
    const iframe = document.createElement('iframe'); iframe.style.cssText = 'position:absolute;width:0;height:0;'; document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document; doc.open(); doc.write(html); doc.close();
    iframe.contentWindow.onload = () => { iframe.contentWindow.print(); setTimeout(()=>document.body.removeChild(iframe),1000); };
    loading.remove();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados persistidos
    carregarDadosPersistidos();
    
    // Atualizar footer com data da última atualização
    atualizarFooterData();
    
    const btnAbertos = document.getElementById('btnAbertos');
    const btnProd = document.getElementById('btnProdutividade');
    if (btnAbertos) btnAbertos.addEventListener('click', () => { btnAbertos.classList.add('ativo'); btnProd.classList.remove('ativo'); mostrarAbertos(); });
    if (btnProd) btnProd.addEventListener('click', () => { btnProd.classList.add('ativo'); btnAbertos.classList.remove('ativo'); mostrarProdutividade(); });
    mostrarAbertos();
});
