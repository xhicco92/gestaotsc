// ============================================
// DASHBOARD CENTRO TÉCNICO - VERSÃO COMPLETA
// ============================================

const processor = new ProdutividadeProcessor();
const abertosProcessor = new AbertosProcessor();

// Estado atual dos filtros
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

// Variável para guardar os dados atuais do período
let dadosPeriodoAtual = [];

// ============================================
// ABA ABERTOS
// ============================================

function mostrarAbertos() {
    const html = `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">📋 OS Abertas - Área Técnica</h2>
                <button onclick="exportarAbertosPDF()" 
                        style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; transition: all 0.3s;"
                        onmouseover="this.style.transform='scale(1.05)'" 
                        onmouseout="this.style.transform='scale(1)'">
                    <span style="font-size: 18px;">📄</span>
                    Exportar PDF
                </button>
            </div>
            
            <!-- FILTROS -->
            <div style="background: #f8fafc; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    
                    <!-- FILTROS DE TIPOLOGIA (esquerda) -->
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
                        <!-- Tipologia -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 500; color: #475569; font-size: 14px;">🏷️ Tipologia:</span>
                            <select id="filtroTipologiaAbertos" onchange="onTipologiaAbertosChange(this.value)" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; min-width: 180px; font-size: 14px;">
                                <option value="todas">Todas as tipologias</option>
                                ${gerarOpcoesTipologiaAbertos()}
                            </select>
                        </div>
                        
                        <!-- SUB-FILTRO MOBILE (aparece apenas quando Mobile é selecionado) -->
                        <div id="mobileSubFiltroAbertosContainer" style="display: none; align-items: center; gap: 8px;">
                            <span style="font-weight: 500; color: #475569; font-size: 14px;">📱 Mobile:</span>
                            <select id="mobileTipoAbertos" onchange="aplicarFiltroMobileAbertos(this.value)" style="padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; min-width: 120px; font-size: 14px;">
                                <option value="todos">Todos</option>
                                <option value="cliente">Cliente</option>
                                <option value="dg">D&G</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- CARDS DE RESUMO -->
            <div class="cards" style="margin-bottom: 20px;">
                <div class="card">
                    <small>Total OS Abertas</small>
                    <strong id="totalAbertos">0</strong>
                </div>
                <div class="card">
                    <small>Em Análise</small>
                    <strong id="emAnalise">0</strong>
                </div>
                <div class="card">
                    <small>Aguardam Orçamento</small>
                    <strong id="aguardamOrcamento">0</strong>
                </div>
                <div class="card">
                    <small>Orçamento Aceite</small>
                    <strong id="orcamentoAceite">0</strong>
                </div>
            </div>
            
            <!-- INFORMAÇÃO DO FILTRO ATIVO -->
            <div id="infoFiltroAbertos" style="background: #e0f2fe; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 14px; color: #0369a1;">
                📍 Mostrando todas as tipologias
            </div>
            
            <!-- ÁREA DE CARTÕES POR TIPOLOGIA -->
            <div id="cardsTipologiasAbertos" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
                <!-- Os cards serão gerados dinamicamente -->
            </div>
            
            <!-- UPLOAD -->
            <div class="upload-area" id="uploadAreaAbertos">
                <span style="font-size: 48px;">📤</span>
                <h3 style="margin: 15px 0;">Carregar Ficheiro Excel</h3>
                <input type="file" id="fileInputAbertos" accept=".xlsx,.xls,.csv" style="display: none;">
                <button class="btn-upload" onclick="document.getElementById('fileInputAbertos').click()">
                    Selecionar Ficheiro
                </button>
                <div id="fileInfoAbertos" class="file-info"></div>
            </div>
        </div>
    `;
    
    document.getElementById('conteudo').innerHTML = html;
    
    setTimeout(() => {
        const input = document.getElementById('fileInputAbertos');
        if (input) {
            input.onchange = handleUploadAbertos;
        }
        
        // Se já há dados carregados, atualiza os cards
        if (abertosProcessor.dados && abertosProcessor.dados.length > 0) {
            atualizarCardsAbertos();
        }
    }, 100);
}

