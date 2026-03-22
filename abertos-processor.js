class AbertosProcessor {
    constructor() {
        this.dados = [];
        this.tipologiasExcluidas = ['Grandes Domésticos', 'Printing', 'Electrónica Desportiva', 'Lar e Decoração'];
    }

    async carregarDados(file, onProgress) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheet = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheet];
                    
                    let dados = XLSX.utils.sheet_to_json(worksheet);
                    
                    // Filtra registos que estão abertos (sem data de reparação ou com status aberto)
                    this.dados = dados.filter(item => {
                        // Considera aberto se não tem data de reparação ou se está em análise
                        const temReparacao = item.reparacao && item.reparacao !== '';
                        const statusAberto = !temReparacao || 
                                            item.resultado_analise_tecnica === 'Análise Técnica Concluída' ||
                                            !item.controlo_qualidade;
                        return statusAberto;
                    });
                    
                    console.log(`Total registos carregados: ${this.dados.length}`);
                    
                    resolve(this.dados);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.readAsBinaryString(file);
        });
    }

    getTipologiasAbertos() {
        const tipologias = new Set();
        
        this.dados.forEach(item => {
            const tipologia = item.tipologia;
            if (tipologia && tipologia.trim() !== '' && !this.tipologiasExcluidas.includes(tipologia)) {
                tipologias.add(tipologia.trim());
            }
        });
        
        // Ordem específica
        const ordem = ['Mobile', 'Informática', 'Entretenimento', 'Som e Imagem', 'Pequenos Domésticos'];
        
        return Array.from(tipologias).sort((a, b) => {
            const indexA = ordem.indexOf(a);
            const indexB = ordem.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }
}
