// GET /api/resumo            →  { mes, total, doacoes }  (mês atual, pra prestação de contas)
// GET /api/resumo?desde=DATA →  { mes, desde, total, doacoes }  (do dia DATA até hoje, pro pote de ração)
// Soma as doações do Focinho Feliz recebidas no período (fuso de Brasília), direto do Asaas.
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

// Valida "desde" (AAAA-MM-DD): não pode ser no futuro nem ter mais de 1 ano
function periodoDesde(desde, hoje) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde || '')) return null;
  const d = new Date(desde + 'T00:00:00Z');
  if (isNaN(d) || d.toISOString().slice(0, 10) !== desde) return null;
  const h = new Date(hoje + 'T00:00:00Z');
  if (d > h || (h - d) / 86400000 > 366) return null;
  return { inicio: desde, fim: hoje };
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
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const desde = req.query && req.query.desde;
  const periodo = desde ? periodoDesde(String(desde), hoje) : { inicio: mes.inicio, fim: mes.fim };
  if (!periodo) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'data inválida', mes: mes.nome });
  }
  try {
    const partes = await Promise.all(STATUS_PAGOS.map((s) => somar(s, periodo.inicio, periodo.fim)));
    const total = Math.round(partes.reduce((s, p) => s + p.total, 0) * 100) / 100;
    const doacoes = partes.reduce((s, p) => s + p.doacoes, 0);
    // A Vercel guarda a resposta por 60s, então o Asaas não é consultado a cada visita.
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ mes: mes.nome, desde: desde ? periodo.inicio : undefined, total, doacoes });
  } catch (err) {
    console.error('Erro ao somar doações no Asaas', err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'resumo_indisponivel', mes: mes.nome });
  }
};
