// ==========================================
// MÓDULO DE CONSULTA CRUZADA E INTELIGÊNCIA - AAJ BAGL
// ==========================================
import { db } from './gemini-code-1793811612152 (1).js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Realiza o cruzamento entre os processos ativos e a base de normas vigentes no Firestore.
 * Identifica qual norma rege cada tipo de procedimento administrativo/jurídico.
 */
export async function executarConsultaCruzadaProcessosENormas() {
    try {
        // 1. Carregar normas do Firestore
        const snapshotNormas = await getDocs(collection(db, "legislacoes"));
        const normas = [];
        snapshotNormas.forEach(doc => normas.push(doc.data()));

        // 2. Recuperar dados globais de processos da aplicação
        const processosSigmaer = window.processosSigmaer || [];
        const processosPorTipo = window.processosPorTipo || { patd: [], sindicancia: [], apf: [], ipm: [] };
        const processosDesercao = window.processosDesercao || [];

        let relatorioCruzado = [];

        // Cruzamento SIGMAER -> ICA 136-3/2026
        const normaSigmaer = normas.find(n => n.codigo.includes('ICA 136-3')) || { codigo: 'ICA 136-3/2026' };
        processosSigmaer.filter(p => !p.arquivado).forEach(proc => {
            relatorioCruzado.push({
                tipo: 'SIGMAER',
                titulo: proc.titulo,
                alvo: proc.militar || proc.marca,
                normaAplicavel: normaSigmaer.codigo,
                statusRegra: 'Conforme ICA 136-3 (Armamento Particular)'
            });
        });

        // Cruzamento PATD -> ICA 111-6/2021
        const normaPatd = normas.find(n => n.codigo.includes('ICA 111-6')) || { codigo: 'ICA 111-6/2021' };
        (processosPorTipo.patd || []).filter(p => !p.arquivado).forEach(proc => {
            relatorioCruzado.push({
                tipo: 'PATD',
                titulo: proc.titulo,
                alvo: proc.encarregado,
                normaAplicavel: normaPatd.codigo,
                statusRegra: 'Sob rito de Apuração de Transgressão Disciplinar'
            });
        });

        // Cruzamento Sindicâncias e IPM -> Leis / ICAs Gerais
        const normaFederal = normas.find(n => n.codigo.includes('Lei 9.784')) || { codigo: 'Lei 9.784/1999' };
        (processosPorTipo.sindicancia || []).filter(p => !p.arquivado).forEach(proc => {
            relatorioCruzado.push({
                tipo: 'Sindicância',
                titulo: proc.titulo,
                alvo: proc.encarregado,
                normaAplicavel: normaFederal.codigo,
                statusRegra: 'Instrução regular em andamento'
            });
        });

        // Cruzamento Deserção -> NPA 002/2026
        const normaDesercao = normas.find(n => n.codigo.includes('NPA 002')) || { codigo: 'NPA 002/2026' };
        processosDesercao.forEach(proc => {
            relatorioCruzado.push({
                tipo: 'Deserção / Ausência',
                titulo: proc.titulo,
                alvo: proc.militar,
                normaAplicavel: normaDesercao.codigo,
                statusRegra: 'Controle estrito de prazos (Anexos NPA 002)'
            });
        });

        console.table(relatorioCruzado);
        renderizarPainelCruzamentoDOM(relatorioCruzado);
        return relatorioCruzado;

    } catch (error) {
        console.error("Erro ao executar consulta cruzada normativa:", error);
    }
}

/**
 * Renderiza os resultados da consulta cruzada diretamente na interface do Consultor IA ou Painel.
 */
function renderizarPainelCruzamentoDOM(resultados) {
    const container = document.getElementById('conteudoRespostaIa');
    const wrapper = document.getElementById('respostaIaContainer');
    if (!container || !wrapper) return;

    wrapper.classList.remove('hidden');
    
    let html = `
        <h4 class="font-bold text-sky-400 mb-2">Relatório de Cruzamento Normativo (${resultados.length} Processos Analisados)</h4>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                    <tr class="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th class="p-2">Tipo</th>
                        <th class="p-2">Processo</th>
                        <th class="p-2">Interessado / Encarregado</th>
                        <th class="p-2">Norma Regente (Firestore)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    resultados.forEach(r => {
        html += `
            <tr class="border-b border-slate-800/50 hover:bg-slate-950">
                <td class="p-2 font-bold text-sky-300">${r.tipo}</td>
                <td class="p-2">${r.titulo}</td>
                <td class="p-2 text-slate-400">${r.alvo}</td>
                <td class="p-2 text-emerald-400 font-mono">${r.normaAplicavel}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// Expõe a função globalmente para chamadas via botões na interface
window.executarConsultaCruzadaProcessosENormas = executarConsultaCruzadaProcessosENormas;