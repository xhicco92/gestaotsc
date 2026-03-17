function mostrarAbertos() {
    const conteudo = document.getElementById('conteudo');
    
    conteudo.innerHTML = `
        <div class="produtividade-header">
            <h2><i class="fas fa-folder-open"></i> OS Abertas - Área Técnica</h2>
            <div class="filtro-periodo">
                <button class="filtro-btn active">Todas</button>
                <button class="filtro-btn">Hoje</button>
                <button class="filtro-btn">Esta semana</button>
            </div>
        </div>
        
        <div class="cards-grid">
            <div class="stat-card warning">
                <i class="fas fa-clock stat-icon"></i>
                <span class="stat-label">Aguardando início</span>
                <div class="stat-value">12</div>
                <div class="stat-trend"><i class="fas fa-arrow-up"></i> +3 hoje</div>
            </div>
            <div class="stat-card info">
                <i class="fas fa-cog stat-icon"></i>
                <span class="stat-label">Em andamento</span>
                <div class="stat-value">8</div>
                <div class="stat-trend"><i class="fas fa-clock"></i> Média 2h</div>
            </div>
            <div class="stat-card positive">
                <i class="fas fa-check-circle stat-icon"></i>
                <span class="stat-label">Concluídas hoje</span>
                <div class="stat-value">5</div>
                <div class="stat-trend"><i class="fas fa-check"></i> 100% meta</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-exclamation-triangle stat-icon"></i>
                <span class="stat-label">Urgentes</span>
                <div class="stat-value">3</div>
                <div class="stat-trend"><i class="fas fa-arrow-up"></i> +2</div>
            </div>
        </div>
        
        <div class="graficos-container">
            <div class="grafico-card">
                <div class="grafico-header">
                    <h3>OS por prioridade</h3>
                </div>
                <div class="grafico-placeholder">
                    <i class="fas fa-chart-pie" style="font-size: 24px; margin-right: 10px;"></i>
                    Gráfico de distribuição
                </div>
            </div>
            <div class="grafico-card">
                <div class="grafico-header">
                    <h3>Técnicos disponíveis</h3>
                </div>
                <div class="tecnicos-list" style="margin-top: 0;">
                    <div class="tecnico-item">
                        <div class="tecnico-avatar">JC</div>
                        <div class="tecnico-info">
                            <div class="tecnico-nome">João Carlos</div>
                            <div class="tecnico-progresso">
                                <span class="tecnico-status" style="color: #10b981;">● Disponível</span>
                            </div>
                        </div>
                    </div>
                    <div class="tecnico-item">
                        <div class="tecnico-avatar">MA</div>
                        <div class="tecnico-info">
                            <div class="tecnico-nome">Maria Antônia</div>
                            <div class="tecnico-progresso">
                                <span class="tecnico-status" style="color: #f59e0b;">● Em OS</span>
                            </div>
                        </div>
                    </div>
                    <div class="tecnico-item">
                        <div class="tecnico-avatar">PS</div>
                        <div class="tecnico-info">
                            <div class="tecnico-nome">Pedro Santos</div>
                            <div class="tecnico-progresso">
                                <span class="tecnico-status" style="color: #10b981;">● Disponível</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function mostrarProdutividade() {
    const conteudo = document.getElementById('conteudo');
    
    conteudo.innerHTML = `
        <div class="produtividade-header">
            <h2><i class="fas fa-chart-line"></i> Dashboard de Produtividade</h2>
            <div class="filtro-periodo">
                <button class="filtro-btn" onclick="filtrarPeriodo('hoje')">Hoje</button>
                <button class="filtro-btn active" onclick="filtrarPeriodo('semana')">Semana</button>
                <button class="filtro-btn" onclick="filtrarPeriodo('mes')">Mês</button>
            </div>
        </div>
        
        <div class="cards-grid">
            <div class="stat-card positive">
                <i class="fas fa-check-circle stat-icon"></i>
                <span class="stat-label">OS Concluídas</span>
                <div class="stat-value" id="osCount">42</div>
                <div class="stat-trend"><i class="fas fa-arrow-up"></i> +12%</div>
            </div>
            <div class="stat-card info">
                <i class="fas fa-clock stat-icon"></i>
                <span class="stat-label">Horas Trabalhadas</span>
                <div class="stat-value" id="horasCount">245</div>
                <div class="stat-trend"><i class="fas fa-chart-line"></i> Média 8h/dia</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-tachometer-alt stat-icon"></i>
                <span class="stat-label">Produtividade Média</span>
                <div class="stat-value" id="produtividadeCount">85%</div>
                <div class="stat-trend"><i class="fas fa-arrow-up"></i> +5%</div>
            </div>
            <div class="stat-card warning">
                <i class="fas fa-users stat-icon"></i>
                <span class="stat-label">Técnicos Ativos</span>
                <div class="stat-value" id="tecnicosCount">6</div>
                <div class="stat-trend"><i class="fas fa-user-plus"></i> +2 esta semana</div>
            </div>
        </div>
        
        <div class="graficos-container">
            <div class="grafico-card">
                <div class="grafico-header">
                    <h3>Produtividade por Técnico</h3>
                    <select>
                        <option>Esta semana</option>
                        <option>Este mês</option>
                    </select>
                </div>
                <div class="grafico-placeholder">
                    <i class="fas fa-chart-bar" style="font-size: 24px; margin-right: 10px;"></i>
                    Gráfico de barras
                </div>
            </div>
            <div class="grafico-card">
                <div class="grafico-header">
                    <h3>Evolução Diária</h3>
                    <select>
                        <option>Últimos 7 dias</option>
                        <option>Últimos 30 dias</option>
                    </select>
                </div>
                <div class="grafico-placeholder">
                    <i class="fas fa-chart-line" style="font-size: 24px; margin-right: 10px;"></i>
                    Gráfico de linha
                </div>
            </div>
        </div>
        
        <div class="tecnicos-list">
            <h3>Desempenho dos Técnicos</h3>
            <div class="tecnico-item">
                <div class="tecnico-avatar">JC</div>
                <div class="tecnico-info">
                    <div class="tecnico-nome">João Carlos</div>
                    <div class="tecnico-progresso">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 85%"></div>
                        </div>
                        <span class="tecnico-valor">85%</span>
                    </div>
                </div>
            </div>
            <div class="tecnico-item">
                <div class="tecnico-avatar">MA</div>
                <div class="tecnico-info">
                    <div class="tecnico-nome">Maria Antônia</div>
                    <div class="tecnico-progresso">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 92%"></div>
                        </div>
                        <span class="tecnico-valor">92%</span>
                    </div>
                </div>
            </div>
            <div class="tecnico-item">
                <div class="tecnico-avatar">PS</div>
                <div class="tecnico-info">
                    <div class="tecnico-nome">Pedro Santos</div>
                    <div class="tecnico-progresso">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 78%"></div>
                        </div>
                        <span class="tecnico-valor">78%</span>
                    </div>
                </div>
            </div>
            <div class="tecnico-item">
                <div class="tecnico-avatar">AL</div>
                <div class="tecnico-info">
                    <div class="tecnico-nome">Ana Luísa</div>
                    <div class="tecnico-progresso">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 88%"></div>
                        </div>
                        <span class="tecnico-valor">88%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function filtrarPeriodo(periodo) {
    // Remove active de todos os botões
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adiciona active no botão clicado
    event.target.classList.add('active');
    
    // Atualiza os dados baseado no período
    const dados = {
        'hoje': { os: 8, horas: 64, prod: 82, tec: 4 },
        'semana': { os: 42, horas: 245, prod: 85, tec: 6 },
        'mes': { os: 168, horas: 980, prod: 79, tec: 6 }
    };
    
    if (document.getElementById('osCount')) {
        document.getElementById('osCount').textContent = dados[periodo].os;
        document.getElementById('horasCount').textContent = dados[periodo].horas;
        document.getElementById('produtividadeCount').textContent = dados[periodo].prod + '%';
        document.getElementById('tecnicosCount').textContent = dados[periodo].tec;
    }
}
