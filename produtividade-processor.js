class ProdutividadeProcessor {
    constructor() {
        this.dados = [];
        this.tecnicos = [];
        this.isLoading = false;
        this.progress = 0;
        this.indices = null;
    }

    async carregarDados(file, onProgress) {
        return new Promise((resolve, reject) => {
            this.isLoading = true;
            this.progress = 0;
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    
                    // Mostra progresso inicial
                    if (onProgress) onProgress(10, 'A ler ficheiro...');
                    
                    // Usa stream processing para ficheiros grandes
                    const workbook = XLSX.read(data, { 
                        type: 'binary',
                        cellDates: true, // Preserva datas
                        dense: false // Não usar modo denso para poupar memória
                    });
                    
                    if (onProgress) onProgress(30, 'Ficheiro lido, a processar...');
                    
                    const firstSheet = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheet];
                    
                    // Converte para JSON com opções de otimização
                    this.dados = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1, // Primeiro lê como array para ser mais rápido
                        defval: '', // Valor default para células vazias
                        blankrows: false // Ignora linhas em branco
                    });
                    
                    if (onProgress) onProgress(60, 'Dados convertidos, a processar linhas...');
                    
                    // Pega o cabeçalho (primeira linha)
                    const headers = this.dados[0] || [];
                    
                    // Converte para objetos (apenas linhas com dados)
                    const dadosObj = [];
                    for (let i = 1; i < this.dados.length; i++) {
                        const linha = this.dados[i];
                        if (!linha || linha.length === 0) continue;
                        
                        // Verifica se a linha tem algum valor
                        const temDados = linha.some(cell => cell !== undefined && cell !== null && cell !== '');
                        if (!temDados) continue;
                        
                        const obj = {};
                        headers.forEach((header, index) => {
                            if (header) { // Só cria propriedade se header existir
                                obj[header] = linha[index];
                            }
                        });
                        
                        dadosObj.push(obj);
                        
                        // Atualiza progresso a cada 1000 linhas
                        if (i % 1000 === 0 && onProgress) {
                            const percent = 60 + Math.floor((i / this.dados.length) * 30);
                            onProgress(percent, `A processar linha ${i} de ${this.dados.length}...`);
                        }
                    }
                    
                    this.dados = dadosObj;
                    
                    if (onProgress) onProgress(90, 'A extrair técnicos...');
                    
                    // Extrai técnicos de forma otimizada
                    const tecnicosSet = new Set();
                    const camposTecnico = this.detectarCamposTecnico(headers);
                    
                    this.dados.forEach(item => {
                        camposTecnico.forEach(campo => {
                            if (item[campo] && item[campo].toString().trim()) {
                                tecnicosSet.add(item[campo].toString().trim());
                            }
                        });
                    });
                    
                    this.tecnicos = Array.from(tecnicosSet);
                    
                    // Cria índices para busca rápida
                    this.criarIndices();
                    
                    if (onProgress) onProgress(100, 'Processamento concluído!');
                    this.isLoading = false;
                    
                    resolve(this.dados);
                    
                } catch (error) {
                    this.isLoading = false;
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                this.isLoading = false;
                reject(new Error('Erro ao ler ficheiro'));
            };
            
            reader.readAsBinaryString(file);
        });
    }

    // Detecta automaticamente campos que parecem ser de técnico
    detectarCamposTecnico(headers) {
        const palavrasChave = ['tecnico', 'técnico', 'responsavel', 'responsável', 'reparacao', 'reparação'];
        
        return headers.filter(header => {
            if (!header) return false;
            const headerLower = header.toString().toLowerCase();
            return palavrasChave.some(palavra => headerLower.includes(palavra));
        });
    }

    // Cria índices para busca mais rápida
    criarIndices() {
        this.indices = {
            porTecnico: {},
            porData: {},
            porPolo: {},
            porTipologia: {}
        };
        
        this.dados.forEach((item, index) => {
            // Índice por técnico
            const tecnico = item.tecnico_reparacao || item.Tecnico;
            if (tecnico) {
                if (!this.indices.porTecnico[tecnico]) {
                    this.indices.porTecnico[tecnico] = [];
                }
                this.indices.porTecnico[tecnico].push(index);
            }
            
            // Índice por data
            const data = this.getDataReparacao(item);
            if (data) {
                const dataKey = data.toISOString().split('T')[0];
                if (!this.indices.porData[dataKey]) {
                    this.indices.porData[dataKey] = [];
                }
                this.indices.porData[dataKey].push(index);
            }
            
            // Índice por polo
            const polo = item.polo || item.Polo;
            if (polo) {
                if (!this.indices.porPolo[polo]) {
                    this.indices.porPolo[polo] = [];
                }
                this.indices.porPolo[polo].push(index);
            }
            
            // Índice por tipologia
            const tipologia = item.tipologia;
            if (tipologia) {
                if (!this.indices.porTipologia[tipologia]) {
                    this.indices.porTipologia[tipologia] = [];
                }
                this.indices.porTipologia[tipologia].push(index);
            }
        });
    }

    // Versão otimizada de filtrarPorPeriodo
    filtrarPorPeriodo(periodo) {
        const hoje = new Date();
        const dataLimite = this.calcularDataLimite(periodo, hoje);
        
        return this.dados.filter(item => {
            const dataItem = this.getDataReparacao(item);
            return dataItem && dataItem >= dataLimite;
        });
    }

    calcularDataLimite(periodo, hoje) {
        switch(periodo) {
            case 'hoje':
                return new Date(hoje.setHours(0,0,0,0));
            case 'ontem':
                const ontem = new Date(hoje);
                ontem.setDate(ontem.getDate() - 1);
                return new Date(ontem.setHours(0,0,0,0));
            case 'semana':
                const semana = new Date(hoje);
                semana.setDate(semana.getDate() - 7);
                return semana;
            case 'mes':
                const mes = new Date(hoje);
                mes.setMonth(mes.getMonth() - 1);
                return mes;
            case 'trimestre':
                const trimestre = new Date(hoje);
                trimestre.setMonth(trimestre.getMonth() - 3);
                return trimestre;
            default:
                return new Date(0);
        }
    }

    getDataReparacao(item) {
        // Tenta diferentes formatos de data
        if (item['Dia Reparação'] && item['Mês Reparação'] && item['Ano Reparação']) {
            // Valida se os valores existem
            const dia = parseInt(item['Dia Reparação']);
            const mes = parseInt(item['Mês Reparação']) - 1;
            const ano = parseInt(item['Ano Reparação']);
            
            if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
                return new Date(ano, mes, dia);
            }
        }
        
        if (item.reparacao) {
            const data = new Date(item.reparacao);
            if (!isNaN(data.getTime())) {
                return data;
            }
        }
        
        return null;
    }

    calcularNumeroDias(periodo) {
        switch(periodo) {
            case 'hoje':
            case 'ontem':
                return 1;
            case 'semana':
                return 7;
            case 'mes':
                return 30;
            case 'trimestre':
                return 90;
            default:
                // Para períodos personalizados, calcula diferença
                if (periodo === 'personalizado' && this.dataInicio && this.dataFim) {
                    const diffTime = Math.abs(this.dataFim - this.dataInicio);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return diffDays;
                }
                return 1;
        }
    }

    // Calcula reparados por técnico
    calcularReparadosPorTecnico(dadosFiltrados) {
        const reparados = {};
        
        dadosFiltrados.forEach(item => {
            const tecnico = item.tecnico_reparacao || item.Tecnico || 'Não atribuído';
            if (tecnico && tecnico.toString().trim() !== '') {
                reparados[tecnico] = (reparados[tecnico] || 0) + 1;
            }
        });
        
        return reparados;
    }

    // Calcula estatísticas do período
    calcularEstatisticas(dadosFiltrados, periodo) {
        const reparados = this.calcularReparadosPorTecnico(dadosFiltrados);
        
        // Total de reparados no período
        const totalReparados = Object.values(reparados).reduce((sum, val) => sum + val, 0);
        
        // Número de dias no período
        const numeroDias = this.calcularNumeroDias(periodo);
        
        // Média diária
        const mediaDiaria = numeroDias > 0 ? totalReparados / numeroDias : 0;
        
        // Técnicos ativos (que repararam pelo menos 1)
        const tecnicosAtivos = Object.values(reparados).filter(v => v > 0).length;
        
        // Média por técnico ativo
        const mediaPorTecnico = tecnicosAtivos > 0 ? totalReparados / tecnicosAtivos : 0;
        
        return {
            reparados,
            totalReparados,
            mediaDiaria,
            mediaPorTecnico,
            tecnicosAtivos,
            numeroDias
        };
    }

    // Retorna lista de todas as tipologias únicas
    getTipologias() {
        const tipologias = new Set();
        
        this.dados.forEach(item => {
            if (item.tipologia && item.tipologia.trim() !== '') {
                tipologias.add(item.tipologia.trim());
            }
        });
        
        return Array.from(tipologias).sort();
    }

    // Retorna lista de todos os polos únicos
    getPolos() {
        const polos = new Set();
        
        this.dados.forEach(item => {
            const polo = item.polo || item.Polo;
            if (polo && polo.trim() !== '') {
                polos.add(polo.trim());
            }
        });
        
        return Array.from(polos).sort();
    }

    // Versão paginada para não sobrecarregar a UI
    getPaginaTecnicos(page = 1, pageSize = 50) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return this.tecnicos.slice(start, end);
    }

    getEstatisticasRapidas() {
        return {
            totalRegistos: this.dados.length,
            totalTecnicos: this.tecnicos.length,
            totalTipologias: this.getTipologias().length,
            tscSouth: this.indices?.porPolo?.['TSC SOUTH']?.length || 0,
            memoryUsage: this.estimarMemoria()
        };
    }

    estimarMemoria() {
        // Estimativa simples de memória usada
        try {
            const jsonSize = JSON.stringify(this.dados).length;
            const mbSize = (jsonSize / (1024 * 1024)).toFixed(2);
            return `${mbSize} MB`;
        } catch (e) {
            return 'N/A';
        }
    }

    // Função de debug
    debug() {
        console.log('=== DEBUG PRODUTIVIDADE PROCESSOR ===');
        console.log('Total registos:', this.dados.length);
        console.log('Total técnicos:', this.tecnicos.length);
        console.log('Tipologias:', this.getTipologias());
        console.log('Polos:', this.getPolos());
        console.log('Memória estimada:', this.estimarMemoria());
        
        if (this.dados.length > 0) {
            console.log('Exemplo primeiro registo:', this.dados[0]);
        }
    }
}
