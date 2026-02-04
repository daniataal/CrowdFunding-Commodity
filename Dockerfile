# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm if not available
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Keep Prisma CLI install isolated from the Next.js standalone output.
# Installing into /app can crash npm and/or accidentally rely on global prisma paths.
ARG PRISMA_VERSION=5.22.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Install Prisma CLI in an isolated directory so npm never mutates /app's standalone deps.
# Prisma also needs write access to its install dir to fetch engines on first run.
RUN mkdir -p /prisma-cli \
  && cd /prisma-cli \
  && npm init -y \
  && npm install --no-audit --no-fund prisma@${PRISMA_VERSION}

# Provide a stable path used by docs/compose/k8s
RUN mkdir -p /app/node_modules/.bin \
  && ln -sf /prisma-cli/node_modules/.bin/prisma /app/node_modules/.bin/prisma

# Set correct permissions (must be done as root before switching users)
RUN mkdir -p /app/public/uploads
RUN chown -R nextjs:nodejs /app /prisma-cli

USER nextjs

# Add Prisma CLI to PATH so "prisma" is available (and the /app symlink continues to work)
ENV PATH="/prisma-cli/node_modules/.bin:/app/node_modules/.bin:${PATH}"

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

