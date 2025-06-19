# Use official Node.js LTS image for building
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --prefix frontend && npm cache clean --force

# Development stage
FROM base AS development
COPY frontend/ ./frontend/
EXPOSE 5173
CMD ["npm", "run", "dev", "--prefix", "frontend"]

# Build stage
FROM base AS build
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# Production stage - use nginx to serve static files
FROM nginx:alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S dundra -u 1001

# Copy built application
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Create nginx directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx \
    && chown -R dundra:nodejs /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html \
    && chmod -R 755 /var/cache/nginx /var/log/nginx /var/run/nginx

# Switch to non-root user
USER dundra

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 