FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client ./
RUN npm run build


FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev


FROM node:20-alpine
WORKDIR /app
COPY --from=backend-deps /app/backend /app/backend
COPY backend /app/backend
COPY --from=client-build /app/client/dist /app/client/dist



EXPOSE 3001
CMD ["node", "backend/src/index.js"]
