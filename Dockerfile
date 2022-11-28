FROM node:18-alpine as build
ADD . /app
WORKDIR /app
RUN yarn install
RUN yarn build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/*.json /app/
COPY --from=build /app/.env /app/
CMD [ "yarn", "start:prod" ]