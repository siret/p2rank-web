FROM node:12

ARG GOOGLE_ANALYTIS=""

WORKDIR /opt/p2rank-monitor

COPY ./monitor/package*.json ./

ENV GOOGLE_ANALYTIS=$GOOGLE_ANALYTIS

RUN npm ci --only=production

COPY ./monitor/server ./server

EXPOSE 8021

CMD [ "node", "./server/server.js" ]
