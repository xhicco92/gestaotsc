// ============================================
// DASHBOARD CENTRO TÉCNICO - VERSÃO SIMPLIFICADA
// ============================================

// Variável global para o processador de dados
const prodProcessor = new ProdutividadeProcessor();

// ============================================
// FUNÇÃO PRINCIPAL - MOSTRAR PRODUTIVIDADE
// ============================================

function mostrarProdutividade() {
    const conteudo = document.getElementById('conteudo');
    
    // HTML mais simples e direto
    conteudo.innerHTML = `
        <div style="padding: 20px;">
            <h2 style="margin-bottom: 20px;">📊 Produtividade dos Técnicos</h2>
            
            <!-- FILTROS -->
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="filtro-btn active" onclick="filtrarProd('hoje', this)">Hoje</button>
                <button class="filtro-btn" onclick="filtrarProd('ontem', this)">Ontem</button>
                <button class="filtro-btn" onclick="filtrarProd('semana', this)">7 dias</button>
                <button class="filtro-btn" onclick="filtrarProd('mes', this)">30 dias</button>
                <button class="filtro-btn" onclick="filtrarProd('trimestre', this)">90 dias</button>
            </div>
            
            <!-- CARDS DE RESUMO -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <small>Total Reparados</small>
                    <strong id="totalRep" style="display: block; font-size: 24px;">0</strong>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <small>Média Diária</small>
                    <strong id="mediaDia" style="display: block; font-size: 24px;">0</strong>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <small>Técnicos Ativos</small>
                    <strong id="tecAtivos" style="display: block; font-size: 24px;">0</strong>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                    <small>Média/Técnico</small>
                    <strong id="mediaTec" style="display: block; font-size: 24px;">0</strong>
                </div>
            </div>
            
            <!-- TABELA -->
            <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px;">Reparados por Técnico</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 10px; text-align: left;">Técnico</th>
                            <th style="padding: 10px; text-align: left;">Quantidade</th>
                            <th style="padding: 10px; text-align: left;">Média/Dia</th>
                        </tr>
                    </thead>
                    <tbody id="tabelaTecnicos">
                        <tr>
                            <td colspan="3" style="padding: 30px; text-align: center; color: #666;">
                                Carregue um ficheiro Excel para ver os dados
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- ÁREA DE UPLOAD - SIMPLES E VISÍVEL -->
            <div style="border: 2px dashed #2563eb; border-radius: 8px; padding: 30px; text-align: center; background: #f0f9ff;">
                <h3 style="color: #2563eb; margin-bottom: 15px;">📤 Carregar Ficheiro Excel</h3>
                <p style="margin-bottom: 20px; color: #666;">Selecione o ficheiro com os dados dos técnicos</p>
                
                <input type="file" id="fileInput" accept=".xlsx, .xls, .csv" style="display: none;">
                
                <button onclick="document.getElementById('fileInput').click()" 
                        style="background: #2563eb; color: white; border: none; padding: 12px 30px; 
                               border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold;">
                    Selecionar Ficheiro
                </button>
                
                <div id="fileInfo" style="margin-top: 15px; color: #059669; font-weight: bold;"></div>
            </div>
        </div>
    `;

    // Adiciona o evento ao input file
    setTimeout(() => {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUploadSimplificado);
            console.log('✅ Input file configurado');
        } else {
            console.error('❌ Input file não encontrado');
        }
    }, 100);
}

// ============================================
// HANDLE DO UPLOAD - VERSÃO SIMPLIFICADA
// ============================================

async function handleFileUploadSimplificado(evento) {
    const file = evento.target.files[0];
    
    if (!file) {
        alert('Nenhum ficheiro selecionado');
        return;
    }
    
    // Mostra nome do ficheiro
    const fileInfo = document.getElementById('fileInfo');
    if (fileInfo) {
        fileInfo.innerHTML = `✓ Ficheiro carregado: ${file.name}`;
    }
    
    // Mostra loading
    alert('A processar ficheiro... Aguarde');
    
    try {
        // Carrega os dados
        await prodProcessor.carregarDados(file);
        
        // Mostra mensagem de sucesso
        alert(`✅ Ficheiro processado! ${prodProcessor.dados.length} registos encontrados.`);
        
        // Carrega dados de hoje
        const dadosHoje = prodProcessor.filtrarPorPeriodo('hoje');
        const stats = prodProcessor.calcularEstatisticas(dadosHoje, 'hoje');
        
        // Atualiza a interface
        atualizarInterface(stats);
        
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao processar: ' + error.message);
    }
}

// ============================================
// FILTRAR PRODUTIVIDADE
// ============================================

function filtrarProd(periodo, botao) {
    // Verifica se há dados
    if (!prodProcessor.dados || prodProcessor.dados.length === 0) {
        alert('Carregue um ficheiro primeiro!');
        return;
    }
    
    // Atualiza botões
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    botao.classList.add('active');
    
    // Filtra e atualiza
    const dadosFiltrados = prodProcessor.filtrarPorPeriodo(periodo);
    const stats = prodProcessor.calcularEstatisticas(dadosFiltrados, periodo);
    atualizarInterface(stats);
}

// ============================================
// ATUALIZAR INTERFACE
// ============================================

function atualizarInterface(stats) {
    // Atualiza cards
    document.getElementById('totalRep').textContent = stats.totalReparados;
    document.getElementById('mediaDia').textContent = stats.mediaDiaria.toFixed(1);
    document.getElementById('tecAtivos').textContent = stats.tecnicosAtivos;
    document.getElementById('mediaTec').textContent = stats.mediaPorTecnico.toFixed(1);
    
    // Atualiza tabela
    const tbody = document.getElementById('tabelaTecnicos');
    
    if (stats.totalReparados === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="padding: 20px; text-align: center; color: #666;">
                    Nenhum reparado neste período
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordena técnicos por quantidade
    const tecnicosOrdenados = Object.entries(stats.reparados)
        .filter(([_, qtd]) => qtd > 0)
        .sort((a, b) => b[1] - a[1]);
    
    tbody.innerHTML = tecnicosOrdenados.map(([tecnico, qtd]) => {
        const media = (qtd / stats.numeroDias).toFixed(1);
        return `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>${tecnico}</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${qtd}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${media}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// MOSTRAR ABERTOS (SIMPLIFICADO)
// ============================================

function mostrarAbertos() {
    const conteudo = document.getElementById('conteudo');
    conteudo.innerHTML = `
        <div style="padding: 40px; text-align: center;">
            <span style="font-size: 48px;">📋</span>
            <h2 style="margin: 20px 0;">Área Técnica - OS Abertas</h2>
            <p style="color: #666;">Funcionalidade em desenvolvimento</p>
        </div>
    `;
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard iniciado');
    
    // Botões do menu
    const btnAbertos = document.getElementById('btnAbertos');
    const btnProd = document.getElementById('btnProdutividade');
    
    if (btnAbertos) {
        btnAbertos.addEventListener('click', function() {
            document.querySelectorAll('.botao-menu').forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            mostrarAbertos();
        });
    }
    
    if (btnProd) {
        btnProd.addEventListener('click', function() {
            document.querySelectorAll('.botao-menu').forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            mostrarProdutividade();
        });
    }
    
    // Inicia com a página de abertos
    if (btnAbertos) {
        btnAbertos.click();
    }
});
