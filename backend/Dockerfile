# Use official Node.js LTS image
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production --prefix backend && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci --prefix backend
COPY backend/ ./backend/
EXPOSE 5000
CMD ["npm", "run", "dev", "--prefix", "backend"]

# Build stage
FROM base AS build
RUN npm ci --prefix backend
COPY backend/ ./backend/
RUN npm run build --prefix backend

# Production stage
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S dundra -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=build --chown=dundra:nodejs /app/backend/dist ./dist
COPY --from=build --chown=dundra:nodejs /app/backend/package*.json ./
COPY --from=build --chown=dundra:nodejs /app/backend/node_modules ./node_modules

# Switch to non-root user
USER dundra

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/server.js"] 