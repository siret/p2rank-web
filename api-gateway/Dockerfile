FROM node:buster AS frontend-build

ARG GOOGLE_ANALYTIS=""

WORKDIR /opt/prankweb/frontend

COPY ./frontend/ ./

# Set Gooogle tag to the file.
RUN sed -i "s/var google_tag = '';/var google_tag = '${GOOGLE_ANALYTIS}';/" ./public/partial/google-analytics.html

RUN npm ci && npm run build

FROM nginx:1.19.1

COPY --from=frontend-build /opt/prankweb/frontend/dist /opt/prankweb/frontend

RUN rm /etc/nginx/conf.d/default.conf 

COPY ./api-gateway/nginx/ /etc/nginx/conf.d/
