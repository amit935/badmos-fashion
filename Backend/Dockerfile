FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000
EXPOSE 4200

CMD ["npm", "run", "dev"]
