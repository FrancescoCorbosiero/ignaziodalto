# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321 \
    DATA_DIR=/app/data \
    UV_THREADPOOL_SIZE=8
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/fixtures ./fixtures
COPY --from=build /app/start.mjs /app/image-worker.mjs ./
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 4321
HEALTHCHECK --interval=60s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:4321/healthz >/dev/null || exit 1
CMD ["node", "start.mjs"]
