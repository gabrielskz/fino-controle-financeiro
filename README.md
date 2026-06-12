# Fino

Aplicação web de controle financeiro pessoal para acompanhar receitas, despesas e o saldo de cada mês.

[![Next.js](https://img.shields.io/badge/Next.js-16-111111?logo=nextdotjs)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-111111?logo=vercel)](https://vercel.com/)

## Funcionalidades

- Cadastro, login e recuperação de senha
- Receitas e despesas mensais
- Compras parceladas com criação automática das parcelas futuras
- Situação de pagamento e recebimento
- Pagamento em lote das despesas pendentes do mês
- Categorias personalizadas
- Lançamentos recorrentes
- Relatórios por período, média mensal e maiores despesas
- Exportação de dados em CSV e PDF
- Alteração de e-mail e senha dentro do aplicativo
- Exclusão permanente da conta e dos dados
- Calculadora integrada com envio do resultado para um novo lançamento
- Interface responsiva para computador e celular
- Dados isolados por usuário com Row Level Security

## Tecnologias

- Next.js, React e TypeScript
- Tailwind CSS
- Supabase Database e Auth
- Vercel

## Executar localmente

### Requisitos

- Node.js 20.9 ou superior
- Um projeto gratuito no Supabase

### Instalação

```bash
git clone https://github.com/gabrielskz/fino-controle-financeiro.git
cd fino-controle-financeiro/frontend
npm install
```

Copie o arquivo de exemplo:

```powershell
Copy-Item .env.local.example .env.local
```

Preencha o `.env.local` com as informações do seu projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
```

Execute a aplicação:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/).
2. Abra o **SQL Editor**.
3. Execute os arquivos abaixo, nesta ordem:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_installments_and_account.sql
```

4. Copie a Project URL e a Publishable key para o `.env.local`.

O SQL cria as tabelas e as políticas de segurança que permitem a cada usuário acessar somente os próprios dados.

### Atualizar um projeto já configurado

Se você já executou a migração `001`, abra o **SQL Editor** do Supabase e execute somente:

```text
supabase/migrations/002_installments_and_account.sql
```

Essa atualização adiciona os parcelamentos e a função segura usada para excluir a própria conta. Depois, publique novamente o projeto na Vercel.

### Autenticação

Para cadastro imediato, sem e-mail de confirmação:

1. Acesse **Authentication > Sign In / Providers > Email**.
2. Desative **Confirm email**.

Em **Authentication > URL Configuration**, use durante o desenvolvimento:

```text
Site URL: http://localhost:3000

Redirect URLs:
http://localhost:3000
http://localhost:3000/auth/update-password
```

Após publicar, substitua esses endereços pela URL gerada pela Vercel.

## Publicar na Vercel

1. Importe este repositório na [Vercel](https://vercel.com/).
2. Selecione `frontend` como **Root Directory**.
3. Adicione as variáveis:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

4. Clique em **Deploy**.
5. Configure a URL da Vercel em **Authentication > URL Configuration** no Supabase.

Novos commits enviados para a branch `main` são publicados automaticamente.

## Estrutura

```text
frontend/
├── app/             Páginas da aplicação
├── components/      Telas e componentes visuais
└── lib/             Integração com Supabase e utilitários

supabase/
└── migrations/      Estrutura e políticas do banco
```

## Segurança

A Publishable key do Supabase pode ser usada no frontend. A proteção dos dados é feita por autenticação e pelas políticas de Row Level Security.

Nunca publique:

- Secret key ou `service_role`
- Senha do banco
- Tokens pessoais
- Arquivo `.env.local`

## Verificação

```bash
cd frontend
npm run lint
npm run build
npm audit
```

## Licença

Projeto de uso pessoal e educacional.
