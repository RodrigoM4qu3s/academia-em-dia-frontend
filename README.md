
# Academia em Dia - Sistema de Gestão para Academias

Sistema completo para gerenciamento de academias, escolas de dança e estúdios de pilates.

## Configuração do Projeto

### Requisitos

- Node.js 18 ou superior
- NPM ou Yarn

### Frontend (React)

1. Clone o repositório
2. Copie o arquivo `.env.example` para `.env.local`
3. Configure as variáveis de ambiente com suas credenciais do Supabase:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```
4. Instale as dependências:
   ```
   npm install
   ```
5. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```

### Backend (NestJS)

1. Navegue até a pasta do backend:
   ```
   cd backend
   ```
2. Copie o arquivo `.env.example` para `.env`
3. Configure as variáveis de ambiente com suas credenciais:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
   SUPABASE_JWT_SECRET=seu-jwt-secret
   PORT=3000
   ```
4. Instale as dependências:
   ```
   npm install
   ```
5. Inicie o servidor de desenvolvimento:
   ```
   npm run start:dev
   ```

## Banco de Dados

Execute as seguintes migrações no Supabase SQL Editor:

```sql
-- Tabela de usuários vinculada ao auth.users
create table public.usuarios (
  id uuid primary key references auth.users on delete cascade,
  nome text not null,
  email text not null,
  role text default 'Administrador',
  academy_id uuid not null,
  created_at timestamp default now()
);

-- Configuração de RLS (Row Level Security)
alter table usuarios enable row level security;
create policy "próprio usuário"
  on usuarios for select using ( auth.uid() = id );
```

## Funcionalidades

- Sistema de autenticação completo (login/cadastro)
- Dashboard com indicadores de performance
- Gerenciamento de alunos
- Controle de mensalidades
- Relatórios financeiros

## Licença

Todos os direitos reservados.
