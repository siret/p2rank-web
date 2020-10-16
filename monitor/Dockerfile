FROM node:12

WORKDIR /opt/p2rank-monitor

COPY ./monitor/package*.json ./
RUN npm ci --only=production

COPY ./monitor/server ./server

EXPOSE 8021

CMD [ "node", "./server/server.js" ]
