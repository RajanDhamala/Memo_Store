# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY .env .env
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY .env .env
RUN ["npm","run","build"]
RUN ["rm","-rf",".env"]

# Production stage (final)
FROM nginx:alpine AS production
LABEL maintainer="Rajan Dhamala <rajandhamala@example.com>"
LABEL version="1.0"
LABEL description="Frontend for Memo App served via Nginx"
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
 CMD curl -f http://localhost/ || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
