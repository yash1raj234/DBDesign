FROM node:20-alpine AS base
WORKDIR /app

# ── Development stage ─────────────────────────────────────────────────────────
FROM base AS development

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Build stage ───────────────────────────────────────────────────────────────
FROM base AS builder

COPY package*.json ./
RUN npm ci

# Accept at build time — Next.js bakes NEXT_PUBLIC_* into the JS bundle
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
