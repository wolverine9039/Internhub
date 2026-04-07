# ─── InternHub Backend Dockerfile ─────────────────────────────
# Node.js Express API server for InternHub
# Connects to AWS RDS MySQL

FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --production && npm cache clean --force

# Copy application source
COPY backend/src ./src
COPY backend/seed-admin.js ./seed-admin.js
COPY backend/seed-users.js ./seed-users.js

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose API port
EXPOSE 5000

# Health check — ping the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the server
CMD ["node", "src/app.js"]
