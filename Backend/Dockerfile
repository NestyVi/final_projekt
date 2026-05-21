FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

EXPOSE 5173

CMD ["npm", "run", "dev"]