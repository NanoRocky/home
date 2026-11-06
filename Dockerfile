# 构建应用
FROM node:24-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@12 --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# 最小化镜像
FROM node:24-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN groupadd -r app && useradd -r -g app home \
    && npm install -g http-server
USER home
EXPOSE 12445
CMD ["http-server", "dist", "-p", "12445"]