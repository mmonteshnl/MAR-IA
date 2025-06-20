# Use official Node.js LTS image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1

# Copy environment files
COPY ./env/ ./env/

# Set up environment file for build (use production if available, otherwise default)
RUN if [ -f "./env/.env.production" ]; then \
        cp ./env/.env.production ./.env.local; \
    elif [ -f "./.env.local" ]; then \
        echo "Using existing .env.local"; \
    else \
        echo "No environment file found, using defaults"; \
    fi

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3047

ENV PORT=3047
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]