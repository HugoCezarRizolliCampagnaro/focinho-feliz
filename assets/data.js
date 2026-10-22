/*
  DADOS DO SITE — edite aqui sem mexer no resto do código.

  ATENÇÃO: tudo abaixo é EXEMPLO. Troque pelos bichos, valores e relatórios
  reais antes de liberar as doações (antes de colocar a chave do Asaas na Vercel).
*/
window.SITE = {
  nome: 'Focinho Feliz',
  instagram: '', // ex: 'focinhofeliz' (sem @)
  whatsapp: '',  // ex: '5549999999999' (com DDI e DDD, só números)
  email: '',     // e-mail de contato do projeto

  // Ligar quando estiverem prontos: lembrete mensal por e-mail e mural de doadores
  doacaoMensal: false,
  mural: false,

  valorMinimo: 5,
  valores: [10, 25, 50, 100],
  impactos: {
    10: 'ajuda a encher o pote de ração de um bichinho.',
    25: 'ajuda a comprar vermífugo e antipulgas.',
    50: 'ajuda a pagar uma consulta no veterinário.',
    100: 'ajuda a castrar um bichinho e evitar novas ninhadas na rua.',
    outro: 'ajuda no que os bichinhos mais precisarem no mês.'
  },

  // Pote de ração: a barra soma as doações recebidas desde a data "desde".
  // Comprou a ração? Troca "desde" pela data de hoje (AAAA-MM-DD) e a barra volta pra zero.
  meta: { valor: 1500, desde: '2026-10-21', arrecadado: 0 },

  // status: 'rec' = em recuperação | 'adocao' = pronto pra adoção | 'adotado'
  // tipo: 'cachorro' | 'gato' | 'outro'
  // foto: caminho da imagem, ex: 'assets/fotos/thor.jpg' (vazio = espaço reservado)
  // votacao (opcional): { pergunta, opcoes: [...] } + id único (letras minúsculas, números e hífen)
  animais: [
    { id: 'gatinho-sem-nome', votacao: { pergunta: 'Ajude a escolher o nome dele!', opcoes: ['Oreo', 'Frajola', 'Dominó', 'Chico'] }, nome: 'Gatinho sem nome (por enquanto)', tipo: 'gato', especie: 'Gato filhote', status: 'adocao', statusLabel: 'Procurando um lar', historia: 'Foi encontrado sozinho na rua, ainda filhote. Hoje está seguro e sendo cuidado, mas ainda precisa de ração e de um lar definitivo. Qualquer valor ajuda a encher o pote dele.', foto: 'assets/fotos/gatinho-sem-nome.jpg' },
    { nome: 'Ninhada da casinha velha', tipo: 'cachorro', especie: 'Filhotes', status: 'rec', statusLabel: 'Em recuperação', historia: 'Encontramos esses filhotes abandonados numa casinha velha. A mãe não estava por perto, e eles não podiam ficar ali passando frio e fome. No meio deles tinha até um gatinho perdido, que veio junto. Agora estão protegidos, e pra crescerem saudáveis vão precisar de ração de filhote, vermífugo e vacinas.', foto: 'assets/fotos/ninhada-casinha-velha.jpg' }
  ],

  // Relatórios mensais (o primeiro é o mais recente)
  // foto: foto da compra (sacos de ração, remédios...), ex: 'assets/compras/out-racao.jpg'
  relatorios: [
    // Exemplo de gasto: { item: 'Ração', valor: 120, foto: 'assets/compras/out-racao.jpg' }
    // Taxa do Pix: { item: 'Taxa do Pix', valor: 8.4, taxa: true }
    { mes: 'Outubro', emAndamento: true, entrou: 0, doacoes: 0, video: '', gastos: [] }
  ]
};
