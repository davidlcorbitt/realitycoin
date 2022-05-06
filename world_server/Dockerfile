# Adapted from https://blog.logrocket.com/containerized-development-nestjs-docker/

FROM node:16.13 As development

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install --only=development

COPY . .

RUN yarn run build

FROM node:16.13 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
