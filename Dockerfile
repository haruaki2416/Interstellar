FROM node:bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8080

CMD ["node", "index.js"]
