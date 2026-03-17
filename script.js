// Função para formatar a data atual (IGUAL AO EXEMPLO)
function atualizarData() {
    const hoje = new Date();
    const opcoes = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const dataFormatada = hoje.toLocaleDateString('pt-PT', opcoes).split('/').reverse().join('/');
    document.getElementById('dataAtual').textContent = `📅 ${dataFormatada}`;
}

// CONTEÚDO DA PRODUTIVIDADE (igual ao layout do link)
function carregarProdutividade() {
    return `
        <!-- Cards de métricas superiores -->
        <div class="metricas-superiores">
            <div class="card-metrica">
                <div class="rotulo"><span class="material-icons">inventory</span> Total Análises</div>
                <div class="valor">-</div>
            </div>
            <div class="card-metrica">
                <div class="rotulo"><span class="material-icons">schedule</span> TAT Médio</div>
                <div class="valor">- dias</div>
            </div>
            <div class="card-metrica">
                <div class="rotulo"><span class="material-icons">check_circle</span> % Sucesso</div>
                <div class="valor">- %</div>
            </div>
            <div class="card-metrica">
                <div class="rotulo"><span class="material-icons">attach_money</span> Orçamentos</div>
                <div class="valor">-</div>
            </div>
            <div class="card-metrica">
                <div class="rotulo"><span class="material-icons">hourglass_empty</span> Aguarda</div>
                <div class="valor">-</div>
            </div>
        </div>

        <!-- SECÇÃO: Mobile Cliente -->
        <div class="seccao-categoria">
            <div class="titulo-categoria">
                <span class="material-icons">smartphone</span> Mobile Cliente
                <span class="badge-contador">0</span>
            </div>
            <div class="subcategoria-grid">
                <!-- G Garantias -->
                <div class="subcategoria-card">
                    <div class="subcategoria-titulo">G Garantias <small>0</small></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">science</span> Análises</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">build</span> Reparação</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">pending</span> Rep. Pendente Peça</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">handyman</span> Rep. Não Pendente Peça</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">schedule</span> TAT Aberto</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">request_quote</span> Orçamento</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">thumb_up</span> Ag Aceitação Orçamento</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">credit_score</span> Débitos WSS</span> <span class="valor-metrica">0</span></div>
                </div>
                <!-- FG Fora de Garantia -->
                <div class="subcategoria-card">
                    <div class="subcategoria-titulo">FG Fora de Garantia <small>0</small></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">science</span> Análises</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">build</span> Reparação</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">pending</span> Rep. Pendente Peça</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">handyman</span> Rep. Não Pendente Peça</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">schedule</span> TAT Aberto</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">request_quote</span> Orçamento</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">thumb_up</span> Ag Aceitação Orçamento</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">credit_score</span> Débitos WSS</span> <span class="valor-metrica">0</span></div>
                </div>
                <!-- EG Extensão de Garantia -->
                <div class="subcategoria-card">
                    <div class="subcategoria-titulo">EG Extensão de Garantia <small>0</small></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">science</span> Análises</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">build</span> Reparação</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">pending</span> Rep. Pendente Peça</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">handyman</span> Rep. Não Pendente Peça</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">schedule</span> TAT Aberto</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">request_quote</span> Orçamento</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">thumb_up</span> Ag Aceitação Orçamento</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">credit_score</span> Débitos WSS</span> <span class="valor-metrica">0</span></div>
                </div>
            </div>
        </div>

        <!-- SECÇÃO: Mobile D&G -->
        <div class="seccao-categoria">
            <div class="titulo-categoria">
                <span class="material-icons">smartphone</span> Mobile D&G
                <span class="badge-contador">0</span>
            </div>
            <div class="subcategoria-grid">
                <div class="subcategoria-card">
                    <div class="subcategoria-titulo">D&G <small>0</small></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">science</span> Análises</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">build</span> Reparação</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">pending</span> Rep. Pendente Peça</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">handyman</span> Rep. Não Pendente Peça</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">schedule</span> TAT Aberto</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">request_quote</span> Orçamento</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">thumb_up</span> Ag Aceitação Orçamento</span> <span class="valor-metrica">0</span></div>
                    <div class="linha-metrica"><span class="label"><span class="material-icons">credit_score</span> Débitos WSS</span> <span class="valor-metrica">0</span></div>
                </div>
            </div>
        </div>

        <!-- Nota: Por brevidade, incluí apenas as secções "Mobile Cliente" e "Mobile D&G" 
        Para ter o layout completo, basta seguir o mesmo padrão para as restantes categorias (Informática, Pequenos Domésticos, etc.) -->
    `;
}

function carregarAbertos() {
    return `<div style="background: white; padding: 40px; border-radius: 16px; text-align: center; color: #475569;">
        <span class="material-icons" style="font-size: 3rem; color: #94a3b8;">folder_open</span>
        <h2 style="margin: 20px 0;">Área Técnica - OS Abertas</h2>
        <p>Conteúdo em desenvolvimento. Aqui serão listadas as Ordens de Serviço abertas.</p>
    </div>`;
}

// Navegação e troca de conteúdo
document.addEventListener('DOMContentLoaded', function() {
    atualizarData();

    const btnAbertos = document.getElementById('btnAbertos');
    const btnProdutividade = document.getElementById('btnProdutividade');
    const conteudoDiv = document.getElementById('conteudo');

    function setActiveButton(activeBtn) {
        [btnAbertos, btnProdutividade].forEach(btn => btn.classList.remove('ativo'));
        activeBtn.classList.add('ativo');
    }

    btnAbertos.addEventListener('click', function() {
        setActiveButton(this);
        conteudoDiv.innerHTML = carregarAbertos();
    });

    btnProdutividade.addEventListener('click', function() {
        setActiveButton(this);
        conteudoDiv.innerHTML = carregarProdutividade();
    });

    // Carrega "Abertos" por padrão ao iniciar
    btnAbertos.click();
});
