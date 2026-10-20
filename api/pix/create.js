// POST /api/pix/create  →  gera uma cobrança Pix no Asaas
// Corpo: { valor, mensal, nome, email, telefone, cpf, mural }
// Resposta: { id, copiaECola, qrImage }
//
// Passos no Asaas: acha (ou cria) o cliente pelo CPF → cria a cobrança Pix → pega o QR Code.

const { apiKey, asaas, asaasError, readBody, hojeBR } = require('../_asaas');

const MIN = Number(process.env.VALOR_MINIMO || 5);
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

async function clienteId({ nome, email, telefone, cpf }) {
  const busca = await asaas('/customers?cpfCnpj=' + cpf + '&limit=1', { method: 'GET' });
  const achado = busca.ok && busca.data && Array.isArray(busca.data.data) && busca.data.data[0];
  if (achado && achado.id) return achado.id;

  const novo = await asaas('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: nome,
      cpfCnpj: cpf,
      email,
      mobilePhone: telefone,
      notificationDisabled: true // o próprio site mostra o Pix; o Asaas não manda e-mail de cobrança
    })
  });
  if (!novo.ok || !novo.data.id) {
    const e = new Error('cliente');
    e.asaas = novo;
    throw e;
  }
  return novo.data.id;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  // Sem a chave na Vercel, o site mostra "doações abrem em breve".
  if (!apiKey()) return res.status(503).json({ error: 'doacoes_fechadas' });

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

  try {
    const customer = await clienteId({ nome, email, telefone, cpf });

    const cobranca = await asaas('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer,
        billingType: 'PIX',
        value: valor,
        dueDate: hojeBR(),
        description: mensal ? 'Doação mensal Focinho Feliz' : 'Doação Focinho Feliz',
        externalReference: 'ff-' + Date.now()
      })
    });
    if (!cobranca.ok || !cobranca.data.id) {
      console.error('Asaas: falha ao criar cobrança', cobranca.status, asaasError(cobranca.data));
      return res.status(502).json({ error: ERRO_GENERICO });
    }
    const id = cobranca.data.id;

    const qr = await asaas('/payments/' + encodeURIComponent(id) + '/pixQrCode', { method: 'GET' });
    if (!qr.ok || !qr.data.payload) {
      console.error('Asaas: falha ao obter QR Code', qr.status, asaasError(qr.data));
      return res.status(502).json({ error: ERRO_GENERICO });
    }
    const img = qr.data.encodedImage;
    const qrImage = img ? (img.startsWith('data:') ? img : 'data:image/png;base64,' + img) : null;

    // Próxima fase: salvar { id, valor, mensal, mural } no Supabase aqui.
    return res.status(200).json({ id: String(id), copiaECola: String(qr.data.payload), qrImage });
  } catch (err) {
    if (err.asaas) {
      const a = err.asaas;
      console.error('Asaas: falha ao criar cliente', a.status, asaasError(a.data));
      if (a.status === 400) return res.status(400).json({ error: 'Confere seus dados e tenta de novo.' });
    } else {
      console.error('Erro ao chamar o Asaas', err);
    }
    return res.status(502).json({ error: ERRO_GENERICO });
  }
};
