// POST /api/pix/create  →  gera uma cobrança Pix na SigiloPay
// Corpo: { valor, mensal, nome, email, telefone, cpf, mural }
// Resposta: { id, copiaECola, qrImage? }

const { keys, pick, sigilo, readBody } = require('../_sigilopay');

const MIN = Number(process.env.VALOR_MINIMO || 5);
const MAX = 10000;

function cpfValido(c) {
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false;
  const dv = (len) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(c[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

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
  const telefone = String(body.telefone || '').replace(/\D/g, '');
  const cpf = String(body.cpf || '').replace(/\D/g, '');
  const mensal = body.mensal === true;

  // A SigiloPay pede nome, e-mail, telefone e CPF de quem paga (mesmo formato do Origem Saúde).
  if (nome.length < 2) return res.status(400).json({ error: 'Coloca seu nome.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Esse e-mail parece estar incompleto.' });
  if (telefone.length < 10 || telefone.length > 11) return res.status(400).json({ error: 'Confere o celular com DDD.' });
  if (!cpfValido(cpf)) return res.status(400).json({ error: 'Confere o CPF.' });

  const identifier = 'ff-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);

  // Formato igual ao da integração do Origem Saúde (valor em reais).
  const payload = {
    identifier,
    amount: valor,
    client: { name: nome, email, phone: telefone, document: cpf },
    products: [{ id: mensal ? 'doacao-mensal' : 'doacao', name: mensal ? 'Doação mensal Focinho Feliz' : 'Doação Focinho Feliz', quantity: 1, price: valor }]
  };

  try {
    const r = await sigilo('/pix/receive', { method: 'POST', body: JSON.stringify(payload) });
    if (!r.ok) {
      console.error('SigiloPay create falhou', r.status, JSON.stringify(r.data).slice(0, 500));
      const msg = r.status === 400 || r.status === 422 ? 'Confere seus dados e tenta de novo.' : 'Não deu pra gerar o Pix agora. Tenta de novo em alguns segundos.';
      return res.status(502).json({ error: msg });
    }
    const d = r.data;
    const id = pick(d, ['transactionId', 'id', 'transaction.id', 'data.transactionId', 'data.id']);
    const copiaECola = typeof d.pix === 'string' ? d.pix : pick(d, ['pix.code', 'pix.copyPaste', 'pix.copiaECola', 'pix.qrcode', 'pix.qrCode', 'pix.payload', 'pix.emv', 'pixCode', 'qrCode', 'qrcode', 'data.pix.code']);
    let qrImage = pick(d, ['pix.base64', 'pix.image', 'pix.qrCodeBase64', 'pix.qrCodeImage', 'qrCodeBase64', 'data.pix.base64']);
    if (qrImage && !/^data:|^https:/.test(qrImage)) qrImage = 'data:image/png;base64,' + qrImage;

    if (!id || !copiaECola) {
      // Mostra só os nomes dos campos (sem dados do doador) pra ajustar o "pick" acima se precisar.
      console.error('Resposta da SigiloPay sem id/código. Campos:', Object.keys(d), d.pix && typeof d.pix === 'object' ? Object.keys(d.pix) : typeof d.pix);
      return res.status(502).json({ error: 'Não deu pra gerar o Pix agora. Tenta de novo em alguns segundos.' });
    }
    // Próxima fase: salvar { id, valor, nome, email, mensal, mural } no Supabase aqui.
    return res.status(200).json({ id: String(id), copiaECola: String(copiaECola), qrImage: qrImage || null });
  } catch (err) {
    console.error('Erro ao chamar a SigiloPay', err);
    return res.status(502).json({ error: 'Não deu pra gerar o Pix agora. Tenta de novo em alguns segundos.' });
  }
};
