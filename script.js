// ============================================
// ABA ABERTOS (VERSÃO ATUALIZADA)
// ============================================

function mostrarAbertos() {
    const html = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">📋 Abertos - Área Técnica</h2>
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
                <div class="card"><small>Total Abertos</small><strong id="totalAbertos">0</strong></div>
                <div class="card"><small>Análise Técnica</small><strong id="analiseTecnica">0</strong><span style="font-size:12px; display:block; color:#64748b;" id="tatAnaliseTecnica">TAT: --</span></div>
                <div class="card"><small>Intervenção Técnica (Não Pendente)</small><strong id="intervencaoTecnica">0</strong><span style="font-size:12px; display:block; color:#64748b;" id="tatIntervencaoTecnica">TAT: --</span></div>
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
        // Exclui equipamentos com checkpoint_atual = "Debit"
        if (item.checkpoint_atual && item.checkpoint_atual.toString().toLowerCase() === 'debit') {
            return null;
        }
        // Prioriza coluna TAT TSC
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
    
    // ========== CARDS SUPERIORES ==========
    // Análise Técnica = Pré-Análise + Análise Técnica
    const analiseTecnicaEquip = dados.filter(i => {
        const cp = i.checkpoint_atual;
        return cp === 'Pré-Análise' || cp === 'Pré Analise' || cp === 'Pré-Analise' ||
               cp === 'Análise Técnica' || cp === 'Analise Tecnica';
    });
    
    // Intervenção Técnica (Não Pendente de Peça)
    const intervencaoNaoPendente = dados.filter(i => {
        const isIntervencao = i.checkpoint_atual === 'Intervenção Técnica' || i.checkpoint_atual === 'Intervencao Tecnica';
        const pendentePeca = i.pendente_peca ? i.pendente_peca.toString().toLowerCase() : '';
        const naoPendente = pendentePeca !== 'sim' && pendentePeca !== 's' && pendentePeca !== 'true' && pendentePeca !== '1';
        return isIntervencao && naoPendente;
    });
    
    // Calcula TAT para Análise Técnica
    let somaTATAnalise = 0, countTATAnalise = 0;
    analiseTecnicaEquip.forEach(item => {
        const tat = calcularTATItem(item);
        if (tat !== null) {
            somaTATAnalise += tat;
            countTATAnalise++;
        }
    });
    const mediaTATAnalise = countTATAnalise > 0 ? (somaTATAnalise / countTATAnalise).toFixed(1) : 'N/A';
    
    // Calcula TAT para Intervenção Técnica (Não Pendente)
    let somaTATIntervencao = 0, countTATIntervencao = 0;
    intervencaoNaoPendente.forEach(item => {
        const tat = calcularTATItem(item);
        if (tat !== null) {
            somaTATIntervencao += tat;
            countTATIntervencao++;
        }
    });
    const mediaTATIntervencao = countTATIntervencao > 0 ? (somaTATIntervencao / countTATIntervencao).toFixed(1) : 'N/A';
    
    // Calcula TAT Total
    let somaTATTotal = 0, countTATTotal = 0;
    dados.forEach(item => {
        const tat = calcularTATItem(item);
        if (tat !== null) {
            somaTATTotal += tat;
            countTATTotal++;
        }
    });
    const mediaTATTotal = countTATTotal > 0 ? (somaTATTotal / countTATTotal).toFixed(1) : 'N/A';
    
    // Atualiza cards superiores
    document.getElementById('totalAbertos').textContent = dados.length;
    document.getElementById('analiseTecnica').textContent = analiseTecnicaEquip.length;
    document.getElementById('tatAnaliseTecnica').innerHTML = `TAT: ${mediaTATAnalise} dias`;
    document.getElementById('intervencaoTecnica').textContent = intervencaoNaoPendente.length;
    document.getElementById('tatIntervencaoTecnica').innerHTML = `TAT: ${mediaTATIntervencao} dias`;
    document.getElementById('tatTotal').textContent = mediaTATTotal + ' dias';
    
    // ========== CARDS POR TIPOLOGIA (mantém a leitura existente) ==========
    
    // Calcula estatísticas por tipo de garantia para os cards individuais
    const garantiasMap = new Map();
    
    dados.forEach(item => {
        const tipoGarantiaOriginal = item.tipo_garantia || 'Não definido';
        const tipoGarantia = normalizarGarantia(tipoGarantiaOriginal);
        
        if (!garantiasMap.has(tipoGarantia)) {
            garantiasMap.set(tipoGarantia, { quantidade: 0, somaTAT: 0, countTAT: 0, itens: [] });
        }
        
        const garantia = garantiasMap.get(tipoGarantia);
        garantia.quantidade++;
        garantia.itens.push(item);
        
        const tat = calcularTATItem(item);
        if (tat !== null) {
            garantia.somaTAT += tat;
            garantia.countTAT++;
        }
    });
    
    // Guarda os dados no cache para o modal
    dadosGarantiaCache = {};
    garantiasMap.forEach((value, key) => {
        dadosGarantiaCache[key] = value.itens;
    });
    
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
        
        // Aplica filtro adicional se necessário
        if (filtroAbertos.tipologia !== 'todas' && filtroAbertos.tipologia !== 'Mobile') {
            dadosTip = dadosTip.filter(i => i.tipologia === filtroAbertos.tipologia);
        }
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dadosTip = dadosTip.filter(i => filtroAbertos.mobileTipo === 'dg' ? i.tipo_garantia === 'Seguro D&G' : i.tipo_garantia !== 'Seguro D&G');
        }
        
        const totalTip = dadosTip.length;
        
        // Calcular TAT para esta tipologia
        let somaTATTip = 0, countTATTip = 0;
        dadosTip.forEach(item => {
            const tat = calcularTATItem(item);
            if (tat !== null) {
                somaTATTip += tat;
                countTATTip++;
            }
        });
        const mediaTATTip = countTATTip > 0 ? (somaTATTip / countTATTip).toFixed(1) : 'N/A';
        
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
    
    // Calcula métricas para os cards superiores no PDF
    const analiseTecnicaEquip = dados.filter(i => {
        const cp = i.checkpoint_atual;
        return cp === 'Pré-Análise' || cp === 'Pré Analise' || cp === 'Pré-Analise' ||
               cp === 'Análise Técnica' || cp === 'Analise Tecnica';
    });
    
    const intervencaoNaoPendente = dados.filter(i => {
        const isIntervencao = i.checkpoint_atual === 'Intervenção Técnica' || i.checkpoint_atual === 'Intervencao Tecnica';
        const pendentePeca = i.pendente_peca ? i.pendente_peca.toString().toLowerCase() : '';
        const naoPendente = pendentePeca !== 'sim' && pendentePeca !== 's' && pendentePeca !== 'true' && pendentePeca !== '1';
        return isIntervencao && naoPendente;
    });
    
    let somaTATAnalise = 0, countTATAnalise = 0;
    analiseTecnicaEquip.forEach(i => { const t = calcTAT(i); if(t){ somaTATAnalise+=t; countTATAnalise++; } });
    const mediaTATAnalise = countTATAnalise > 0 ? (somaTATAnalise/countTATAnalise).toFixed(1) : 'N/A';
    
    let somaTATIntervencao = 0, countTATIntervencao = 0;
    intervencaoNaoPendente.forEach(i => { const t = calcTAT(i); if(t){ somaTATIntervencao+=t; countTATIntervencao++; } });
    const mediaTATIntervencao = countTATIntervencao > 0 ? (somaTATIntervencao/countTATIntervencao).toFixed(1) : 'N/A';
    
    let somaTATTotal = 0, countTATTotal = 0;
    dados.forEach(i => { const t = calcTAT(i); if(t){ somaTATTotal+=t; countTATTotal++; } });
    const mediaTATTotal = countTATTotal > 0 ? (somaTATTotal/countTATTotal).toFixed(1) : 'N/A';
    
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
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Abertos</title><style>body{font-family:Arial;padding:40px;}</style></head><body><h1 style="text-align:center;">📋 Relatório de Abertos</h1><p style="text-align:center;">Gerado em ${new Date().toLocaleDateString('pt-PT')}</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0;"><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Total Abertos</small><div style="font-size:28px;">${dados.length}</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Análise Técnica</small><div style="font-size:28px;">${analiseTecnicaEquip.length}</div><div>TAT: ${mediaTATAnalise} dias</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>Intervenção Técnica (Não Pendente)</small><div style="font-size:28px;">${intervencaoNaoPendente.length}</div><div>TAT: ${mediaTATIntervencao} dias</div></div><div style="background:#f8fafc;padding:15px;text-align:center;"><small>TAT Médio Total</small><div style="font-size:28px;">${mediaTATTotal} dias</div></div></div><h3>Detalhamento por Tipologia</h3>${cardsHTML}</body></html>`;
    
    const iframe = document.createElement('iframe'); iframe.style.cssText = 'position:absolute;width:0;height:0;'; document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document; doc.open(); doc.write(html); doc.close();
    iframe.contentWindow.onload = () => { iframe.contentWindow.print(); setTimeout(()=>document.body.removeChild(iframe),1000); };
    loading.remove();
}
