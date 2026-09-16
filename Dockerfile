# --- Stage 1: build the static React app ---
FROM node:20-alpine AS build

WORKDIR /app

# package*.json copied first, same layer-caching reasoning as the
# backend Dockerfile — npm ci only re-runs when dependencies change.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: serve the built static files with nginx ---
# The final image only contains the compiled dist/ output and nginx —
# not Node, not node_modules, not source files. Much smaller image
# than shipping the build stage itself.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
