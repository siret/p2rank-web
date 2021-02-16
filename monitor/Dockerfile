FROM node:12

ARG GOOGLE_ANALYTICS=""

WORKDIR /opt/p2rank-monitor

COPY ./monitor/package*.json ./

ENV GOOGLE_ANALYTICS=$GOOGLE_ANALYTICS

RUN npm ci --only=production

COPY ./monitor/server ./server

EXPOSE 8021

CMD [ "node", "./server/server.js" ]
