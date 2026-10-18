// Ajudantes da SigiloPay usados pelas funções em api/pix/.
// Arquivos que começam com "_" não viram rota na Vercel.

const BASE = 'https://app.sigilopay.com.br/api/v1/gateway';

function keys() {
  const pub = process.env.SIGILOPAY_PUBLIC_KEY;
  const sec = process.env.SIGILOPAY_SECRET_KEY;
  return pub && sec ? { 'x-public-key': pub, 'x-secret-key': sec } : null;
}

// Procura o primeiro campo que existir entre vários nomes possíveis
// (ex: "pix.code", "pixCode", "qrcode"), pra aguentar variações da resposta.
function pick(obj, paths) {
  for (const p of paths) {
    const v = p.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

async function sigilo(path, options) {
  const headers = keys();
  if (!headers) return { ok: false, status: 503, data: { error: 'doacoes_fechadas' } };
  const r = await fetch(BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers, ...(options && options.headers) }
  });
  let data = {};
  try { data = await r.json(); } catch (_) { /* resposta sem JSON */ }
  return { ok: r.ok, status: r.status, data };
}

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = {}; } }
  return b && typeof b === 'object' ? b : {};
}

module.exports = { keys, pick, sigilo, readBody };
