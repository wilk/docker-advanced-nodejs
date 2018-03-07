FROM node:9.7.0-alpine

WORKDIR /opt/app
EXPOSE 12345

CMD ["node", "index.js"]