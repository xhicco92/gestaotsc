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
        'Mobile': '📱',
        'Informática': '💻',
        'Entretenimento': '🎮',
        'Som e Imagem': '🎵',
        'Pequenos Domésticos': '🔌'
    };
    return icones[tipologia] || '📦';
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
                    <tbody id="tabela">${processor.dados && processor.dados.length ? '' : '<tr><td colspan="4" style="text-align:center; padding:30px;">Carregue um ficheiro para começar</td></tr>'}</tbody>
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
    if (!stats.totalReparados) { tabela.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum reparado neste período</td></tr>'; return; }
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
// ABA ABERTOS
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
    
    document.getElementById('totalAbertos').textContent = dados.length;
    document.getElementById('emAnalise').textContent = dados.filter(i => i.resultado_analise_tecnica === 'Análise Técnica Concluída' || !i.reparacao).length;
    document.getElementById('aguardamOrcamento').textContent = dados.filter(i => i.resultado_orcamento === 'Aguardar Orçamento' || i.resultado_orcamento === 'Orçamento Pendente').length;
    document.getElementById('orcamentoAceite').textContent = dados.filter(i => i.resultado_orcamento === 'Orçamento Aceite').length;
    
    let tipologias = abertosProcessor.getTipologiasAbertos();
    if (filtroAbertos.tipologia !== 'todas') tipologias = [filtroAbertos.tipologia];
    
    const container = document.getElementById('cardsTipologias');
    container.innerHTML = tipologias.map(tip => {
        let dadosTip = abertosProcessor.dados.filter(i => i.tipologia === tip);
        if (tip === 'Mobile' && filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dadosTip = dadosTip.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia !== 'Seguro D&G');
        }
        
        if (tip === 'Mobile' && filtroAbertos.tipologia === 'todas') {
            const cliente = dadosTip.filter(i => i.tipo_garantia !== 'Seguro D&G');
            const dg = dadosTip.filter(i => i.tipo_garantia === 'Seguro D&G');
            return `<div style="background:white;border-radius:12px;padding:20px;border:1px solid #e2e8f0;"><h3>📱 ${tip}</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;"><div style="background:#f0f9ff;padding:15px;border-radius:8px;"><strong>Cliente</strong><div style="font-size:28px;">${cliente.length}</div></div><div style="background:#fef3c7;padding:15px;border-radius:8px;"><strong>D&G</strong><div style="font-size:28px;">${dg.length}</div></div></div></div>`;
        }
        
        return `<div style="background:white;border-radius:12px;padding:20px;border:1px solid #e2e8f0;"><h3>${getIconeTipologia(tip)} ${tip}</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;"><div><div style="color:#64748b;">Em Análise</div><div style="font-size:24px;">${dadosTip.filter(i => i.resultado_analise_tecnica === 'Análise Técnica Concluída' || !i.reparacao).length}</div></div><div><div style="color:#64748b;">Aguardam</div><div style="font-size:24px;color:#f59e0b;">${dadosTip.filter(i => i.resultado_orcamento === 'Aguardar Orçamento' || i.resultado_orcamento === 'Orçamento Pendente').length}</div></div><div><div style="color:#64748b;">Aceite</div><div style="font-size:24px;color:#10b981;">${dadosTip.filter(i => i.resultado_orcamento === 'Orçamento Aceite').length}</div></div><div><div style="color:#64748b;">% Aceitação</div><div style="font-size:24px;">${dadosTip.length ? Math.round(dadosTip.filter(i=>i.resultado_orcamento==='Orçamento Aceite').length/dadosTip.length*100) : 0}%</div></div></div></div>`;
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
    
    let tipologias = abertosProcessor.getTipologiasAbertos();
    if (filtroAbertos.tipologia !== 'todas') tipologias = [filtroAbertos.tipologia];
    
    const cardsHTML = tipologias.map(tip => {
        let dt = abertosProcessor.dados.filter(i => i.tipologia === tip);
        if (tip === 'Mobile' && filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dt = dt.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia !== 'Seguro D&G');
        }
        if (tip === 'Mobile' && filtroAbertos.tipologia === 'todas') {
            const c = dt.filter(i => i.tipo_garantia !== 'Seguro D&G');
            const dg = dt.filter(i => i.tipo_garantia === 'Seguro D&G');
            return `<div style="margin-bottom:20px;"><h3>📱 ${tip}</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;"><div style="background:#f0f9ff;padding:15px;"><strong>Cliente</strong><div style="font-size:32px;">${c.length}</div></div><div style="background:#fef3c7;padding:15px;"><strong>D&G</strong><div style="font-size:32px;">${dg.length}</div></div></div></div>`;
        }
        return `<div style="margin-bottom:20px;"><h3>${getIconeTipologia(tip)} ${tip}</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;"><div><div>Em Análise</div><div style="font-size:24px;">${dt.filter(i => i.resultado_analise_tecnica === 'Análise Técnica Concluída' || !i.reparacao).length}</div></div><div><div>Aguardam</div><div style="font-size:24px;">${dt.filter(i => i.resultado_orcamento === 'Aguardar Orçamento' || i.resultado_orcamento === 'Orçamento Pendente').length}</div></div><div><div>Aceite</div><div style="font-size:24px;">${dt.filter(i => i.resultado_orcamento === 'Orçamento Aceite').length}</div></div><div><div>% Aceitação</div><div style="font-size:24px;">${dt.length ? Math.round(dt.filter(i=>i.resultado_orcamento==='Orçamento Aceite').length/dt.length*100) : 0}%</div></div></div></div>`;
    }).join('');
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório OS Abertas</title><style>body{font-family:Arial;padding:40px;}</style></head><body><h1 style="text-align:center;">📋 Relatório de OS Abertas</h1><p style="text-align:center;">Gerado em ${new Date().toLocaleDateString('pt-PT')}</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0;"><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Total OS</small><div style="font-size:28px;">${dados.length}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Em Análise</small><div style="font-size:28px;">${dados.filter(i=>i.resultado_analise_tecnica==='Análise Técnica Concluída'||!i.reparacao).length}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Aguardam</small><div style="font-size:28px;">${dados.filter(i=>i.resultado_orcamento==='Aguardar Orçamento'||i.resultado_orcamento==='Orçamento Pendente').length}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Aceite</small><div style="font-size:28px;">${dados.filter(i=>i.resultado_orcamento==='Orçamento Aceite').length}</div></div></div><h3>Detalhamento por Tipologia</h3>${cardsHTML}</body></html>`;
    
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
