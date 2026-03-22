FROM node:20-alpine AS builder
WORKDIR /app

COPY lib/ ./lib/

COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/prisma/ ./backend/prisma/
COPY backend/src/ ./backend/src/

WORKDIR /app/backend
RUN npm ci
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/lib ../lib

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]
