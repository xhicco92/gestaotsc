// ============================================
// DASHBOARD CENTRO TÉCNICO - SIMPLIFICADO
// ============================================

const processor = new ProdutividadeProcessor();

function mostrarAbertos() {
    document.getElementById('conteudo').innerHTML = `
        <div style="text-align: center; padding: 50px;">
            <span style="font-size: 48px;">📋</span>
            <h2 style="margin: 20px 0;">Área Técnica - OS Abertas</h2>
            <p style="color: #666;">Em desenvolvimento</p>
        </div>
    `;
}

function mostrarProdutividade() {
    const html = `
        <div>
            <h2 style="margin-bottom: 20px;">📊 Produtividade dos Técnicos</h2>
            
            <!-- FILTROS -->
            <div class="filtros">
                <button class="filtro-btn active" onclick="filtrar('hoje', this)">Hoje</button>
                <button class="filtro-btn" onclick="filtrar('ontem', this)">Ontem</button>
                <button class="filtro-btn" onclick="filtrar('semana', this)">7 dias</button>
                <button class="filtro-btn" onclick="filtrar('mes', this)">30 dias</button>
                <button class="filtro-btn" onclick="filtrar('trimestre', this)">90 dias</button>
            </div>
            
            <!-- CARDS -->
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
            
            <!-- TABELA -->
            <div style="margin: 20px 0;">
                <h3 style="margin-bottom: 10px;">Reparados por Técnico</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Técnico</th>
                            <th>Quantidade</th>
                            <th>Média/Dia</th>
                        </tr>
                    </thead>
                    <tbody id="tabela">
                        <tr>
                            <td colspan="3" style="text-align: center; padding: 30px;">
                                Carregue um ficheiro para começar
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- UPLOAD -->
            <div class="upload-area">
                <span style="font-size: 48px;">📤</span>
                <h3 style="margin: 15px 0;">Carregar Ficheiro Excel</h3>
                <p style="color: #666; margin-bottom: 15px;">Selecione o ficheiro com os dados</p>
                
                <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" style="display: none;">
                
                <button class="btn-upload" onclick="document.getElementById('fileInput').click()">
                    Selecionar Ficheiro
                </button>
                
                <div id="fileInfo" class="file-info"></div>
            </div>
        </div>
    `;
    
    document.getElementById('conteudo').innerHTML = html;
    
    // Configurar upload
    setTimeout(() => {
        const input = document.getElementById('fileInput');
        if (input) {
            input.onchange = handleUpload;
            console.log('Upload configurado');
        }
    }, 100);
}

// Handle do upload
async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    document.getElementById('fileInfo').innerHTML = `Carregando: ${file.name}`;
    
    try {
        await processor.carregarDados(file);
        document.getElementById('fileInfo').innerHTML = `✓ ${file.name} carregado (${processor.dados.length} registos)`;
        filtrar('hoje', document.querySelector('.filtro-btn.active'));
    } catch (error) {
        document.getElementById('fileInfo').innerHTML = `❌ Erro: ${error.message}`;
    }
}

// Filtrar dados
function filtrar(periodo, botao) {
    if (!processor.dados || processor.dados.length === 0) {
        alert('Carregue um ficheiro primeiro!');
        return;
    }
    
    // Atualizar botões
    document.querySelectorAll('.filtro-btn').forEach(btn => btn.classList.remove('active'));
    botao.classList.add('active');
    
    // Processar dados
    const dados = processor.filtrarPorPeriodo(periodo);
    const stats = processor.calcularEstatisticas(dados, periodo);
    
    // Atualizar cards
    document.getElementById('totalRep').textContent = stats.totalReparados;
    document.getElementById('mediaDia').textContent = stats.mediaDiaria.toFixed(1);
    document.getElementById('tecAtivos').textContent = stats.tecnicosAtivos;
    document.getElementById('mediaTec').textContent = stats.mediaPorTecnico.toFixed(1);
    
    // Atualizar tabela
    const tabela = document.getElementById('tabela');
    
    if (stats.totalReparados === 0) {
        tabela.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">Nenhum reparado neste período</td></tr>';
        return;
    }
    
    const tecnicos = Object.entries(stats.reparados)
        .filter(([_, qtd]) => qtd > 0)
        .sort((a, b) => b[1] - a[1]);
    
    tabela.innerHTML = tecnicos.map(([tecnico, qtd]) => {
        const media = (qtd / stats.numeroDias).toFixed(1);
        return `
            <tr>
                <td><strong>${tecnico}</strong></td>
                <td>${qtd}</td>
                <td>${media}</td>
            </tr>
        `;
    }).join('');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard iniciado');
    
    const btnAbertos = document.getElementById('btnAbertos');
    const btnProd = document.getElementById('btnProdutividade');
    
    btnAbertos.addEventListener('click', () => {
        btnAbertos.classList.add('ativo');
        btnProd.classList.remove('ativo');
        mostrarAbertos();
    });
    
    btnProd.addEventListener('click', () => {
        btnProd.classList.add('ativo');
        btnAbertos.classList.remove('ativo');
        mostrarProdutividade();
    });
    
    // Começar com abertos
    mostrarAbertos();
});
