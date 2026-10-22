// Ajudantes da ZuckPay (API v3). Arquivos que começam com "_" não viram rota na Vercel.
//
// Variáveis de ambiente (Vercel → Settings → Environment Variables):
//   ZUCKPAY_CLIENT_ID      → Client ID (painel ZuckPay → Desenvolvedores → Credenciais API)
//   ZUCKPAY_CLIENT_SECRET  → Client Secret
//
// O "www" é obrigatório: sem ele a ZuckPay redireciona e transforma POST em GET.
const BASE = 'https://www.zuckpay.com.br/conta';

function credenciais() {
  const id = (process.env.ZUCKPAY_CLIENT_ID || '').trim();
  const secret = (process.env.ZUCKPAY_CLIENT_SECRET || '').trim();
  return id && secret ? { id, secret } : null;
}

async function zuck(method, path, { query, body } = {}) {
  const c = credenciais();
  if (!c) return { ok: false, status: 503, data: { error: 'doacoes_fechadas' } };
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query || {})) url.searchParams.set(k, String(v));
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url.toString(), {
      method,
      redirect: 'error',
      signal: ctrl.signal,
      headers: {
        Authorization: 'Basic ' + Buffer.from(c.id + ':' + c.secret, 'utf8').toString('base64'),
        Accept: 'application/json',
        'User-Agent': 'FocinhoFeliz/1.0',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    let data = {};
    try { data = await r.json(); } catch (_) { /* resposta sem JSON */ }
    return { ok: r.ok, status: r.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function zuckError(data) {
  return (data && (data.message || data.error)) || '';
}

module.exports = { credenciais, zuck, zuckError };