function gerarOpcoesTipologiaAbertos() {
    if (!abertosProcessor.dados || abertosProcessor.dados.length === 0) {
        return '';
    }
    
    const tipologias = abertosProcessor.getTipologiasAbertos();
    
    return tipologias.map(tipologia => 
        `<option value="${tipologia}">${tipologia}</option>`
    ).join('');
}

function onTipologiaAbertosChange(tipologia) {
    const mobileSubFiltro = document.getElementById('mobileSubFiltroAbertosContainer');
    
    if (tipologia === 'Mobile') {
        mobileSubFiltro.style.display = 'flex';
    } else {
        mobileSubFiltro.style.display = 'none';
        filtroAbertos.mobileTipo = 'todos';
        const mobileSelect = document.getElementById('mobileTipoAbertos');
        if (mobileSelect) mobileSelect.value = 'todos';
    }
    
    filtroAbertos.tipologia = tipologia;
    atualizarCardsAbertos();
    atualizarInfoFiltroAbertos();
}

function aplicarFiltroMobileAbertos(tipo) {
    filtroAbertos.mobileTipo = tipo;
    atualizarCardsAbertos();
    atualizarInfoFiltroAbertos();
}

function atualizarInfoFiltroAbertos() {
    const infoElement = document.getElementById('infoFiltroAbertos');
    let infoText = '';
    
    if (filtroAbertos.tipologia !== 'todas') {
        infoText = `📍 Tipologia: <strong>${filtroAbertos.tipologia}</strong>`;
        
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            const mobileTexto = filtroAbertos.mobileTipo === 'cliente' ? 'Cliente' : 'D&G';
            infoText += ` <span style="background: #2563eb20; padding: 2px 6px; border-radius: 12px;">${mobileTexto}</span>`;
        }
    } else {
        infoText = '📍 Mostrando todas as tipologias';
    }
    
    infoElement.innerHTML = infoText;
}

