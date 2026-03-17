class ProdutividadeProcessor {
    constructor() {
        this.dados = [];
        this.tecnicos = [];
    }

    async carregarDados(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheet = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheet];
                    
                    this.dados = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Filtra apenas TSC SOUTH
                    this.dados = this.dados.filter(item => item.polo === 'TSC SOUTH');
                    
                    // Lista de técnicos
                    const tecnicosLista = this.dados
                        .filter(item => item.tecnico_reparacao)
                        .map(item => item.tecnico_reparacao);
                    
                    this.tecnicos = [...new Set(tecnicosLista)];
                    
                    resolve(this.dados);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.readAsBinaryString(file);
        });
    }

    filtrarPorPeriodo(periodo) {
        const hoje = new Date();
        const hojeDia = hoje.getDate();
        const hojeMes = hoje.getMonth() + 1;
        const hojeAno = hoje.getFullYear();
        
        let dadosFiltrados = this.dados.filter(item => 
            item.tecnico_reparacao && 
            item.tecnico_reparacao.trim() !== '' &&
            item['Dia Reparação'] &&
            item['Mês Reparação'] &&
            item['Ano Reparação']
        );
        
        switch(periodo) {
            case 'hoje':
                return dadosFiltrados.filter(item => 
                    item['Dia Reparação'] == hojeDia && 
                    item['Mês Reparação'] == hojeMes && 
                    item['Ano Reparação'] == hojeAno
                );
                
            case 'ontem':
                const ontem = new Date(hoje);
                ontem.setDate(ontem.getDate() - 1);
                return dadosFiltrados.filter(item => 
                    item['Dia Reparação'] == ontem.getDate() && 
                    item['Mês Reparação'] == (ontem.getMonth() + 1) && 
                    item['Ano Reparação'] == ontem.getFullYear()
                );
                
            case 'semana': {
                const dataLimite = new Date(hoje);
                dataLimite.setDate(dataLimite.getDate() - 7);
                return dadosFiltrados.filter(item => {
                    const dataItem = new Date(
                        item['Ano Reparação'],
                        item['Mês Reparação'] - 1,
                        item['Dia Reparação']
                    );
                    return dataItem >= dataLimite;
                });
            }
                
            case 'mes': {
                const dataLimite = new Date(hoje);
                dataLimite.setMonth(dataLimite.getMonth() - 1);
                return dadosFiltrados.filter(item => {
                    const dataItem = new Date(
                        item['Ano Reparação'],
                        item['Mês Reparação'] - 1,
                        item['Dia Reparação']
                    );
                    return dataItem >= dataLimite;
                });
            }
                
            case 'trimestre': {
                const dataLimite = new Date(hoje);
                dataLimite.setMonth(dataLimite.getMonth() - 3);
                return dadosFiltrados.filter(item => {
                    const dataItem = new Date(
                        item['Ano Reparação'],
                        item['Mês Reparação'] - 1,
                        item['Dia Reparação']
                    );
                    return dataItem >= dataLimite;
                });
            }
                
            default:
                return dadosFiltrados;
        }
    }

    calcularReparadosPorTecnico(dadosFiltrados) {
        const reparados = {};
        
        dadosFiltrados.forEach(item => {
            const tecnico = item.tecnico_reparacao;
            reparados[tecnico] = (reparados[tecnico] || 0) + 1;
        });
        
        return reparados;
    }

    calcularEstatisticas(dadosFiltrados, periodo) {
        const reparados = this.calcularReparadosPorTecnico(dadosFiltrados);
        const totalReparados = Object.values(reparados).reduce((sum, val) => sum + val, 0);
        const numeroDias = this.calcularNumeroDias(periodo);
        
        return {
            reparados,
            totalReparados,
            mediaDiaria: numeroDias > 0 ? totalReparados / numeroDias : 0,
            tecnicosAtivos: Object.values(reparados).filter(v => v > 0).length,
            mediaPorTecnico: Object.values(reparados).filter(v => v > 0).length > 0 ? 
                totalReparados / Object.values(reparados).filter(v => v > 0).length : 0,
            numeroDias
        };
    }

    calcularNumeroDias(periodo) {
        switch(periodo) {
            case 'hoje': case 'ontem': return 1;
            case 'semana': return 7;
            case 'mes': return 30;
            case 'trimestre': return 90;
            default: return 1;
        }
    }
}
