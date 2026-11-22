FROM node:24-bookworm-slim AS api
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/*.js ./
COPY shared/ /app/shared/
USER node
CMD ["node", "server.js"]

FROM node:24-bookworm-slim AS web
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY shared/ /app/shared/
ARG VITE_GOOGLE_MAPS_EMBED_KEY
RUN npm run build
USER node
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
