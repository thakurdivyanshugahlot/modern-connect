# Next.js Native Multi-Tenant Integration Hub

A multi-tenant Google integration hub built with Next.js 15+ (App Router), Drizzle ORM, and Corsair SDKs. This project utilizes native Next.js features like Server Actions and React Server Components (RSCs) to manage data flow without tRPC.

## Folder Structure

```text
modern-connect/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── actions/              # Server Actions (Mutations)
│   │   │   └── gmail.ts          # Gmail-specific actions (send, refresh, draft)
│   │   ├── api/                  # Route Handlers
│   │   │   └── webhooks/         # Corsair/Google webhook endpoints
│   │   ├── gmail/                # Gmail Inbox feature
│   │   │   ├── compose-modal.tsx # Client Component for email composition
│   │   │   └── page.tsx          # Server Component for inbox display
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page / Tenant selection
│   ├── server/                   # Server-side logic
│   │   ├── db/                   # Database configuration
│   │   │   ├── index.ts          # Drizzle connection & client
│   │   │   ├── queries.ts        # Reusable Drizzle queries (Fetches)
│   │   │   └── schema.ts         # Database schema definitions
│   │   └── lib/                  # Shared libraries
│   │       └── corsair.ts        # Corsair SDK initialization
│   └── env.ts                    # Type-safe environment variables (T3 Env)
├── public/                       # Static assets
├── drizzle/                      # Generated migrations
├── .env                          # Local environment variables
├── docker-compose.yaml           # Local Postgres 17 infrastructure
├── drizzle.config.ts             # Drizzle Kit configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Key Technologies

- **Next.js 15 (App Router)**: Native RSCs and Server Actions.
- **Drizzle ORM**: Type-safe database interactions.
- **PostgreSQL 17**: Robust relational data storage.
- **Corsair SDK**: Seamless integration with Google Services (Gmail, Calendar).
- **T3 Env**: Type-safe environment variable management.

## Getting Started

1. **Infrastructure**: Start the local database:
   ```bash
   docker compose up -d
   ```

2. **Database**: Generate and apply migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

3. **Development**: Run the Next.js dev server:
   ```bash
   npm run dev
   ```
