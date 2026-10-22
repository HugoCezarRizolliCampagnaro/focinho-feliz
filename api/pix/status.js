// GET /api/pix/status?id=...  →  { paid, expired, status }
// A página de doação chama a cada 5 segundos até o Pix ser pago.

const { gateway, statusPix } = require('../_gateway');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  if (!gateway()) return res.status(503).json({ error: 'doacoes_fechadas' });

  const id = String((req.query && req.query.id) || '');
  if (!/^[A-Za-z0-9._:-]{1,100}$/.test(id)) return res.status(400).json({ error: 'id inválido' });

  try {
    return res.status(200).json(await statusPix(id));
  } catch (err) {
    console.error('Erro ao consultar Pix (' + gateway() + '):', err.message);
    return res.status(200).json({ paid: false, expired: false, status: 'UNKNOWN' });
  }
};
