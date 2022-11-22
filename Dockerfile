FROM node:18-alpine as build
ADD . /app
WORKDIR /app
RUN yarn install
RUN yarn run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist/main.js /app/
COPY --from=build /app/*.json /app/
CMD [ "yarn", "run", "start:prod" ]