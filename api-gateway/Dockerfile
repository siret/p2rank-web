FROM node:buster AS frontend-build

WORKDIR /opt/p2rank/frontend

COPY ./frontend/ ./

RUN npm ci && npm run build

FROM nginx:1.19.1

COPY --from=frontend-build /opt/p2rank/frontend/dist /opt/p2rank/frontend

RUN rm /etc/nginx/conf.d/default.conf 

COPY ./api-gateway/nginx/ /etc/nginx/conf.d/

