# STAGE 1: De bouwfase
FROM node:20-slim AS builder

# Installeer git om de code op te halen
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Haal de nieuwste code van de repository
RUN git clone https://github.com/TropoMetrics/look-at-this-weather.git .

# Installeer dependencies en bouw het project
ARG VITE_API_BASE_URL
# Install deps, then pass build-arg into the build command so Vite sees it as import.meta.env
RUN npm install
RUN VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build

# STAGE 2: De serveerfase
FROM nginx:alpine

# Kopieer de gebouwde bestanden uit de vorige fase naar Nginx
# Vite bouwt standaard naar de 'dist' map
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
