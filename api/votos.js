// /api/votos — votação de nomes dos bichos
//   GET  /api/votos?bicho=ID          → { votos: { Nome: 3, ... }, total }
//   POST /api/votos  { bicho, opcao }  → { votos, total }   (1 voto por pessoa por bicho)
//
// Os votos ficam num Redis da Upstash, criado pela Vercel (Storage → Upstash Redis).
// A integração já cria as variáveis KV_REST_API_URL e KV_REST_API_TOKEN sozinha.
// Sem elas, a votação fica escondida no site.

const crypto = require('crypto');

const URL_REDIS = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const UM_VOTO_POR = 60 * 60 * 24 * 60; // a mesma pessoa só vota de novo depois de 60 dias
const MAX_OPCOES = 12;

async function redis(comandos) {
  const r = await fetch(URL_REDIS.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(comandos)
  });
  if (!r.ok) throw new Error('Redis ' + r.status);
  const j = await r.json();
  return j.map((x) => (x && x.error ? Promise.reject(new Error(x.error)) : x.result));
}

function contar(lista) {
  const votos = {};
  let total = 0;
  for (let i = 0; Array.isArray(lista) && i < lista.length; i += 2) {
    const n = Number(lista[i + 1]) || 0;
    votos[lista[i]] = n;
    total += n;
  }
  return { votos, total };
}

function ipDe(req) {
  const xf = String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim();
  return xf || (req.socket && req.socket.remoteAddress) || 'desconhecido';
}

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = {}; } }
  return b && typeof b === 'object' ? b : {};
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_REDIS || !TOKEN) return res.status(503).json({ error: 'votacao_fechada' });

  const bicho = String((req.method === 'GET' ? req.query && req.query.bicho : readBody(req).bicho) || '');
  if (!/^[a-z0-9-]{1,40}$/.test(bicho)) return res.status(400).json({ error: 'bicho inválido' });
  const chave = 'votos:' + bicho;

  try {
    if (req.method === 'GET') {
      const [lista] = await redis([['HGETALL', chave]]);
      return res.status(200).json(contar(lista));
    }

    if (req.method === 'POST') {
      const opcao = String(readBody(req).opcao || '').trim().slice(0, 30);
      if (!opcao) return res.status(400).json({ error: 'Escolhe um nome.' });

      // Não aceita nome novo se a lista já estiver cheia (evita encherem de bobeira)
      const [existe, qtd] = await redis([['HEXISTS', chave, opcao], ['HLEN', chave]]);
      if (!existe && Number(qtd) >= MAX_OPCOES) return res.status(400).json({ error: 'Opção inválida.' });

      // 1 voto por pessoa: guarda só um "resumo" do IP (hash), nunca o IP em si
      const quem = crypto.createHash('sha256').update(ipDe(req) + '|' + bicho + '|' + TOKEN.slice(0, 16)).digest('hex').slice(0, 32);
      const [ok] = await redis([['SET', 'votou:' + bicho + ':' + quem, '1', 'NX', 'EX', UM_VOTO_POR]]);
      if (ok !== 'OK') {
        const [lista] = await redis([['HGETALL', chave]]);
        return res.status(409).json({ error: 'Você já votou nesse bichinho. Valeu!', ...contar(lista) });
      }

      const [, lista] = await redis([['HINCRBY', chave, opcao, 1], ['HGETALL', chave]]);
      return res.status(200).json(contar(lista));
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (err) {
    console.error('Erro na votação', err);
    return res.status(502).json({ error: 'Não deu pra votar agora. Tenta de novo daqui a pouco.' });
  }
};
