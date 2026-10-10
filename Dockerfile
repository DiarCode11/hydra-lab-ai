# syntax=docker/dockerfile:1

#################################
# 1. deps: install dependencies
#################################
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# bcrypt needs node-gyp build tooling to compile its native binding on alpine
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

#################################
# 2. builder: build the Next.js app
#################################
FROM oven/bun:1-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js reads NEXT_PUBLIC_* vars at build time, so they must be available here.
# Secrets (DB url, JWT secret, API keys, Firebase private key) are NOT needed at
# build time and are injected only at container runtime via docker-compose env_file.
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

#################################
# 3. runner: minimal production image
#################################
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone output: minimal server + only the deps it actually needs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Writable dirs for runtime file uploads (also mounted as volumes in compose)
RUN mkdir -p ./public/uploads ./storage/uploads \
  && chown -R nextjs:nodejs ./public/uploads ./storage

USER nextjs

EXPOSE 3000

CMD ["bun", "server.js"]
