FROM node:24-bookworm-slim AS api
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/*.js ./
USER node
CMD ["node", "server.js"]

FROM node:24-bookworm-slim AS web
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
USER node
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
