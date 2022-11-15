FROM node:18
ADD . /app
RUN yarn install
CMD [ "yarn", "run", "start" ]