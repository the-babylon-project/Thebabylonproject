FROM node:18-alpine as build
WORKDIR /dist
ENV PATH babylonproject/app/node_modules/.bin:$PATH
# ENV NODE_ENV production
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine 
COPY --from=build /dist /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
