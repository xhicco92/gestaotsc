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
                    
                    if (onProgress) onProgress(10, 'A ler ficheiro...');
                    
                    const workbook = XLSX.read(data, { 
                        type: 'binary',
                        cellDates: true,
                        dense: false
                    });
                    
                    if (onProgress) onProgress(30, 'Ficheiro lido, a processar...');
                    
                    const firstSheet = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheet];
                    
                    this.dados = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        defval: '',
                        blankrows: false
                    });
                    
                    if (onProgress) onProgress(60, 'Dados convertidos, a processar linhas...');
                    
                    const headers = this.dados[0] || [];
                    
                    const dadosObj = [];
                    for (let i = 1; i < this.dados.length; i++) {
                        const linha = this.dados[i];
                        if (!linha || linha.length === 0) continue;
                        
                        const temDados = linha.some(cell => cell !== undefined && cell !== null && cell !== '');
                        if (!temDados) continue;
                        
                        const obj = {};
                        headers.forEach((header, index) => {
                            if (header) {
                                obj[header] = linha[index];
                            }
                        });
                        
                        dadosObj.push(obj);
                        
                        if (i % 1000 === 0 && onProgress) {
                            const percent = 60 + Math.floor((i / this.dados.length) * 30);
                            onProgress(percent, `A processar linha ${i} de ${this.dados.length}...`);
                        }
                    }
                    
                    this.dados = dadosObj;
                    
                    if (onProgress) onProgress(90, 'A filtrar dados...');
                    
                    // Exclui registos com "Orçamento Rejeitado"
                    const totalAntes = this.dados.length;
                    this.dados = this.dados.filter(item => {
                        const resultadoOrcamento = item.resultado_orcamento || '';
                        return resultadoOrcamento !== 'Orçamento Rejeitado';
                    });
                    
                    console.log(`Registos removidos por "Orçamento Rejeitado": ${totalAntes - this.dados.length}`);
                    console.log(`Registos mantidos: ${this.dados.length}`);
                    
                    // Extrai técnicos
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

    detectarCamposTecnico(headers) {
        const palavrasChave = ['tecnico', 'técnico', 'responsavel', 'responsável', 'reparacao', 'reparação'];
        
        return headers.filter(header => {
            if (!header) return false;
            const headerLower = header.toString().toLowerCase();
            return palavrasChave.some(palavra => headerLower.includes(palavra));
        });
    }

    criarIndices() {
        this.indices = {
            porTecnico: {},
            porData: {},
            porPolo: {},
            porTipologia: {}
        };
        
        this.dados.forEach((item, index) => {
            const tecnico = item.tecnico_reparacao || item.Tecnico;
            if (tecnico) {
                if (!this.indices.porTecnico[tecnico]) {
                    this.indices.porTecnico[tecnico] = [];
                }
                this.indices.porTecnico[tecnico].push(index);
            }
            
            const data = this.getDataReparacao(item);
            if (data) {
                const dataKey = data.toISOString().split('T')[0];
                if (!this.indices.porData[dataKey]) {
                    this.indices.porData[dataKey] = [];
                }
                this.indices.porData[dataKey].push(index);
            }
            
            const polo = item.polo || item.Polo;
            if (polo) {
                if (!this.indices.porPolo[polo]) {
                    this.indices.porPolo[polo] = [];
                }
                this.indices.porPolo[polo].push(index);
            }
            
            const tipologia = item.tipologia;
            if (tipologia) {
                if (!this.indices.porTipologia[tipologia]) {
                    this.indices.porTipologia[tipologia] = [];
                }
                this.indices.porTipologia[tipologia].push(index);
            }
        });
    }

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
        if (item['Dia Reparação'] && item['Mês Reparação'] && item['Ano Reparação']) {
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
                if (periodo === 'personalizado' && this.dataInicio && this.dataFim) {
                    const diffTime = Math.abs(this.dataFim - this.dataInicio);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return diffDays;
                }
                return 1;
        }
    }

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

    // NOVO: Calcula quantos dias diferentes têm registo no período
    calcularDiasComRegisto(dadosFiltrados) {
        const diasSet = new Set();
        
        dadosFiltrados.forEach(item => {
            const dataItem = this.getDataReparacao(item);
            if (dataItem) {
                const chaveDia = dataItem.toISOString().split('T')[0];
                diasSet.add(chaveDia);
            }
        });
        
        return diasSet.size;
    }

    calcularEstatisticas(dadosFiltrados, periodo) {
        const reparados = this.calcularReparadosPorTecnico(dadosFiltrados);
        const totalReparados = Object.values(reparados).reduce((sum, val) => sum + val, 0);
        
        // Número de dias em que houve pelo menos 1 registo
        const diasComRegisto = this.calcularDiasComRegisto(dadosFiltrados);
        
        // Média baseada nos dias com registo
        const mediaDiaria = diasComRegisto > 0 ? totalReparados / diasComRegisto : 0;
        
        const tecnicosAtivos = Object.values(reparados).filter(v => v > 0).length;
        const mediaPorTecnico = tecnicosAtivos > 0 ? totalReparados / tecnicosAtivos : 0;
        
        return {
            reparados,
            totalReparados,
            mediaDiaria,
            mediaPorTecnico,
            tecnicosAtivos,
            numeroDias: diasComRegisto,      // Dias com registo
            totalDiasPeriodo: this.calcularNumeroDias(periodo)  // Total de dias do período
        };
    }

    getTipologias() {
        const tipologias = new Set();
        
        this.dados.forEach(item => {
            if (item.tipologia && item.tipologia.trim() !== '') {
                tipologias.add(item.tipologia.trim());
            }
        });
        
        return Array.from(tipologias).sort();
    }

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
        try {
            const jsonSize = JSON.stringify(this.dados).length;
            const mbSize = (jsonSize / (1024 * 1024)).toFixed(2);
            return `${mbSize} MB`;
        } catch (e) {
            return 'N/A';
        }
    }

    debug() {
        console.log('=== DEBUG PRODUTIVIDADE PROCESSOR ===');
        console.log('Total registos (excluindo Orçamento Rejeitado):', this.dados.length);
        console.log('Total técnicos:', this.tecnicos.length);
        console.log('Tipologias:', this.getTipologias());
        console.log('Polos:', this.getPolos());
        console.log('Memória estimada:', this.estimarMemoria());
        
        if (this.dados.length > 0) {
            console.log('Exemplo primeiro registo:', this.dados[0]);
        }
    }
}
