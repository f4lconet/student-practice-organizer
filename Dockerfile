FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

RUN apk add --no-cache nginx supervisor

COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

EXPOSE 10000

CMD ["/usr/bin/supervisord","-c","/etc/supervisord.conf"]
