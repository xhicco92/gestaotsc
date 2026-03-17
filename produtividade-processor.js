// produtividade-processor.js
class ProdutividadeProcessor {
    constructor() {
        this.dados = [];
        this.tecnicos = [];
        this.periodoAtual = 'hoje';
    }

    // Carrega dados do Excel
    async carregarDados(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheet = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheet];
                    
                    // Converte para JSON
                    this.dados = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Extrai lista única de técnicos
                    this.tecnicos = [...new Set(this.dados.map(item => item.Tecnico || item.Técnico || 'Não atribuído'))];
                    
                    console.log('Dados carregados:', this.dados.length, 'registos');
                    console.log('Técnicos encontrados:', this.tecnicos);
                    
                    resolve(this.dados);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.readAsBinaryString(file);
        });
    }

    // Filtra por período
    filtrarPorPeriodo(periodo) {
        const hoje = new Date();
        let dataInicio, dataFim = new Date(hoje);
        
        switch(periodo) {
            case 'hoje':
                dataInicio = new Date(hoje.setHours(0,0,0,0));
                dataFim = new Date(hoje.setHours(23,59,59,999));
                break;
            case 'ontem':
                const ontem = new Date(hoje);
                ontem.setDate(ontem.getDate() - 1);
                dataInicio = new Date(ontem.setHours(0,0,0,0));
                dataFim = new Date(ontem.setHours(23,59,59,999));
                break;
            case 'semana':
                dataInicio = new Date(hoje);
                dataInicio.setDate(dataInicio.getDate() - 7);
                dataInicio.setHours(0,0,0,0);
                break;
            case 'mes':
                dataInicio = new Date(hoje);
                dataInicio.setMonth(dataInicio.getMonth() - 1);
                dataInicio.setHours(0,0,0,0);
                break;
            case 'trimestre':
                dataInicio = new Date(hoje);
                dataInicio.setMonth(dataInicio.getMonth() - 3);
                dataInicio.setHours(0,0,0,0);
                break;
            default:
                return this.dados;
        }
        
        return this.dados.filter(item => {
            const dataItem = new Date(item.Data || item.data);
            return dataItem >= dataInicio && dataItem <= dataFim;
        });
    }

    // Calcula reparados por técnico (assumindo coluna "Status" = "Concluído" ou similar)
    calcularReparadosPorTecnico(dadosFiltrados) {
        const reparados = {};
        
        // Inicializa todos os técnicos com 0
        this.tecnicos.forEach(tecnico => {
            reparados[tecnico] = 0;
        });
        
        // Conta apenas os concluídos
        dadosFiltrados.forEach(item => {
            const tecnico = item.Tecnico || item.Técnico || 'Não atribuído';
            const status = (item.Status || item.status || '').toLowerCase();
            
            // Considera como reparado se status contém "concluído", "finalizado", "reparado"
            if (status.includes('conclu') || status.includes('finaliz') || status.includes('reparado')) {
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
        
        // Média por técnico (dos que trabalharam)
        const tecnicosComReparacao = Object.values(reparados).filter(v => v > 0).length;
        const mediaPorTecnico = tecnicosComReparacao > 0 ? totalReparados / tecnicosComReparacao : 0;
        
        return {
            reparados,
            totalReparados,
            mediaDiaria,
            mediaPorTecnico,
            tecnicosAtivos: tecnicosComReparacao,
            numeroDias
        };
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
                return 1;
        }
    }

    // Agrupa por dia para gráfico de evolução
    agruparPorDia(dadosFiltrados) {
        const dias = {};
        
        dadosFiltrados.forEach(item => {
            const data = new Date(item.Data || item.data).toLocaleDateString('pt-PT');
            const status = (item.Status || item.status || '').toLowerCase();
            
            if (!dias[data]) {
                dias[data] = {
                    data,
                    total: 0,
                    porTecnico: {}
                };
            }
            
            if (status.includes('conclu') || status.includes('finaliz') || status.includes('reparado')) {
                dias[data].total++;
                
                const tecnico = item.Tecnico || item.Técnico || 'Não atribuído';
                dias[data].porTecnico[tecnico] = (dias[data].porTecnico[tecnico] || 0) + 1;
            }
        });
        
        return Object.values(dias).sort((a, b) => new Date(a.data) - new Date(b.data));
    }
}