function atualizarCardsAbertos() {
    if (!abertosProcessor.dados || abertosProcessor.dados.length === 0) return;
    
    // Filtra os dados
    let dadosFiltrados = abertosProcessor.dados;
    
    if (filtroAbertos.tipologia !== 'todas') {
        dadosFiltrados = dadosFiltrados.filter(item => 
            item.tipologia && item.tipologia === filtroAbertos.tipologia
        );
        
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dadosFiltrados = dadosFiltrados.filter(item => {
                if (filtroAbertos.mobileTipo === 'dg') {
                    return item.tipo_garantia === 'Seguro D&G';
                } else if (filtroAbertos.mobileTipo === 'cliente') {
                    return item.tipo_garantia && item.tipo_garantia !== 'Seguro D&G';
                }
                return true;
            });
        }
    }
    
    // Calcula totais
    const totalAbertos = dadosFiltrados.length;
    const emAnalise = dadosFiltrados.filter(item => 
        item.resultado_analise_tecnica === 'Análise Técnica Concluída' || 
        !item.reparacao || item.reparacao === ''
    ).length;
    const aguardamOrcamento = dadosFiltrados.filter(item => 
        item.resultado_orcamento === 'Aguardar Orçamento' || 
        item.resultado_orcamento === 'Orçamento Pendente'
    ).length;
    const orcamentoAceite = dadosFiltrados.filter(item => 
        item.resultado_orcamento === 'Orçamento Aceite'
    ).length;
    
    // Atualiza cards de resumo
    document.getElementById('totalAbertos').textContent = totalAbertos;
    document.getElementById('emAnalise').textContent = emAnalise;
    document.getElementById('aguardamOrcamento').textContent = aguardamOrcamento;
    document.getElementById('orcamentoAceite').textContent = orcamentoAceite;
    
    // Gera cards por tipologia
    let tipologiasParaMostrar = abertosProcessor.getTipologiasAbertos();
    
    // Filtra tipologias se uma específica foi selecionada
    if (filtroAbertos.tipologia !== 'todas') {
        tipologiasParaMostrar = [filtroAbertos.tipologia];
    }
    
    const container = document.getElementById('cardsTipologiasAbertos');
    
    container.innerHTML = tipologiasParaMostrar.map(tipologia => {
        let dadosTipologia = abertosProcessor.dados.filter(item => 
            item.tipologia === tipologia
        );
        
        // Aplica sub-filtro Mobile se necessário
        if (tipologia === 'Mobile' && filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dadosTipologia = dadosTipologia.filter(item => {
                if (filtroAbertos.mobileTipo === 'dg') {
                    return item.tipo_garantia === 'Seguro D&G';
                } else if (filtroAbertos.mobileTipo === 'cliente') {
                    return item.tipo_garantia && item.tipo_garantia !== 'Seguro D&G';
                }
                return true;
            });
        } else if (tipologia === 'Mobile' && filtroAbertos.tipologia === 'todas') {
            // Se não há filtro de tipologia, mostra separado por Cliente e D&G
            const dadosCliente = dadosTipologia.filter(item => 
                item.tipo_garantia !== 'Seguro D&G'
            );
            const dadosDG = dadosTipologia.filter(item => 
                item.tipo_garantia === 'Seguro D&G'
            );
            
            return `
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; color: #1e293b;">📱 ${tipologia}</h3>
                        <span style="background: #2563eb; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;">Total: ${dadosTipologia.length}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: #f0f9ff; border-radius: 8px; padding: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                                <span style="font-size: 20px;">👥</span>
                                <strong>Cliente</strong>
                            </div>
                            <div style="font-size: 28px; font-weight: bold; color: #2563eb;">${dadosCliente.length}</div>
                        </div>
                        <div style="background: #fef3c7; border-radius: 8px; padding: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                                <span style="font-size: 20px;">🛡️</span>
                                <strong>D&G</strong>
                            </div>
                            <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${dadosDG.length}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Para outras tipologias ou quando Mobile já está filtrado
        return `
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #1e293b;">${getIconeTipologia(tipologia)} ${tipologia}</h3>
                    <span style="background: #2563eb; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;">Total: ${dadosTipologia.length}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <div>
                        <div style="color: #64748b; font-size: 12px;">Em Análise</div>
                        <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${dadosTipologia.filter(item => 
                            item.resultado_analise_tecnica === 'Análise Técnica Concluída' || 
                            !item.reparacao || item.reparacao === ''
                        ).length}</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 12px;">Aguardam Orçamento</div>
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${dadosTipologia.filter(item => 
                            item.resultado_orcamento === 'Aguardar Orçamento' || 
                            item.resultado_orcamento === 'Orçamento Pendente'
                        ).length}</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 12px;">Orçamento Aceite</div>
                        <div style="font-size: 24px; font-weight: bold; color: #10b981;">${dadosTipologia.filter(item => 
                            item.resultado_orcamento === 'Orçamento Aceite'
                        ).length}</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 12px;">% Aceitação</div>
                        <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${dadosTipologia.length > 0 ? 
                            Math.round(dadosTipologia.filter(item => item.resultado_orcamento === 'Orçamento Aceite').length / dadosTipologia.length * 100) : 0}%</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

async function handleUploadAbertos(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileInfo = document.getElementById('fileInfoAbertos');
    fileInfo.innerHTML = `📂 A processar ${file.name}...`;
    
    try {
        await abertosProcessor.carregarDados(file);
        
        // Esconde área de upload
        document.getElementById('uploadAreaAbertos').style.display = 'none';
        
        // Atualiza os cards
        atualizarCardsAbertos();
        
        fileInfo.innerHTML = `✅ ${file.name} carregado (${abertosProcessor.dados.length} registos)`;
        
    } catch (error) {
        fileInfo.innerHTML = `❌ Erro: ${error.message}`;
        console.error(error);
    }
}

// ============================================
// FUNÇÕES DE EXPORTAÇÃO PARA PDF (ABERTOS)
// ============================================

async function exportarAbertosPDF() {
    if (!abertosProcessor.dados || abertosProcessor.dados.length === 0) {
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
        
        const relatorioHTML = gerarHTMLRelatorioAbertos();
        
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

function gerarHTMLRelatorioAbertos() {
    const dataAtual = new Date().toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let dadosFiltrados = abertosProcessor.dados;
    
    if (filtroAbertos.tipologia !== 'todas') {
        dadosFiltrados = dadosFiltrados.filter(item => 
            item.tipologia && item.tipologia === filtroAbertos.tipologia
        );
        
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dadosFiltrados = dadosFiltrados.filter(item => {
                if (filtroAbertos.mobileTipo === 'dg') {
                    return item.tipo_garantia === 'Seguro D&G';
                } else if (filtroAbertos.mobileTipo === 'cliente') {
                    return item.tipo_garantia && item.tipo_garantia !== 'Seguro D&G';
                }
                return true;
            });
        }
    }
    
    const totalAbertos = dadosFiltrados.length;
    const emAnalise = dadosFiltrados.filter(item => 
        item.resultado_analise_tecnica === 'Análise Técnica Concluída' || 
        !item.reparacao || item.reparacao === ''
    ).length;
    const aguardamOrcamento = dadosFiltrados.filter(item => 
        item.resultado_orcamento === 'Aguardar Orçamento' || 
        item.resultado_orcamento === 'Orçamento Pendente'
    ).length;
    const orcamentoAceite = dadosFiltrados.filter(item => 
        item.resultado_orcamento === 'Orçamento Aceite'
    ).length;
    
    let filtrosTexto = [];
    if (filtroAbertos.tipologia !== 'todas') {
        let texto = `Tipologia: ${filtroAbertos.tipologia}`;
        if (filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            texto += ` (${filtroAbertos.mobileTipo === 'cliente' ? 'Cliente' : 'D&G'})`;
        }
        filtrosTexto.push(texto);
    }
    const filtrosAtivosTexto = filtrosTexto.length > 0 ? filtrosTexto.join(' | ') : 'Nenhum filtro adicional';
    
    let tipologiasParaMostrar = abertosProcessor.getTipologiasAbertos();
    if (filtroAbertos.tipologia !== 'todas') {
        tipologiasParaMostrar = [filtroAbertos.tipologia];
    }
    
    const cardsHTML = tipologiasParaMostrar.map(tipologia => {
        let dadosTipologia = abertosProcessor.dados.filter(item => 
            item.tipologia === tipologia
        );
        
        if (tipologia === 'Mobile' && filtroAbertos.tipologia === 'Mobile' && filtroAbertos.mobileTipo !== 'todos') {
            dadosTipologia = dadosTipologia.filter(item => {
                if (filtroAbertos.mobileTipo === 'dg') {
                    return item.tipo_garantia === 'Seguro D&G';
                } else if (filtroAbertos.mobileTipo === 'cliente') {
                    return item.tipo_garantia && item.tipo_garantia !== 'Seguro D&G';
                }
                return true;
            });
        }
        
        if (tipologia === 'Mobile' && filtroAbertos.tipologia === 'todas') {
            const dadosCliente = dadosTipologia.filter(item => 
                item.tipo_garantia !== 'Seguro D&G'
            );
            const dadosDG = dadosTipologia.filter(item => 
                item.tipo_garantia === 'Seguro D&G'
            );
            
            return `
                <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0 0 15px 0;">📱 ${tipologia}</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px;">
                            <strong>Cliente</strong>
                            <div style="font-size: 32px; font-weight: bold; margin-top: 10px;">${dadosCliente.length}</div>
                        </div>
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                            <strong>D&G</strong>
                            <div style="font-size: 32px; font-weight: bold; margin-top: 10px;">${dadosDG.length}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 15px 0;">${getIconeTipologia(tipologia)} ${tipologia}</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                    <div>
                        <div style="color: #64748b;">Em Análise</div>
                        <div style="font-size: 24px; font-weight: bold;">${dadosTipologia.filter(item => 
                            item.resultado_analise_tecnica === 'Análise Técnica Concluída' || 
                            !item.reparacao || item.reparacao === ''
                        ).length}</div>
                    </div>
                    <div>
                        <div style="color: #64748b;">Aguardam Orçamento</div>
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${dadosTipologia.filter(item => 
                            item.resultado_orcamento === 'Aguardar Orçamento' || 
                            item.resultado_orcamento === 'Orçamento Pendente'
                        ).length}</div>
                    </div>
                    <div>
                        <div style="color: #64748b;">Orçamento Aceite</div>
                        <div style="font-size: 24px; font-weight: bold; color: #10b981;">${dadosTipologia.filter(item => 
                            item.resultado_orcamento === 'Orçamento Aceite'
                        ).length}</div>
                    </div>
                    <div>
                        <div style="color: #64748b;">% Aceitação</div>
                        <div style="font-size: 24px; font-weight: bold;">${dadosTipologia.length > 0 ? 
                            Math.round(dadosTipologia.filter(item => item.resultado_orcamento === 'Orçamento Aceite').length / dadosTipologia.length * 100) : 0}%</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Relatório de OS Abertas - Centro Técnico</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                padding: 40px;
                color: #1e293b;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #2563eb;
            }
            .header h1 {
                color: #1e293b;
                margin-bottom: 10px;
            }
            .info-section {
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .info-card {
                background: white;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                text-align: center;
            }
            .info-card small {
                color: #64748b;
                font-size: 12px;
            }
            .info-card strong {
                display: block;
                font-size: 28px;
                color: #2563eb;
                margin-top: 5px;
            }
            .filtros-info {
                background: #e0f2fe;
                padding: 12px;
                border-radius: 6px;
                font-size: 14px;
                color: #0369a1;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
            }
            @media print {
                body { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📋 Relatório de OS Abertas</h1>
            <p>Centro Técnico - Gerado em ${dataAtual}</p>
        </div>
        
        <div class="info-section">
            <div class="info-grid">
                <div class="info-card">
                    <small>Total OS Abertas</small>
                    <strong>${totalAbertos}</strong>
                </div>
                <div class="info-card">
                    <small>Em Análise</small>
                    <strong>${emAnalise}</strong>
                </div>
                <div class="info-card">
                    <small>Aguardam Orçamento</small>
                    <strong>${aguardamOrcamento}</strong>
                </div>
                <div class="info-card">
                    <small>Orçamento Aceite</small>
                    <strong>${orcamentoAceite}</strong>
                </div>
            </div>
            
            <div class="filtros-info">
                <strong>🔍 Filtros aplicados:</strong> ${filtrosAtivosTexto}
            </div>
        </div>
        
        <h3>📊 Detalhamento por Tipologia</h3>
        ${cardsHTML}
        
        <div class="footer">
            <p>Relatório gerado automaticamente pelo Dashboard Centro Técnico</p>
        </div>
    </body>
    </html>`;
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard iniciado - Versão completa com Abertos e Produtividade');
    
    const btnAbertos = document.getElementById('btnAbertos');
    const btnProd = document.getElementById('btnProdutividade');
    
    if (btnAbertos) {
        btnAbertos.addEventListener('click', () => {
            btnAbertos.classList.add('ativo');
            btnProd.classList.remove('ativo');
            mostrarAbertos();
        });
    }
    
    if (btnProd) {
        btnProd.addEventListener('click', () => {
            btnProd.classList.add('ativo');
            btnAbertos.classList.remove('ativo');
            mostrarProdutividade();
        });
    }
    
    mostrarAbertos();
});
