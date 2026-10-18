// POST /api/pix/create  →  gera uma cobrança Pix na SigiloPay
// Corpo: { valor, mensal, nome, email, mural }
// Resposta: { id, copiaECola, qrImage? }

const { keys, pick, sigilo, readBody } = require('../_sigilopay');

const MIN = Number(process.env.VALOR_MINIMO || 5);
const MAX = 10000;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  // Sem as chaves na Vercel, o site mostra "doações abrem em breve".
  if (!keys()) return res.status(503).json({ error: 'doacoes_fechadas' });

  const body = readBody(req);
  const valor = Number(body.valor);
  if (!Number.isInteger(valor) || valor < MIN || valor > MAX) {
    return res.status(400).json({ error: `Valor inválido. O mínimo é R$ ${MIN}.` });
  }
  const nome = String(body.nome || '').trim().slice(0, 80);
  const email = String(body.email || '').trim().slice(0, 120);
  const mensal = body.mensal === true;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Esse e-mail parece estar incompleto.' });
  }
  if (mensal && !email) {
    return res.status(400).json({ error: 'Na doação mensal, o e-mail é obrigatório.' });
  }

  const identifier = 'ff-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

  // ⚠️ CONFERIR: estes nomes de campo precisam bater com o que a SigiloPay espera.
  // Copie o formato exato da integração que já funciona no projeto Origem Saúde
  // (inclusive se o valor vai em reais, como aqui, ou em centavos).
  const payload = {
    identifier,
    amount: valor,
    client: {
      name: nome || 'Doador anônimo',
      email: email || undefined
    },
    metadata: { origem: 'focinho-feliz', mensal, mural: body.mural === true }
  };

  try {
    const r = await sigilo('/pix/receive', { method: 'POST', body: JSON.stringify(payload) });
    if (!r.ok) {
      console.error('SigiloPay create falhou', r.status, JSON.stringify(r.data).slice(0, 500));
      return res.status(502).json({ error: 'Não deu pra gerar o Pix agora. Tenta de novo em alguns segundos.' });
    }
    const d = r.data;
    const id = pick(d, ['transactionId', 'id', 'transaction.id', 'data.id', 'data.transactionId']);
    const copiaECola = pick(d, ['pix.code', 'pixCode', 'pix.copyPaste', 'qrCode', 'qrcode', 'pix.qrcode', 'data.pix.code', 'data.qrCode', 'emv', 'brCode']);
    let qrImage = pick(d, ['pix.image', 'pix.base64', 'qrCodeImage', 'qrCodeBase64', 'data.pix.image', 'data.qrCodeBase64']);
    if (qrImage && !/^data:|^https:/.test(qrImage)) qrImage = 'data:image/png;base64,' + qrImage;

    if (!id || !copiaECola) {
      console.error('Resposta da SigiloPay sem id/código', JSON.stringify(d).slice(0, 500));
      return res.status(502).json({ error: 'Não deu pra gerar o Pix agora. Tenta de novo em alguns segundos.' });
    }
    // Próxima fase: salvar { id, valor, nome, email, mensal, mural } no Supabase aqui.
    return res.status(200).json({ id: String(id), copiaECola: String(copiaECola), qrImage: qrImage || null });
  } catch (err) {
    console.error('Erro ao chamar a SigiloPay', err);
    return res.status(502).json({ error: 'Não deu pra gerar o Pix agora. Tenta de novo em alguns segundos.' });
  }
};
