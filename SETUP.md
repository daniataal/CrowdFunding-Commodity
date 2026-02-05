# Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Database

Create a PostgreSQL database and update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/commodity_crowdfunding?schema=public"
```

### 3. Generate Prisma Client and Run Migrations
```bash
pnpm prisma generate
pnpm prisma db push
```

### 4. Create Admin User

You can create an admin user using Prisma Studio:
```bash
pnpm prisma studio
```

Or use SQL directly:
```sql
-- First, generate a bcrypt hash for your password (use an online tool or Node.js)
-- Example password: "admin123"
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO users (id, email, name, "password_hash", role, "kyc_status", "wallet_balance", "created_at", "updated_at")
VALUES (
  'admin-001',
  'admin@example.com',
  'Admin User',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123
  'ADMIN',
  'APPROVED',
  0,
  NOW(),
  NOW()
);
```

### 2. Configure Environment (`.env`)
Create or edit the `.env` file on your server:

```env
# Set this to your VM's Public IP Address
DOMAIN_NAME=151.145.85.174

# Email for Let's Encrypt (unused for internal IP certs, but good to keep)
ACME_EMAIL=your-email@example.com

# Auth Configuration
NEXTAUTH_URL=https://${DOMAIN_NAME}
AUTH_TRUST_HOST=true
AUTH_SECRET=changeme_to_something_secure
DATABASE_URL=postgresql://postgres:commodity_password@postgres:5432/commodity_crowdfunding?schema=public
```

### 3. Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. Accessing the Site
*   **HTTPS**: `https://151.145.85.174`
    *   *Note: You will see a "Not Secure" warning because it is a self-signed certificate on a raw IP. This is normal. Click "Advanced" -> "Proceed".*
*   **HTTP**: `http://151.145.85.174:3000` (Direct to app, no SSL)

### 5. Set Auth Secret

Generate a secure secret:
```bash
openssl rand -base64 32
```

Add to `.env`:
```env
AUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 6. Run Development Server
```bash
pnpm dev
```

## Docker Setup

### Build and Run
```bash
docker-compose up -d
```

### Run Migrations
```bash
docker exec -it commodity-app /app/node_modules/.bin/prisma migrate deploy
```

### View Logs
```bash
docker-compose logs -f app
```

## Kubernetes Setup

### 1. Update Secrets
Edit `k8s/secrets.yaml` with your actual values.

### 2. Apply Manifests
```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 3. Check Status
```bash
kubectl get pods
kubectl get services
kubectl get ingress
```

## Testing the Application

1. **Register a new user**: Navigate to `/register`
2. **Login**: Use `/login`
3. **Complete KYC**: Go to `/kyc-verification` and upload documents
4. **Admin approval**: Login as admin and go to `/admin/users` to approve KYC
5. **Create a deal**: As admin, go to `/admin/deals/new`
6. **Invest**: As a user, browse marketplace and invest in deals
7. **Deposit funds**: Go to wallet and deposit funds

## Common Issues

### Database Connection Error
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists

### Prisma Client Not Generated
```bash
pnpm prisma generate
```

### Migration Issues
```bash
pnpm prisma migrate reset  # WARNING: This deletes all data
pnpm prisma migrate dev
```

### Auth Issues
- Ensure `AUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies

## Production Checklist

- [ ] Set strong `AUTH_SECRET`
- [ ] Use production database (not localhost)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Enable HTTPS
- [ ] Set up proper file storage (S3, etc.) for document uploads
- [ ] Configure email service for password resets
- [ ] Set up payment gateway integration
- [ ] Configure monitoring and logging
- [ ] Set up backups for database
- [ ] Review and update security settings

