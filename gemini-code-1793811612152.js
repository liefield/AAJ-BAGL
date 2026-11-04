// ==========================================
// 1. INICIALIZAÇÃO DO FIREBASE (PROJETO: aaj-bagl)
// ==========================================
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIDBFADFHiwG-m5csSRPAjYb_531Z8qII",
  authDomain: "aaj-bagl.firebaseapp.com",
  projectId: "aaj-bagl",
  storageBucket: "aaj-bagl.firebasestorage.app",
  messagingSenderId: "275553788481",
  appId: "1:275553788481:web:1568c90ba8bfeb350e5cc0",
  measurementId: "G-RR2H2NGRSW"
};

// Inicializa o app e os serviços
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

// ==========================================
// 2. LÓGICA DE DADOS DO SIGMAER (FIRESTORE)
// ==========================================

// Função para buscar legislações do Firestore
export async function carregarLegislacoesDoFirestore() {
  try {
    const querySnapshot = await getDocs(collection(db, "legislacoes"));
    const legislacoes = [];
    
    querySnapshot.forEach((docSnap) => {
      legislacoes.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    // Se a coleção estiver vazia na primeira execução, popula com a base normativa completa do COMAER e Federal
    if (legislacoes.length === 0) {
      await popularNormasPadrao();
      return carregarLegislacoesDoFirestore();
    }
    
    renderizarInterfaceSIGMAER(legislacoes);
  } catch (error) {
    console.error("Erro ao carregar legislações do Firestore: ", error);
  }
}

// Popula normas padrão e legislações correlatas caso o banco esteja vazio
async function popularNormasPadrao() {
  const padroes = [
    { codigo: 'ICA 136-3/2026', titulo: 'Armamento de Uso Particular no Âmbito do COMAER', orgao: 'DIRMAB', status: 'Vigente' },
    { codigo: 'ICA 111-6/2021', titulo: 'Apuração de Transgressão Disciplinar e Punição (PATD)', orgao: 'GABAER / EMAER', status: 'Vigente' },
    { codigo: 'ICA 111-5/2021', titulo: 'Conselho de Justificação no Âmbito do COMAER', orgao: 'GABAER', status: 'Vigente' },
    { codigo: 'ICA 111-4/2024', titulo: 'Conselho de Disciplina no Âmbito do COMAER', orgao: 'GABAER', status: 'Vigente' },
    { codigo: 'Lei 6.880/1980', titulo: 'Estatuto dos Militares (Direitos, Deveres, Prerrogativas e Inatividade)', orgao: 'Presidência da República', status: 'Vigente' },
    { codigo: 'Lei 9.784/1999', titulo: 'Regulamentação do Processo Administrativo no Âmbito Federal', orgao: 'Presidência da República', status: 'Vigente' }
  ];
  
  for (let norma of padroes) {
    await addDoc(collection(db, "legislacoes"), norma);
  }
}

// Adicionar nova legislação via Modal / Input
window.salvarNovaLegislacaoFirestore = async function() {
  const codigo = prompt('Informe o código da norma (Ex: ICA 100-1/2026):');
  if (!codigo) return;
  const titulo = prompt('Informe o título ou objeto da legislação:');
  if (!titulo) return;
  const orgao = prompt('Informe o órgão emissor (Ex: DIRMAB, GABAER, Presidência):', 'DIRMAB');

  try {
    await addDoc(collection(db, "legislacoes"), {
      codigo: codigo,
      titulo: titulo,
      orgao: orgao || 'COMAER',
      status: 'Vigente',
      data_cadastro: new Date().toISOString().split('T')[0]
    });
    carregarLegislacoesDoFirestore();
  } catch (e) {
    console.error("Erro ao adicionar documento no Firestore: ", e);
  }
};

// Excluir legislação do Firestore
window.excluirLegislacaoFirestore = async function(id) {
  if (confirm('Tem certeza que deseja excluir esta legislação da base do SIGMAER?')) {
    try {
      await deleteDoc(doc(db, "legislacoes", id));
      carregarLegislacoesDoFirestore();
    } catch (e) {
      console.error("Erro ao remover documento do Firestore: ", e);
    }
  }
};

// ==========================================
// 3. RENDERIZAÇÃO DA INTERFACE (DOM)
// ==========================================
function renderizarInterfaceSIGMAER(legislacoes) {
  const tbody = document.getElementById('tabela-legislacoes');
  const cards = document.getElementById('cards-legislacoes');
  if (!tbody || !cards) return;

  tbody.innerHTML = '';
  cards.innerHTML = '';

  legislacoes.forEach(leg => {
    // Linha da Tabela
    tbody.innerHTML += `
      <tr class="hover:bg-slate-800/40 transition-colors">
        <td class="p-3 font-semibold text-cyan-400">${leg.codigo}</td>
        <td class="p-3">${leg.titulo}</td>
        <td class="p-3 text-slate-400">${leg.orgao || 'COMAER'}</td>
        <td class="p-3"><span class="px-2 py-0.5 text-xs rounded bg-emerald-950 text-emerald-400 border border-emerald-800">${leg.status || 'Vigente'}</span></td>
        <td class="p-3 text-right space-x-2">
          <button onclick="excluirLegislacaoFirestore('${leg.id}')" class="text-rose-400 hover:text-rose-300 p-1.5 rounded bg-rose-950/40 border border-rose-900/50 transition-colors" title="Excluir Legislação">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `;

    // Cards de Resumo
    cards.innerHTML += `
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span class="font-bold text-cyan-400">${leg.codigo}</span>
            <span>${leg.orgao || 'COMAER'}</span>
          </div>
          <h4 class="text-sm font-semibold text-slate-200 line-clamp-2">${leg.titulo}</h4>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span class="text-emerald-400 font-medium"><i class="fas fa-check-circle mr-1"></i> Regra Ativa</span>
          <span class="text-slate-500">Base Normativa</span>
        </div>
      </div>
    `;
  });
}

// Inicializa a carga ao carregar a página
document.addEventListener('DOMContentLoaded', carregarLegislacoesDoFirestore);