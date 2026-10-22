(function () {
  const S = window.SITE;
  const page = document.body.dataset.page;

  // ---------- Ícones ----------
  const ICON = {
    paw: '<svg class="icon icon-fill" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="6" cy="10" rx="2" ry="2.6"/><ellipse cx="10" cy="6" rx="2" ry="2.6"/><ellipse cx="14" cy="6" rx="2" ry="2.6"/><ellipse cx="18" cy="10" rx="2" ry="2.6"/><path d="M12 11c-3 0-6 4-6 6.5 0 2 1.6 2.5 3 2.5 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.4 0 3-.5 3-2.5C18 15 15 11 12 11z"/></svg>',
    heart: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    camera: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    arrow: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    receipt: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
    play: '<svg class="icon icon-fill" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    insta: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/></svg>',
    chat: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.5-4.2A8 8 0 1 1 8.6 18.6z"/></svg>',
    mail: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    home: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/></svg>',
    lock: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
  };
  window.ICON = ICON;

  // ---------- Utilidades ----------
  const brl = (n, cents) => 'R$ ' + Number(n).toLocaleString('pt-BR', cents ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 2 });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  window.FF = { brl, esc, $, $$ };

  // ---------- Cabeçalho e rodapé ----------
  const nav = [
    { href: 'index.html#como-funciona', label: 'Como funciona', id: 'como' },
    { href: 'bichos.html', label: 'Os bichos', id: 'bichos' },
    { href: 'contas.html', label: 'Prestação de contas', id: 'contas' }
  ];
  const header = $('#site-header');
  if (header) {
    header.className = 'site-header';
    header.innerHTML = `
      <div class="container">
        <a class="logo" href="index.html"><span class="logo-mark">${ICON.paw}</span><span class="logo-name">${esc(S.nome)}</span></a>
        ${page === 'doar'
          ? `<a class="btn btn-link" href="index.html" style="color:var(--ink);text-decoration:none">${ICON.back}Voltar pro site</a>`
          : `<nav class="nav" aria-label="Principal">
              ${nav.map((n) => `<a href="${n.href}"${n.id === page ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}
              <a class="btn btn-ink" href="index.html#doar">${ICON.heart}Quero doar</a>
            </nav>`}
      </div>`;
  }
  const footer = $('#site-footer');
  if (footer) {
    footer.className = 'site-footer';
    const links = [];
    if (S.instagram) links.push(`<a href="https://instagram.com/${esc(S.instagram)}" target="_blank" rel="noopener">${ICON.insta}@${esc(S.instagram)}</a>`);
    if (S.whatsapp) links.push(`<a href="https://wa.me/${esc(S.whatsapp)}" target="_blank" rel="noopener">${ICON.chat}WhatsApp</a>`);
    if (S.email) links.push(`<a href="mailto:${esc(S.email)}">${ICON.mail}${esc(S.email)}</a>`);
    footer.innerHTML = `
      <div class="container">
        <div class="stack" style="gap:6px">
          <span class="footer-name">${esc(S.nome)}</span>
          <span style="color:var(--muted-on-dark);font-size:15px">Resgate independente feito com carinho.</span>
        </div>
        <div class="footer-links">${links.join('')}</div>
      </div>`;
  }

  // ---------- Card de bicho ----------
  function photoHTML(a, cls) {
    const tint = 'tint-' + a.status;
    if (a.foto) return `<div class="photo ${tint} ${cls || ''}"><img src="${esc(a.foto)}" alt="Foto de ${esc(a.nome)}" loading="lazy"></div>`;
    return `<div class="photo ${tint} ${cls || ''}" role="img" aria-label="Foto de ${esc(a.nome)} em breve">${ICON.camera}<span>Foto real de ${esc(a.nome)}</span></div>`;
  }
  function animalCard(a) {
    let actions = '';
    if (a.status === 'rec') actions = `<a class="btn btn-accent btn-sm" href="index.html#doar">Apadrinhar</a>`;
    if (a.status === 'adocao') actions = `<a class="btn btn-ink btn-sm" href="${S.whatsapp ? 'https://wa.me/' + esc(S.whatsapp) + '?text=' + encodeURIComponent('Oi! Quero adotar ' + a.nome) : '#'}"${S.whatsapp ? ' target="_blank" rel="noopener"' : ''}>Quero adotar</a><a class="btn btn-link" href="index.html#doar" style="color:var(--ink)">Apadrinhar</a>`;
    if (a.status === 'adotado') actions = `<span class="muted" style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px">${ICON.home}Já está num lar</span>`;
    return `
      <article class="animal-card">
        ${photoHTML(a)}
        <div class="animal-body">
          <div class="row" style="align-items:center;justify-content:space-between;gap:8px">
            <span class="chip tint-${a.status}">${esc(a.statusLabel)}</span>
            <span class="muted" style="font-size:14px;font-weight:500">${esc(a.especie)}</span>
          </div>
          <h3>${esc(a.nome)}</h3>
          <p>${esc(a.historia)}</p>
          ${a.votacao && a.id ? `<div class="vote" data-vote="${esc(a.id)}" hidden></div>` : ''}
          <div class="animal-actions">${actions}</div>
        </div>
      </article>`;
  }

  // ---------- Votação de nome ----------
  const votoCache = {};
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* sem storage, tudo bem */ } };

  function pintarVoto(el, a, dados, aviso) {
    const v = a.votacao;
    const jaVotou = lsGet('ff-voto-' + a.id);
    const total = dados.total || 0;
    const contagem = (o) => (dados.votos && dados.votos[o]) || 0;
    let corpo;
    if (jaVotou || aviso) {
      const maior = Math.max(1, ...v.opcoes.map(contagem));
      corpo = v.opcoes.map((o) => {
        const n = contagem(o);
        const pct = total ? Math.round((n / total) * 100) : 0;
        const lider = n === maior && n > 0;
        return `<div class="vote-row${o === jaVotou ? ' mine' : ''}${lider ? ' lead' : ''}">
            <div class="row" style="justify-content:space-between;gap:8px"><span>${esc(o)}${lider ? ' <small>(na frente)</small>' : ''}${o === jaVotou ? ' <small>(seu voto)</small>' : ''}</span><span>${pct}%</span></div>
            <div class="bar"><span style="width:${pct}%"></span></div>
          </div>`;
      }).join('') + `<p class="vote-note">${esc(aviso || 'Valeu por votar!')} ${total === 1 ? '1 voto' : total + ' votos'} até agora.</p>`;
    } else {
      corpo = `<div class="vote-opts">${v.opcoes.map((o) => `<button type="button" class="pill" data-opcao="${esc(o)}">${esc(o)}</button>`).join('')}</div>
        <p class="vote-note">${total === 1 ? '1 voto' : total + ' votos'} até agora. Um voto por pessoa.</p>`;
    }
    el.innerHTML = `<p class="vote-title">${esc(v.pergunta || 'Ajude a escolher o nome!')}</p>${corpo}`;
    el.hidden = false;
  }

  function ligarVotacoes(raiz) {
    $$('[data-vote]', raiz).forEach((el) => {
      const a = S.animais.find((x) => x.id === el.dataset.vote);
      if (!a) return;
      const pronto = votoCache[a.id]
        ? Promise.resolve(votoCache[a.id])
        : fetch('/api/votos?bicho=' + encodeURIComponent(a.id)).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      pronto.then((dados) => {
        if (!dados) return; // votação ainda não configurada: fica escondida
        votoCache[a.id] = dados;
        pintarVoto(el, a, dados);
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-opcao]');
        if (!b || lsGet('ff-voto-' + a.id)) return;
        $$('[data-opcao]', el).forEach((x) => (x.disabled = true));
        b.textContent = 'Votando...';
        fetch('/api/votos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bicho: a.id, opcao: b.dataset.opcao }) })
          .then((r) => r.json().then((j) => ({ status: r.status, j })))
          .then(({ status, j }) => {
            if (status === 200 || status === 409) {
              lsSet('ff-voto-' + a.id, status === 200 ? b.dataset.opcao : (lsGet('ff-voto-' + a.id) || 'sim'));
              votoCache[a.id] = j;
              pintarVoto(el, a, j, status === 409 ? j.error : null);
            } else {
              pintarVoto(el, a, votoCache[a.id] || { votos: {}, total: 0 });
              el.insertAdjacentHTML('beforeend', `<p class="error-text">${esc(j.error || 'Não deu pra votar agora.')}</p>`);
            }
          })
          .catch(() => { pintarVoto(el, a, votoCache[a.id] || { votos: {}, total: 0 }); });
      });
    });
  }

  // ---------- Total do mês (Asaas) ----------
  // Devolve { mes, total, doacoes } ou null se o resumo não estiver disponível.
  function resumoDoMes(desde) {
    return fetch('/api/resumo' + (desde ? '?desde=' + encodeURIComponent(desde) : ''))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j && typeof j.total === 'number' ? j : null))
      .catch(() => null);
  }

  // ---------- Página inicial ----------
  function initHome() {
    // Meta: mostra o valor do data.js e depois troca pelo total real do mês, vindo do Asaas
    const m = S.meta;
    function pintarMeta(arrecadado) {
      const pct = Math.min(100, Math.round((arrecadado / Math.max(1, m.valor)) * 100));
      const cheio = arrecadado >= m.valor;
      $$('[data-meta-pct]').forEach((el) => (el.textContent = pct + '%'));
      $$('[data-meta-bar]').forEach((el) => requestAnimationFrame(() => (el.style.width = pct + '%')));
      $$('[data-meta-bar-wrap]').forEach((el) => el.setAttribute('aria-valuenow', pct));
      $('[data-meta-title]').textContent = `Meta do pote de ração: ${brl(m.valor)}`;
      $('[data-meta-got]').textContent = `${brl(arrecadado)} arrecadados`;
      $('[data-meta-left]').textContent = cheio
        ? 'Esse pote já está garantido! O que entrar agora já começa o próximo.'
        : `faltam ${brl(Math.max(0, m.valor - arrecadado))}`;
    }
    pintarMeta(m.arrecadado);
    resumoDoMes(m.desde).then((r) => { if (r) pintarMeta(r.total); });

    // Doação
    const st = { mensal: !!S.doacaoMensal, amount: 25, custom: '' };
    $('#freq-group').hidden = !S.doacaoMensal;
    $('#sum-freq-row').hidden = !S.doacaoMensal;
    const amountsEl = $('#amounts');
    amountsEl.innerHTML = S.valores.map((v) => `<button type="button" class="pill" data-amount="${v}">R$ ${v}</button>`).join('') +
      `<button type="button" class="pill small" data-amount="outro">Outro valor</button>`;
    const customWrap = $('#custom-wrap');
    const customInput = $('#custom-value');
    const customBox = $('#custom-box');
    const customErr = $('#custom-error');
    $('#min-label').textContent = brl(S.valorMinimo);
    customErr.textContent = `O valor mínimo é ${brl(S.valorMinimo)}.`;

    function render() {
      const isCustom = st.amount === 'outro';
      const typed = parseInt(st.custom, 10);
      const value = isCustom ? (Number.isFinite(typed) ? typed : 0) : st.amount;
      const valid = value >= S.valorMinimo;
      $$('#amounts .pill').forEach((b) => b.setAttribute('aria-pressed', String(String(st.amount) === b.dataset.amount)));
      $('#freq-mensal').setAttribute('aria-pressed', String(st.mensal));
      $('#freq-unica').setAttribute('aria-pressed', String(!st.mensal));
      $('#mensal-note').hidden = !st.mensal;
      customWrap.hidden = !isCustom;
      const err = isCustom && st.custom !== '' && !valid;
      customErr.hidden = !err;
      customBox.classList.toggle('error', err);
      $('#impact').innerHTML = valid
        ? `<strong>Com ${brl(value)} você</strong> ${esc(isCustom ? S.impactos.outro : S.impactos[value] || S.impactos.outro)}`
        : `<strong>Digite um valor</strong> a partir de ${brl(S.valorMinimo)} pra continuar.`;
      $('#sum-freq').textContent = st.mensal ? 'Todo mês' : 'Uma vez só';
      $('#sum-value').innerHTML = valid ? `${brl(value)}<span style="font-size:18px;font-weight:500">${st.mensal ? '/mês' : ''}</span>` : 'R$ —';
      const cta = $('#cta-pix');
      cta.setAttribute('aria-disabled', String(!valid));
      cta.href = valid ? `doar.html?valor=${value}&mensal=${st.mensal ? 1 : 0}` : '#doar';
      $('#cta-label').textContent = valid ? `Doar ${brl(value)}${st.mensal ? ' por mês' : ''} com Pix` : 'Escolha um valor';
    }
    amountsEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-amount]');
      if (!b) return;
      st.amount = b.dataset.amount === 'outro' ? 'outro' : Number(b.dataset.amount);
      render();
      if (st.amount === 'outro') customInput.focus();
    });
    customInput.addEventListener('input', () => { st.custom = customInput.value; render(); });
    $('#freq-mensal').addEventListener('click', () => { st.mensal = true; render(); });
    $('#freq-unica').addEventListener('click', () => { st.mensal = false; render(); });
    render();

    // Bichos (prévia)
    $('#preview-animais').innerHTML = S.animais.slice(0, 3).map(animalCard).join('');
    ligarVotacoes($('#preview-animais'));

    // Relatório (prévia)
    const r = S.relatorios[0];
    if (r) {
      $('#preview-mes').textContent = 'Relatório de ' + r.mes.toLowerCase();
      const prev = r.gastos.filter((g) => !g.taxa).slice(0, 3);
      $('#preview-gastos').innerHTML = prev.length === 0
        ? `<p class="muted">Ainda não teve gastos esse mês. As primeiras compras pros bichos vão aparecer aqui.</p>`
        : prev.map((g) => `<div class="line-item"><span>${esc(g.item)}</span><span style="font-weight:700">${brl(g.valor, true)}</span></div>`).join('');
    }
  }

  // ---------- Página dos bichos ----------
  function initBichos() {
    const st = { tipo: 'todos', status: 'todos' };
    const grid = $('#grid-animais');
    function render() {
      $$('[data-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tipo === st.tipo)));
      $$('[data-status]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.status === st.status)));
      const list = S.animais.filter((a) => (st.tipo === 'todos' || a.tipo === st.tipo) && (st.status === 'todos' || a.status === st.status));
      grid.innerHTML = list.map(animalCard).join('');
      ligarVotacoes(grid);
      $('#count').textContent = list.length === 1 ? '1 bichinho' : list.length + ' bichinhos';
      $('#empty').hidden = list.length > 0;
    }
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tipo]');
      const s = e.target.closest('[data-status]');
      if (t) { st.tipo = t.dataset.tipo; render(); }
      if (s) { st.status = s.dataset.status; render(); }
      if (e.target.closest('#clear')) { st.tipo = 'todos'; st.status = 'todos'; render(); }
    });
    render();
  }

  // ---------- Prestação de contas ----------
  function initContas() {
    let idx = 0;
    const months = $('#months');
    months.innerHTML = S.relatorios.map((r, i) => `<button type="button" class="pill" data-i="${i}">${esc(r.mes)}${r.emAndamento ? ' (em andamento)' : ''}</button>`).join('');
    months.hidden = S.relatorios.length < 2; // seletor só aparece quando tiver mais de um mês
    function render() {
      const r = S.relatorios[idx];
      $$('#months .pill').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === idx)));
      const total = r.gastos.reduce((s, g) => s + g.valor, 0);
      const max = Math.max(1, ...r.gastos.map((g) => g.valor));
      $('#t-entrou').textContent = brl(r.entrou, true);
      $('#t-doacoes').textContent = r.doacoes === 0 ? 'Seja a primeira doação' : r.doacoes === 1 ? '1 doação recebida' : r.doacoes + ' doações recebidas';
      $('#t-gasto').textContent = brl(total, true);
      $('#t-saldo').textContent = brl(Math.max(0, r.entrou - total), true);
      $('#gastos').innerHTML = r.gastos.length === 0
        ? `<p class="muted">Ainda não teve gastos em ${esc(r.mes.toLowerCase())}. Cada compra pros bichos vai aparecer aqui, com o valor certinho.</p>`
        : r.gastos.map((g) => `
        <div class="stack" style="gap:8px">
          <div class="row" style="justify-content:space-between;gap:12px"><span style="font-weight:500">${esc(g.item)}</span><span style="font-weight:700">${brl(g.valor, true)}</span></div>
          <div class="bar" style="height:12px"><span style="width:${Math.round((g.valor / max) * 100)}%;${g.taxa ? 'background:#9AA3B0' : ''}"></span></div>
        </div>`).join('');
      const compras = r.gastos.filter((g) => !g.taxa);
      $('#receipts').innerHTML = compras.length === 0
        ? `<div class="receipt photo" role="img" aria-label="Fotos das compras em breve" style="grid-column:1/-1">${ICON.camera}<span style="font-size:14px">As fotos das compras aparecem aqui</span></div>`
        : compras.map((g) => g.foto
        ? `<a class="receipt photo" href="${esc(g.foto)}" target="_blank" rel="noopener" style="padding:0;border-style:solid"><img src="${esc(g.foto)}" alt="Compra: ${esc(g.item)}" loading="lazy"></a>`
        : `<div class="receipt photo" role="img" aria-label="Foto da compra de ${esc(g.item)} em breve">${ICON.camera}<span style="font-size:14px">${esc(g.item)}</span></div>`).join('');
      const video = $('#video');
      if (r.video) {
        video.innerHTML = /youtube|youtu\.be/.test(r.video)
          ? `<iframe src="${esc(r.video)}" title="Vídeo da compra de ${esc(r.mes)}" allowfullscreen></iframe>`
          : `<video src="${esc(r.video)}" controls preload="metadata"></video>`;
      } else {
        video.innerHTML = `<span class="play">${ICON.play}</span><span style="font-family:var(--display);font-size:22px;font-weight:600">Vídeo da compra de ${esc(r.mes.toLowerCase())}</span><span style="color:var(--muted-on-dark);font-size:15px">Em breve: a ração chegando e os bichos comendo</span>`;
      }
    }
    // "Quer ver alguma nota?" vira link pro contato que existir
    const pedido = $('#nota-pedido');
    const contato = S.whatsapp ? `https://wa.me/${esc(S.whatsapp)}?text=${encodeURIComponent('Oi! Queria ver uma nota da prestação de contas.')}`
      : S.instagram ? `https://instagram.com/${esc(S.instagram)}`
      : S.email ? `mailto:${esc(S.email)}` : '';
    if (contato) pedido.innerHTML = `Quer ver alguma nota? <a href="${contato}"${contato.startsWith('http') ? ' target="_blank" rel="noopener"' : ''} style="font-weight:700">Chama a gente</a> que mostramos.`;
    months.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) { idx = Number(b.dataset.i); render(); }
    });
    render();
    // O mês em andamento pega "Entrou em doações" direto do Asaas
    resumoDoMes().then((resumo) => {
      const atual = S.relatorios[0];
      if (!resumo || !atual || !atual.emAndamento || atual.mes.toLowerCase() !== resumo.mes) return;
      atual.entrou = resumo.total;
      atual.doacoes = resumo.doacoes;
      render();
    });
  }

  if (page === 'home') initHome();
  if (page === 'bichos') initBichos();
  if (page === 'contas') initContas();
})();
