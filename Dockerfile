# STAGE 1: De bouwfase
FROM node:20-slim AS builder

# Installeer git om de code op te halen
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Haal de nieuwste code van de repository
RUN git clone https://github.com/TropoMetrics/look-at-this-weather.git .

# Installeer dependencies en bouw het project
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$https://api-tropometrics.odspieg.nl/
RUN npm install
RUN npm run build

# STAGE 2: De serveerfase
FROM nginx:alpine

# Kopieer de gebouwde bestanden uit de vorige fase naar Nginx
# Vite bouwt standaard naar de 'dist' map
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
