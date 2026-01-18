# Paperless Hell Fixer (MVP)

Upload een brief (PDF of foto), laat de app OCR/text-extractie doen, en krijg **simpele acties in het Nederlands** (met deadlines).

## Tech stack (zoals gevraagd)
- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- PostgreSQL + Prisma
- NextAuth (Credentials) + bcrypt
- Local file storage in `/uploads` (abstracteerbaar naar S3)
- OCR: Tesseract.js (server-side)
- PDF text extraction: `pdf-parse`
- LLM: OpenAI API (`OPENAI_API_KEY`) + JSON output + Zod validatie
- Background processing: DB queue + Node worker (`scripts/worker.ts`)

## Setup (lokaal)

### 1) Install
```bash
cd paperless-hell-fixer
npm install
```

### 2) Database (simpel testen met Docker)
Als je Docker Desktop hebt:

```bash
docker compose up -d
```

Dit start Postgres op `localhost:5432` met:
- user: `postgres`
- password: `postgres`
- database: `paperless_hell_fixer`

### 2) Env vars
Maak een `.env` in de project root (zelfde map als `package.json`) en kopieer de keys uit `env.example`.

Benodigd:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `OPENAI_API_KEY`

Optioneel:
- `OPENAI_MODEL` (default: `gpt-4o-mini`)

### 3) Database + migratie + seed
Zorg dat je Postgres draait en dat `DATABASE_URL` klopt, dan:

```bash
npm run db:migrate
npm run db:seed
```

Let op: `db:migrate` kan automatisch de seed draaien (Prisma gedrag). `db:seed` is er ook los voor gemak.

Seed user:
- email: `test@test.com`
- password: `Test123!`

### 4) Start de app
In terminal 1:
```bash
npm run dev
```

In terminal 2 (worker):
```bash
npm run worker
```

Ga daarna naar `http://localhost:3000`.

## Hoe het werkt (MVP flow)
1. Upload via dashboard → `POST /api/upload`
2. DB rows: `Document` + `ProcessingJob(PENDING)`
3. Worker pakt 1 job → OCR/pdf-parse → OpenAI JSON → schrijft `Document` velden + maakt `ActionItem` records
4. Dashboard pollt elke 5s en toont “Processing…” tot DONE/FAILED

## Extensie: S3 storage
De storage is geabstraheerd via `src/lib/storage/types.ts`.
Voor S3:
- Voeg `S3StorageProvider` toe (AWS SDK).
- Laat `getStorage()` switchen o.b.v. env var.
- Sla S3 key + bucket op in `Document.filePath` (of aparte kolommen).

## Extensie: productie OCR
Tesseract.js is prima voor MVP maar kan traag zijn.
Voor productie:
- OCR als aparte worker-service (autoscaling)
- Of gebruik managed OCR (bijv. AWS Textract / Google Vision)
- Voeg caching toe op basis van file hash

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
