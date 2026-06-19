# Probank - Frontend

Interface web do sistema de gestão de empréstimos.

## Stack

- Next.js 15 + TypeScript
- Tailwind CSS + Shadcn UI
- TanStack Query + React Hook Form + Zod

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
npm run dev
```

App em `http://localhost:3000`.

Configure `NEXT_PUBLIC_API_URL` apontando para o backend.

## Deploy

Build via Dockerfile. Passe `NEXT_PUBLIC_API_URL` como build arg.
