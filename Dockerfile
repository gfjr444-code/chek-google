FROM ghcr.io/puppeteer/puppeteer:21.0.0

USER root
WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "server.js"]
