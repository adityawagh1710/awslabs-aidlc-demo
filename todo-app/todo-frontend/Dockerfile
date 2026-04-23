# ── Stage: base ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage: development ────────────────────────────────────────────────────────
# Copies all source into the image — no bind mounts required.
# Works out of the box with: docker compose up -d
FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ── Stage: builder ────────────────────────────────────────────────────────────
FROM base AS builder
COPY . .
RUN npm run build

# ── Stage: production ─────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
