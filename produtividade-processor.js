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
                    
                    // Filtra apenas TSC SOUTH
                    this.dados = this.dados.filter(item => item.polo === 'TSC SOUTH');
                    
                    // Extrai lista única de técnicos (que têm reparações)
                    const tecnicosComReparacao = this.dados
                        .filter(item => item.tecnico_reparacao && item.tecnico_reparacao.trim() !== '')
                        .map(item => item.tecnico_reparacao);
                    
                    this.tecnicos = [...new Set(tecnicosComReparacao)];
                    
                    console.log('Dados carregados:', this.dados.length, 'registos (TSC SOUTH)');
                    console.log('Técnicos encontrados:', this.tecnicos);
                    
                    // Debug: mostra alguns exemplos
                    console.log('Exemplo de registo:', this.dados[0]);
                    
                    resolve(this.dados);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.readAsBinaryString(file);
        });
    }

    // Filtra por período usando as colunas Dia/Mês/Ano
    filtrarPorPeriodo(periodo) {
        const hoje = new Date();
        const hojeDia = hoje.getDate();
        const hojeMes = hoje.getMonth() + 1;
        const hojeAno = hoje.getFullYear();
        
        // Filtra os dados que têm técnico atribuído
        let dadosComTecnico = this.dados.filter(item => 
            item.tecnico_reparacao && item.tecnico_reparacao.trim() !== ''
        );
        
        switch(periodo) {
            case 'hoje':
                return dadosComTecnico.filter(item => 
                    item['Dia Reparação'] == hojeDia && 
                    item['Mês Reparação'] == hojeMes && 
                    item['Ano Reparação'] == hojeAno
                );
                
            case 'ontem':
                const ontem = new Date(hoje);
                ontem.setDate(ontem.getDate() - 1);
                return dadosComTecnico.filter(item => 
                    item['Dia Reparação'] == ontem.getDate() && 
                    item['Mês Reparação'] == (ontem.getMonth() + 1) && 
                    item['Ano Reparação'] == ontem.getFullYear()
                );
                
            case 'semana': {
                const dataLimite = new Date(hoje);
                dataLimite.setDate(dataLimite.getDate() - 7);
                
                return dadosComTecnico.filter(item => {
                    const dataItem = new Date(
                        item['Ano Reparação'],
                        item['Mês Reparação'] - 1,
                        item['Dia Reparação']
                    );
                    return dataItem >= dataLimite && dataItem <= hoje;
                });
            }
                
            case 'mes': {
                const dataLimite = new Date(hoje);
                dataLimite.setMonth(dataLimite.getMonth() - 1);
                
                return dadosComTecnico.filter(item => {
                    const dataItem = new Date(
                        item['Ano Reparação'],
                        item['Mês Reparação'] - 1,
                        item['Dia Reparação']
                    );
                    return dataItem >= dataLimite && dataItem <= hoje;
                });
            }
                
            case 'trimestre': {
                const dataLimite = new Date(hoje);
                dataLimite.setMonth(dataLimite.getMonth() - 3);
                
                return dadosComTecnico.filter(item => {
                    const dataItem = new Date(
                        item['Ano Reparação'],
                        item['Mês Reparação'] - 1,
                        item['Dia Reparação']
                    );
                    return dataItem >= dataLimite && dataItem <= hoje;
                });
            }
                
            default:
                return dadosComTecnico;
        }
    }

    // Calcula reparados por técnico
    calcularReparadosPorTecnico(dadosFiltrados) {
        const reparados = {};
        
        // Inicializa todos os técnicos com 0
        this.tecnicos.forEach(tecnico => {
            reparados[tecnico] = 0;
        });
        
        // Conta os reparados
        dadosFiltrados.forEach(item => {
            const tecnico = item.tecnico_reparacao;
            if (tecnico && tecnico.trim() !== '') {
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
            if (!item.tecnico_reparacao) return;
            
            // Cria chave no formato DD/MM/AAAA
            const dia = item['Dia Reparação'];
            const mes = item['Mês Reparação'];
            const ano = item['Ano Reparação'];
            
            if (!dia || !mes || !ano) return;
            
            const dataStr = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
            
            if (!dias[dataStr]) {
                dias[dataStr] = {
                    data: dataStr,
                    total: 0,
                    porTecnico: {}
                };
            }
            
            dias[dataStr].total++;
            
            const tecnico = item.tecnico_reparacao;
            if (tecnico) {
                dias[dataStr].porTecnico[tecnico] = (dias[dataStr].porTecnico[tecnico] || 0) + 1;
            }
        });
        
        // Converte para array e ordena por data
        return Object.values(dias).sort((a, b) => {
            const [diaA, mesA, anoA] = a.data.split('/').map(Number);
            const [diaB, mesB, anoB] = b.data.split('/').map(Number);
            
            if (anoA !== anoB) return anoA - anoB;
            if (mesA !== mesB) return mesA - mesB;
            return diaA - diaB;
        });
    }

    // Função para debug - mostra estatísticas
    debugEstatisticas() {
        console.log('=== DEBUG ESTATÍSTICAS ===');
        console.log('Total registos TSC SOUTH:', this.dados.length);
        
        const comTecnico = this.dados.filter(d => d.tecnico_reparacao && d.tecnico_reparacao.trim() !== '');
        console.log('Com técnico atribuído:', comTecnico.length);
        
        // Conta por ano/mês
        const porAnoMes = {};
        comTecnico.forEach(d => {
            const ano = d['Ano Reparação'];
            const mes = d['Mês Reparação'];
            const key = `${ano}/${mes}`;
            porAnoMes[key] = (porAnoMes[key] || 0) + 1;
        });
        
        console.log('Reparados por ano/mês:', porAnoMes);
        
        // Top técnicos
        const porTecnico = this.calcularReparadosPorTecnico(comTecnico);
        const topTecnicos = Object.entries(porTecnico)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        console.log('Top 5 técnicos (todos os tempos):', topTecnicos);
    }
}
