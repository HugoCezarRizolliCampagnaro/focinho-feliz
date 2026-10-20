// Ajudantes do Asaas usados pelas funções em api/pix/.
// Arquivos que começam com "_" não viram rota na Vercel.
//
// Variáveis de ambiente (Vercel → Settings → Environment Variables):
//   ASAAS_API_KEY  → chave de API do Asaas (de teste ou de produção)
//   ASAAS_SANDBOX  → opcional: "true" força o ambiente de testes, "false" força produção.
//                    Sem ela, o ambiente é escolhido pela chave (chaves de teste têm "_hmlg_").

const PROD = 'https://api.asaas.com/v3';
const SANDBOX = 'https://api-sandbox.asaas.com/v3';

function apiKey() {
  return process.env.ASAAS_API_KEY || '';
}

function baseUrl() {
  const flag = String(process.env.ASAAS_SANDBOX || '').toLowerCase();
  if (flag === 'true') return SANDBOX;
  if (flag === 'false') return PROD;
  return apiKey().includes('_hmlg_') ? SANDBOX : PROD;
}

async function asaas(path, options) {
  const key = apiKey();
  if (!key) return { ok: false, status: 503, data: { error: 'doacoes_fechadas' } };
  const r = await fetch(baseUrl() + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'FocinhoFeliz/1.0',
      access_token: key,
      ...(options && options.headers)
    }
  });
  let data = {};
  try { data = await r.json(); } catch (_) { /* resposta sem JSON */ }
  return { ok: r.ok, status: r.status, data };
}

// Primeira mensagem de erro que o Asaas devolver (formato { errors: [{ description }] })
function asaasError(data) {
  return (data && Array.isArray(data.errors) && data.errors[0] && data.errors[0].description) || '';
}

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = {}; } }
  return b && typeof b === 'object' ? b : {};
}

// Data de hoje no fuso de Brasília, no formato AAAA-MM-DD
function hojeBR() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

module.exports = { apiKey, baseUrl, asaas, asaasError, readBody, hojeBR };
