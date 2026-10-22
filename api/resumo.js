// GET /api/resumo            →  { mes, total, doacoes }  (mês atual, pra prestação de contas)
// GET /api/resumo?desde=DATA →  { mes, desde, total, doacoes }  (do dia DATA até hoje, pro pote de ração)
// Soma as doações do Focinho Feliz pagas no período (fuso de Brasília), direto do gateway ligado.
// Só conta cobranças criadas pelo site (referência começando com "ff-"), então outros
// usos da mesma conta não entram na meta.

const { gateway, somarDoacoes } = require('./_gateway');

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

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

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const mes = mesAtualBR();
  if (!gateway()) {
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
    const { total, doacoes } = await somarDoacoes(periodo.inicio, periodo.fim);
    // A Vercel guarda a resposta por 60s, então o gateway não é consultado a cada visita.
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ mes: mes.nome, desde: desde ? periodo.inicio : undefined, total, doacoes });
  } catch (err) {
    console.error('Erro ao somar doações (' + gateway() + '):', err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'resumo_indisponivel', mes: mes.nome });
  }
};
