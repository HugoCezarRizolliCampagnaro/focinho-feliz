// Camada única de pagamento: o resto do site não precisa saber qual gateway está ligado.
// Se as chaves da ZuckPay estiverem na Vercel, usa a ZuckPay; senão, o Asaas; senão, doações fechadas.

const zp = require('./_zuckpay');
const as = require('./_asaas');

function gateway() {
  if (zp.credenciais()) return 'zuckpay';
  if (as.apiKey()) return 'asaas';
  return null;
}

function hojeBR() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function imagemQr(img) {
  if (!img) return null;
  return /^(data:|https:)/.test(img) ? img : 'data:image/png;base64,' + img;
}

class ErroGateway extends Error {
  constructor(msg, status, dadosInvalidos) {
    super(msg);
    this.status = status;
    this.dadosInvalidos = !!dadosInvalidos;
  }
}

// ---------- Criar Pix ----------
async function criarPix({ valor, nome, email, telefone, cpf, mensal, ref }) {
  const descricao = mensal ? 'Doação mensal Focinho Feliz' : 'Doação Focinho Feliz';
  const g = gateway();

  if (g === 'zuckpay') {
    const r = await zp.zuck('POST', '/v3/pix/qrcode', {
      body: { nome, cpf, email, telefone, valor, descricao, external_id_client: ref }
    });
    if (!r.ok) throw new ErroGateway('ZuckPay ' + r.status + ': ' + zp.zuckError(r.data), r.status, r.status === 400);
    const id = r.data.transactionId || r.data.id;
    if (!id || !r.data.qrcode) throw new ErroGateway('ZuckPay sem transactionId/qrcode. Campos: ' + Object.keys(r.data), 502);
    return { id: String(id), copiaECola: String(r.data.qrcode), qrImage: imagemQr(r.data.qrcode_image) };
  }

  if (g === 'asaas') {
    const busca = await as.asaas('/customers?cpfCnpj=' + cpf + '&limit=1', { method: 'GET' });
    let customer = busca.ok && busca.data && Array.isArray(busca.data.data) && busca.data.data[0] && busca.data.data[0].id;
    if (!customer) {
      const novo = await as.asaas('/customers', {
        method: 'POST',
        body: JSON.stringify({ name: nome, cpfCnpj: cpf, email, mobilePhone: telefone, notificationDisabled: true })
      });
      if (!novo.ok || !novo.data.id) throw new ErroGateway('Asaas cliente ' + novo.status + ': ' + as.asaasError(novo.data), novo.status, novo.status === 400);
      customer = novo.data.id;
    }
    const cob = await as.asaas('/payments', {
      method: 'POST',
      body: JSON.stringify({ customer, billingType: 'PIX', value: valor, dueDate: hojeBR(), description: descricao, externalReference: ref })
    });
    if (!cob.ok || !cob.data.id) throw new ErroGateway('Asaas cobrança ' + cob.status + ': ' + as.asaasError(cob.data), cob.status);
    const qr = await as.asaas('/payments/' + encodeURIComponent(cob.data.id) + '/pixQrCode', { method: 'GET' });
    if (!qr.ok || !qr.data.payload) throw new ErroGateway('Asaas QR ' + qr.status + ': ' + as.asaasError(qr.data), qr.status);
    return { id: String(cob.data.id), copiaECola: String(qr.data.payload), qrImage: imagemQr(qr.data.encodedImage) };
  }

  throw new ErroGateway('doacoes_fechadas', 503);
}

