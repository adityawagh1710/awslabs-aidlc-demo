FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Development ----
# Copies all source into the image — no bind mounts required.
# Works out of the box with: docker compose up -d
FROM base AS development
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx watch src/server.ts"]

# ---- Builder ----
FROM base AS builder
COPY . .
RUN npm run build

# ---- Production ----
FROM node:22-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN npx prisma generate

USER appuser

EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
