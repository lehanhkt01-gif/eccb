# ==============================================================================
# E-CCB EA SÚP — MULTI-STAGE DOCKERFILE
# Tối ưu hóa dung lượng image (Alpine) và hiệu năng chạy với Next.js Standalone
# ==============================================================================

# 1. Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 2. Dependencies stage
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client trước khi build Next.js (cần DATABASE_URL mẫu tại build time)
ENV DATABASE_URL="postgresql://eccb_user:eccb_secret_pass@localhost:5432/eccb_db"
RUN npx prisma generate --schema=prisma/schema.prisma

# Tắt gửi telemetrics của Next.js và cấp phát bộ nhớ Node ổn định
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# 4. Runner stage (Production)
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Thiết lập user bảo mật không đặc quyền (non-root)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy tài nguyên static và standalone build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
