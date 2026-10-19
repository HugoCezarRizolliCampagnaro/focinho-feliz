# Focinho Feliz

Site de doações por Pix para bichinhos de rua. HTML/CSS/JS puro + funções serverless da Vercel (`api/`) para o Pix da SigiloPay.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Página inicial: meta do mês, escolha do valor, prévia dos bichos e das contas |
| `bichos.html` | Todos os bichos, com filtro por tipo e situação |
| `contas.html` | Prestação de contas mês a mês |
| `doar.html` | Pagamento: dados → QR code Pix → confirmação |

## Editar o conteúdo

Tudo fica em **`assets/data.js`**: nome, cidade, redes, meta do mês, bichos e relatórios.
Fotos: coloque em `assets/fotos/` e preencha o campo `foto` do bicho (ex: `assets/fotos/thor.jpg`).
Fotos das compras: em `assets/compras/` e o campo `foto` do gasto (notas fiscais não vão pro site).

> Os dados que vêm no arquivo são **exemplos**. Troque pelos reais antes de abrir as doações.

## Abrir as doações (Vercel)

Em **Settings → Environment Variables** do projeto na Vercel:

| Nome | Valor |
|---|---|
| `SIGILOPAY_PUBLIC_KEY` | chave pública da SigiloPay |
| `SIGILOPAY_SECRET_KEY` | chave secreta da SigiloPay |
| `VALOR_MINIMO` | opcional, padrão `5` |

Sem as chaves, o botão de gerar Pix mostra "As doações pelo site abrem em breve".
Depois de salvar as variáveis, faça um novo deploy (Deployments → Redeploy).

## Testar localmente

```
vercel dev
```

## Próximas fases

- Supabase: salvar cada doação, somar a meta do mês sozinho, painel para cadastrar bichos e gastos.
- Lembrete mensal por e-mail com um Pix novo para quem escolheu "Todo mês".
