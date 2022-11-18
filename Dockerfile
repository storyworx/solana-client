FROM node:18
ADD . /app
WORKDIR /app
RUN yarn install
CMD [ "yarn", "run", "start:prod" ]