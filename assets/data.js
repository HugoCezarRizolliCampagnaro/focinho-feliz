/*
  DADOS DO SITE — edite aqui sem mexer no resto do código.

  ATENÇÃO: tudo abaixo é EXEMPLO. Troque pelos bichos, valores e relatórios
  reais antes de liberar as doações (antes de colocar as chaves da SigiloPay na Vercel).
*/
window.SITE = {
  nome: 'Focinho Feliz',
  cidade: '[sua cidade]',
  instagram: '', // ex: 'focinhofeliz' (sem @)
  whatsapp: '',  // ex: '5549999999999' (com DDI e DDD, só números)
  email: '',     // e-mail de contato do projeto

  valorMinimo: 5,
  valores: [10, 25, 50, 100],
  impactos: {
    10: 'ajuda a encher o pote de ração de um bichinho.',
    25: 'ajuda a comprar vermífugo e antipulgas.',
    50: 'ajuda a pagar uma consulta no veterinário.',
    100: 'ajuda a castrar um bichinho e evitar novas ninhadas na rua.',
    outro: 'ajuda no que os bichinhos mais precisarem no mês.'
  },

  // Meta do mês (por enquanto manual; depois vem do banco de dados)
  meta: { mes: 'Outubro', valor: 1500, arrecadado: 960 },

  // status: 'rec' = em recuperação | 'adocao' = pronto pra adoção | 'adotado'
  // tipo: 'cachorro' | 'gato' | 'outro'
  // foto: caminho da imagem, ex: 'assets/fotos/thor.jpg' (vazio = espaço reservado)
  animais: [
    { nome: 'Gatinho sem nome (por enquanto)', tipo: 'gato', especie: 'Gato filhote', status: 'adocao', statusLabel: 'Procurando um lar', historia: 'Foi encontrado sozinho na rua, ainda filhote. Hoje está seguro e sendo cuidado, mas ainda precisa de ração e de um lar definitivo. Qualquer valor ajuda a encher o pote dele.', foto: 'assets/fotos/gatinho-sem-nome.jpg' },
    { nome: 'Ninhada da casinha velha', tipo: 'cachorro', especie: 'Filhotes', status: 'rec', statusLabel: 'Em recuperação', historia: 'Encontramos esses filhotes abandonados numa casinha velha. A mãe não estava por perto, e eles não podiam ficar ali passando frio e fome. No meio deles tinha até um gatinho perdido, que veio junto. Agora estão protegidos, e pra crescerem saudáveis vão precisar de ração de filhote, vermífugo e vacinas.', foto: 'assets/fotos/ninhada-casinha-velha.jpg' }
  ],

  // Relatórios mensais (o primeiro é o mais recente)
  // foto: foto da compra (sacos de ração, remédios...), ex: 'assets/compras/out-racao.jpg'
  relatorios: [
    {
      mes: 'Outubro', emAndamento: true, entrou: 960, doacoes: 41, video: '',
      gastos: [
        { item: 'Ração', valor: 520, foto: '' },
        { item: 'Vermífugo e antipulgas', valor: 96, foto: '' },
        { item: 'Veterinário', valor: 150, foto: '' },
        { item: 'Taxa do Pix', valor: 67.2, taxa: true }
      ]
    },
    {
      mes: 'Setembro', entrou: 1210, doacoes: 53, video: '',
      gastos: [
        { item: 'Ração', valor: 610, foto: '' },
        { item: 'Vermífugo e antipulgas', valor: 84, foto: '' },
        { item: 'Veterinário', valor: 220, foto: '' },
        { item: 'Castração', valor: 180, foto: '' },
        { item: 'Taxa do Pix', valor: 84.7, taxa: true }
      ]
    },
    {
      mes: 'Agosto', entrou: 740, doacoes: 30, video: '',
      gastos: [
        { item: 'Ração', valor: 450, foto: '' },
        { item: 'Vermífugo e antipulgas', valor: 60, foto: '' },
        { item: 'Veterinário', valor: 90, foto: '' },
        { item: 'Taxa do Pix', valor: 51.8, taxa: true }
      ]
    }
  ]
};
