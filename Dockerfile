# Stage 1: Build client
FROM node:22 AS build-client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:22 AS build-server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
COPY --from=build-client /app/server/public ./public
RUN npm run build && cp -r src/database/migrations dist/database/

# Stage 3: Production runtime
FROM node:22-slim AS production
WORKDIR /app
COPY --from=build-server /app/server/dist ./dist
COPY --from=build-server /app/server/public ./public
COPY --from=build-server /app/server/node_modules ./node_modules
COPY --from=build-server /app/server/package.json ./
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/daytrack.db

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/server.js"]
