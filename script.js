function mostrarAbertos() {
    document.getElementById('conteudo').innerHTML = `
        <div class="abertos-container">
            <h2>📋 ABERTOS - ÁREA TÉCNICA</h2>
            <p>Lista de OS abertas será exibida aqui</p>
        </div>
    `;
}

function mostrarProdutividade() {
    document.getElementById('conteudo').innerHTML = `
        <div class="produtividade-container">
            <h2>⚡ PRODUTIVIDADES</h2>
            
            <div class="filtros">
                <select id="periodo" onchange="filtrarPeriodo()">
                    <option value="hoje">Hoje</option>
                    <option value="semana" selected>Esta Semana</option>
                    <option value="mes">Este Mês</option>
                </select>
            </div>
            
            <div class="cards">
                <div class="card">
                    <h3>OS Concluídas</h3>
                    <p class="valor" id="osConcluidas">0</p>
                </div>
                <div class="card">
                    <h3>Horas Trabalhadas</h3>
                    <p class="valor" id="horasTrabalhadas">0</p>
                </div>
                <div class="card">
                    <h3>Produtividade</h3>
                    <p class="valor" id="produtividade">0%</p>
                </div>
                <div class="card">
                    <h3>Técnicos Ativos</h3>
                    <p class="valor" id="tecnicosAtivos">0</p>
                </div>
            </div>
            
            <div class="graficos">
                <div class="grafico">
                    <h3>Produtividade por Técnico</h3>
                    <div class="placeholder">Gráfico 1</div>
                </div>
                <div class="grafico">
                    <h3>Evolução Diária</h3>
                    <div class="placeholder">Gráfico 2</div>
                </div>
            </div>
        </div>
    `;
    
    // Atualiza os dados iniciais
    atualizarDados('semana');
}

function filtrarPeriodo() {
    var periodo = document.getElementById('periodo').value;
    atualizarDados(periodo);
}

function atualizarDados(periodo) {
    // Dados simulados (depois substituir pelos reais)
    var dados = {
        'hoje': { os: 5, horas: 32, prod: 78, tec: 4 },
        'semana': { os: 42, horas: 245, prod: 85, tec: 6 },
        'mes': { os: 168, horas: 980, prod: 79, tec: 6 }
    };
    
    document.getElementById('osConcluidas').textContent = dados[periodo].os;
    document.getElementById('horasTrabalhadas').textContent = dados[periodo].horas;
    document.getElementById('produtividade').textContent = dados[periodo].prod + '%';
    document.getElementById('tecnicosAtivos').textContent = dados[periodo].tec;
}
