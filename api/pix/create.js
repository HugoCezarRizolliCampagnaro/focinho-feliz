// POST /api/pix/create  →  gera uma cobrança Pix no gateway ligado (ZuckPay ou Asaas)
// Corpo: { valor, mensal, nome, email, telefone, cpf, mural }
// Resposta: { id, copiaECola, qrImage }

const { gateway, criarPix } = require('../_gateway');
const { readBody } = require('../_asaas');

const MIN = Number(process.env.VALOR_MINIMO || 10);
const MAX = 10000;
const ERRO_GENERICO = 'Não deu pra gerar o Pix agora. Tenta de novo em alguns segundos.';

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
  // Sem chave de nenhum gateway na Vercel, o site mostra "doações abrem em breve".
  if (!gateway()) return res.status(503).json({ error: 'doacoes_fechadas' });

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

  if (nome.length < 2) return res.status(400).json({ error: 'Coloca seu nome.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Esse e-mail parece estar incompleto.' });
  if (telefone.length < 10 || telefone.length > 11) return res.status(400).json({ error: 'Confere o celular com DDD.' });
  if (!cpfValido(cpf)) return res.status(400).json({ error: 'Confere o CPF.' });

  const ref = 'ff-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);

  try {
    const pix = await criarPix({ valor, nome, email, telefone, cpf, mensal, ref });
    // Próxima fase: salvar { id, valor, mensal, mural } num banco aqui.
    return res.status(200).json(pix);
  } catch (err) {
    console.error('Erro ao gerar Pix (' + gateway() + '):', err.message);
    if (err.status === 503) return res.status(503).json({ error: 'doacoes_fechadas' });
    if (err.dadosInvalidos) return res.status(400).json({ error: 'Confere seus dados e tenta de novo.' });
    return res.status(502).json({ error: ERRO_GENERICO });
  }
};
