FROM node:22-slim

# Prisma cần OpenSSL để nối PostgreSQL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Sinh Prisma Client từ schema ngay lúc build image
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3000

# Khi container khởi động: áp migration -> seed dữ liệu nền -> chạy server
# (exec để node nhận tín hiệu dừng của docker stop)
# Lưu ý: thư mục prisma/migrations phải có sẵn (sinh bằng "npx prisma migrate dev") và được commit
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && exec node server.js"]
