// GET /api/resumo  →  { mes, total, doacoes }
// Soma as doações do Focinho Feliz recebidas no mês atual (fuso de Brasília), direto do Asaas.
// Só conta cobranças criadas pelo site (externalReference começando com "ff-"), então outros
// usos da mesma conta Asaas não entram na meta.

const { apiKey, asaas } = require('./_asaas');

const STATUS_PAGOS = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MAX_PAGINAS = 20; // 20 x 100 = até 2.000 cobranças por status, de sobra

function mesAtualBR() {
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()); // AAAA-MM-DD
  const [ano, mes] = hoje.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const mm = String(mes).padStart(2, '0');
  return { inicio: `${ano}-${mm}-01`, fim: `${ano}-${mm}-${String(ultimoDia).padStart(2, '0')}`, nome: MESES[mes - 1] };
}

async function somar(status, inicio, fim) {
  let total = 0;
  let doacoes = 0;
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const q = `?status=${status}&paymentDate%5Bge%5D=${inicio}&paymentDate%5Ble%5D=${fim}&limit=100&offset=${pagina * 100}`;
    const r = await asaas('/payments' + q, { method: 'GET' });
    if (!r.ok) throw new Error('Asaas ' + r.status);
    const lista = Array.isArray(r.data.data) ? r.data.data : [];
    for (const p of lista) {
      if (String(p.externalReference || '').startsWith('ff-')) {
        total += Number(p.value) || 0;
        doacoes += 1;
      }
    }
    if (!r.data.hasMore || lista.length < 100) break;
  }
  return { total, doacoes };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const mes = mesAtualBR();
  if (!apiKey()) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'doacoes_fechadas', mes: mes.nome });
  }
  try {
    const partes = await Promise.all(STATUS_PAGOS.map((s) => somar(s, mes.inicio, mes.fim)));
    const total = Math.round(partes.reduce((s, p) => s + p.total, 0) * 100) / 100;
    const doacoes = partes.reduce((s, p) => s + p.doacoes, 0);
    // A Vercel guarda a resposta por 60s, então o Asaas não é consultado a cada visita.
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ mes: mes.nome, total, doacoes });
  } catch (err) {
    console.error('Erro ao somar doações no Asaas', err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'resumo_indisponivel', mes: mes.nome });
  }
};
