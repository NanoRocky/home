# 构建应用
FROM node:24-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10 --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN [ ! -e ".env" ] && cp .env.example .env || true
RUN pnpm run build

# 最小化镜像
FROM node:24-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN addgroup -S app && adduser -S home -G app \
    && npm install -g http-server
USER home
EXPOSE 12445
CMD ["http-server", "dist", "-p", "12445"]