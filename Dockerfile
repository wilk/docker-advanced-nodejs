FROM node:9.7.0-alpine

WORKDIR /opt/app
COPY . /opt/app
RUN npm install --production
EXPOSE 12345

CMD ["node", "index.js"]