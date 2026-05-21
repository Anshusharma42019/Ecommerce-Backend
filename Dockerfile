# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodeuser:nodejs . .

# Create required directories
RUN mkdir -p logs uploads && chown -R nodeuser:nodejs logs uploads

USER nodeuser

EXPOSE 5000

ENV NODE_ENV=production

# Use dumb-init to handle PID 1 signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
