FROM node:18-alpine as build
WORKDIR /app
ENV PATH babylonproject/app/node_modules/.bin:$PATH
# ENV NODE_ENV production
COPY package*.json /app/
RUN npm install --silent
RUN npm install react-scripts@5.0.1 -g --silent
COPY . /app
CMD ["npm", "run", "build"]

FROM nginx:alpine 
COPY --from=build /app/build /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
