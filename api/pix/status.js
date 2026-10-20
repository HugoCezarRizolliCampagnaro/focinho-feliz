// GET /api/pix/status?id=...  →  { paid, expired, status }
// A página de doação chama a cada 5 segundos. No Asaas, Pix pago fica com status RECEIVED.

const { apiKey, asaas } = require('../_asaas');

const PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
const ENCERRADO = ['REFUNDED', 'REFUND_REQUESTED', 'REFUND_IN_PROGRESS', 'CHARGEBACK_REQUESTED', 'DELETED'];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!apiKey()) return res.status(503).json({ error: 'doacoes_fechadas' });

  const id = String((req.query && req.query.id) || '');
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return res.status(400).json({ error: 'id inválido' });

  try {
    const r = await asaas('/payments/' + encodeURIComponent(id) + '/status', { method: 'GET' });
    if (!r.ok) return res.status(200).json({ paid: false, expired: false, status: 'UNKNOWN' });
    const status = String(r.data.status || 'PENDING').toUpperCase();
    return res.status(200).json({ paid: PAGO.includes(status), expired: ENCERRADO.includes(status), status });
  } catch (err) {
    console.error('Erro ao consultar o Asaas', err);
    return res.status(200).json({ paid: false, expired: false, status: 'UNKNOWN' });
  }
};