// ---------- Status ----------
async function statusPix(id) {
  const g = gateway();
  if (g === 'zuckpay') {
    const r = await zp.zuck('GET', '/v3/pix/status', { query: { transactionId: id } });
    if (!r.ok) return { paid: false, expired: false, status: 'UNKNOWN' };
    const s = String(r.data.status || 'PENDING').toUpperCase();
    return { paid: s === 'PAID', expired: ['EXPIRADO', 'EXPIRED', 'FAILED', 'REFUSED', 'REFUNDED', 'CHARGEBACK'].includes(s), status: s };
  }
  if (g === 'asaas') {
    const r = await as.asaas('/payments/' + encodeURIComponent(id) + '/status', { method: 'GET' });
    if (!r.ok) return { paid: false, expired: false, status: 'UNKNOWN' };
    const s = String(r.data.status || 'PENDING').toUpperCase();
    return {
      paid: ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(s),
      expired: ['REFUNDED', 'REFUND_REQUESTED', 'REFUND_IN_PROGRESS', 'CHARGEBACK_REQUESTED', 'DELETED'].includes(s),
      status: s
    };
  }
  throw new ErroGateway('doacoes_fechadas', 503);
}

// ---------- Somar doações pagas num período (AAAA-MM-DD, inclusive) ----------
// Só conta cobranças criadas pelo site (referência começando com "ff-").
async function somarDoacoes(inicio, fim) {
  const g = gateway();
  let total = 0;
  let doacoes = 0;

  if (g === 'zuckpay') {
    // Filtra no código (e não só na ZuckPay) pra não depender do formato exato dos filtros.
    let cursor;
    const resumoLog = [];
    for (let pagina = 0; pagina < 60; pagina++) {
      const query = { date_from: inicio, date_to: fim, limit: 50 };
      if (cursor) query.cursor = cursor;
      const r = await zp.zuck('GET', '/v3/transactions', { query });
      if (!r.ok) throw new ErroGateway('ZuckPay lista ' + r.status + ': ' + zp.zuckError(r.data), r.status);
      const lista = Array.isArray(r.data.transactions) ? r.data.transactions
        : Array.isArray(r.data.data) ? r.data.data : [];
      for (const t of lista) {
        const status = String(t.status || '').toUpperCase();
        const tipo = String(t.type || '').toUpperCase();
        const ext = String(t.external_id_client || t.externalIdClient || t.external_id || '');
        resumoLog.push(status + '/' + (tipo || '-') + '/' + (ext ? ext.slice(0, 3) : 'sem-ext'));
        if (status !== 'PAID' || tipo === 'WITHDRAW') continue;
        // Conta toda venda paga da conta: a ZuckPay troca a referência "ff-" quando o Pix é pago,
        // e essa conta é usada só pelo Focinho Feliz.
        total += Number(t.amount ?? t.valor ?? t.value) || 0;
        doacoes += 1;
      }
      const pag = r.data.pagination || {};
      if (!pag.has_more || !pag.next_cursor) break;
      cursor = pag.next_cursor;
    }
    // Diagnóstico sem dados pessoais: status/tipo/prefixo da referência de cada transação.
    console.log('Resumo ZuckPay ' + inicio + '..' + fim + ': ' + (resumoLog.join(', ') || 'nenhuma transação'));
    return { total: Math.round(total * 100) / 100, doacoes };
  }

  if (g === 'asaas') {
    for (const status of ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']) {
      for (let pagina = 0; pagina < 20; pagina++) {
        const q = `?status=${status}&paymentDate%5Bge%5D=${inicio}&paymentDate%5Ble%5D=${fim}&limit=100&offset=${pagina * 100}`;
        const r = await as.asaas('/payments' + q, { method: 'GET' });
        if (!r.ok) throw new ErroGateway('Asaas lista ' + r.status, r.status);
        const lista = Array.isArray(r.data.data) ? r.data.data : [];
        for (const p of lista) {
          if (String(p.externalReference || '').startsWith('ff-')) {
            total += Number(p.value) || 0;
            doacoes += 1;
          }
        }
        if (!r.data.hasMore || lista.length < 100) break;
      }
    }
    return { total: Math.round(total * 100) / 100, doacoes };
  }

  throw new ErroGateway('doacoes_fechadas', 503);
}

module.exports = { gateway, criarPix, statusPix, somarDoacoes, ErroGateway, hojeBR };
