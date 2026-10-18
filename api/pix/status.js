// GET /api/pix/status?id=...  →  { paid, expired, status }
// A página de doação chama a cada 5 segundos até o status virar COMPLETED.

const { keys, pick, sigilo } = require('../_sigilopay');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!keys()) return res.status(503).json({ error: 'doacoes_fechadas' });

  const id = String((req.query && req.query.id) || '');
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return res.status(400).json({ error: 'id inválido' });

  try {
    const r = await sigilo('/transactions?id=' + encodeURIComponent(id), { method: 'GET' });
    if (!r.ok) return res.status(200).json({ paid: false, expired: false, status: 'UNKNOWN' });
    const raw = pick(r.data, ['status', 'transaction.status', 'data.status', 'data.0.status', '0.status']);
    const status = String(raw || 'PENDING').toUpperCase();
    return res.status(200).json({
      paid: status === 'COMPLETED',
      expired: ['EXPIRED', 'CANCELED', 'CANCELLED', 'FAILED', 'REFUSED'].includes(status),
      status
    });
  } catch (err) {
    console.error('Erro ao consultar a SigiloPay', err);
    return res.status(200).json({ paid: false, expired: false, status: 'UNKNOWN' });
  }
};
