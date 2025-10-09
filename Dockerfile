# 构建应用
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN [ ! -e ".env" ] && cp .env.example .env || true
RUN npm run build

# 最小化镜像
<<<<<<< HEAD
FROM node:22.17.0
=======
FROM node:24.9.0-alpine
>>>>>>> 70ac3473352debd6420c5e72f31ee58e9ce3836e
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN npm install -g http-server

EXPOSE 12445
CMD ["http-server", "dist", "-p", "12445"]