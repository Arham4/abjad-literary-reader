FROM oven/bun:latest AS base
WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock tsconfig.json ./

# Install dependencies inside the container
RUN bun install

# Copy application sources
COPY . .

# Run tests to guarantee zero regressions during container build
RUN bun test

# Build production assets
RUN bun run build

# Seed database with canonical literary texts
RUN bun run src/db/seed.ts

EXPOSE 4000
ENV PORT=4000

CMD ["bun", "run", "src/server/index.ts"]
