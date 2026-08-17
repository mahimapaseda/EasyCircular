FROM node:20-alpine

WORKDIR /app/backend

ENV NODE_ENV=production

COPY backend/package.json ./
RUN npm install --omit=dev

COPY backend/src ./src
COPY shared /app/shared

EXPOSE 4000

CMD ["npm", "start"]
