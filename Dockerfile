FROM node:18-alpine
ADD . /app
WORKDIR /app
RUN yarn install
CMD [ "yarn", "start" ]