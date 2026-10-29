# Render-friendly backend image (repo-root context).
# Use when the platform cannot set dockerfilePath to backend/Dockerfile.
FROM node:20-alpine

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=4000

COPY backend/package.json ./
RUN npm install --omit=dev

COPY backend/src ./src
COPY shared /app/shared

RUN mkdir -p /app/backend/uploads

EXPOSE 4000

CMD ["npm", "start"]
