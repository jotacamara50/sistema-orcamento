FROM node:20-bullseye-slim AS build

WORKDIR /app

ARG VITE_MP_PUBLIC_KEY
ENV VITE_MP_PUBLIC_KEY=$VITE_MP_PUBLIC_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
