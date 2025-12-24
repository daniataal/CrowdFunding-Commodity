# Commodity Crowdfunding Platform

A production-grade, end-to-end commodity crowdfunding platform built with Next.js 14+, PostgreSQL, Prisma, and NextAuth.js v5.

## Features

- **User Authentication**: Secure authentication with NextAuth.js v5, role-based access control (USER, ADMIN, AUDITOR)
- **KYC Verification**: Document upload and admin approval workflow
- **Marketplace**: Browse and invest in commodity deals (Agriculture, Energy, Metals)
- **Wallet Management**: Deposit, withdraw, and track transactions
- **Portfolio Dashboard**: Real-time portfolio value and profit calculations
- **Admin Portal**: Complete admin interface for deal management, user management, and system health
- **Audit Logging**: Comprehensive audit trail for all admin actions
- **Infrastructure**: Docker and Kubernetes ready

## Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Actions)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5 (Auth.js)
- **State Management**: React Query (TanStack Query)
- **Validation**: Zod
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- pnpm (or npm/yarn)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd commodity-crowdfunding-ui
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `DATABASE_URL`: PostgreSQL connection string
   - `AUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Your application URL

4. **Set up the database**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   # Or use migrations:
   # pnpm prisma migrate dev
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Create an admin user** (via Prisma Studio or SQL)
   ```bash
   pnpm prisma studio
   ```
   
   Or manually insert:
   ```sql
   INSERT INTO users (id, email, name, "password_hash", role, "kyc_status", "wallet_balance")
   VALUES (
     'admin-id',
     'admin@example.com',
     'Admin User',
     '$2a$10$...', -- bcrypt hash of password
     'ADMIN',
     'APPROVED',
     0
   );
   ```

## Docker Setup

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker exec -it commodity-app /app/node_modules/.bin/prisma migrate deploy
   ```

## Kubernetes Deployment

1. **Create secrets**
   ```bash
   kubectl apply -f k8s/secrets.yaml
   # Edit secrets.yaml with your actual values first
   ```

2. **Deploy application**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

## Project Structure

```
├── app/
│   ├── actions/          # Server Actions (investments, wallet, dashboard, marketplace)
│   ├── admin/            # Admin portal pages
│   ├── api/              # API routes
│   ├── kyc-verification/ # KYC verification page
│   ├── login/            # Authentication pages
│   ├── register/
│   └── page.tsx          # Main application page
├── components/
│   ├── admin/            # Admin-specific components
│   └── ui/               # Shadcn UI components
├── lib/
│   ├── prisma.ts         # Prisma client
│   └── providers.tsx     # React Query & Session providers
├── prisma/
│   └── schema.prisma     # Database schema
├── k8s/                  # Kubernetes manifests
├── Dockerfile
├── docker-compose.yml
└── middleware.ts         # Route protection middleware
```

## Database Schema

- **Users**: User accounts with roles, KYC status, wallet balance
- **Commodities**: Commodity deals/offerings
- **Investments**: User investments in commodities
- **Transactions**: All financial transactions (deposits, withdrawals, investments)
- **Documents**: KYC documents and commodity-related documents
- **AuditLogs**: Admin action audit trail
- **Notifications**: User notifications

## API Routes

- `/api/auth/[...nextauth]` - NextAuth.js authentication
- `/api/auth/register` - User registration
- `/api/auth/forgot-password` - Password reset
- `/api/kyc/upload` - KYC document upload
- `/api/admin/deals` - Admin deal management
- `/api/admin/users/[userId]/kyc` - KYC approval/rejection
- `/api/health` - Health check endpoint

## Server Actions

- `app/actions/investments.ts` - Investment logic
- `app/actions/wallet.ts` - Wallet operations
- `app/actions/dashboard.ts` - Portfolio calculations
- `app/actions/marketplace.ts` - Marketplace data

## Environment Variables

See `.env.example` for all required environment variables.

## Development

- **Database Studio**: `pnpm prisma studio`
- **Database Migrations**: `pnpm prisma migrate dev`
- **Generate Prisma Client**: `pnpm prisma generate`

## Production Deployment

1. Set all environment variables
2. Run database migrations
3. Build the application: `pnpm build`
4. Start the server: `pnpm start`

Or use Docker/Kubernetes as described above.

## License

MIT

