FROM node:12

WORKDIR /opt/p2rank-monitor

COPY package*.json ./
RUN npm ci --only=production

COPY ./server ./server

EXPOSE 8021

CMD [ "node", "./server/server.js" ]
