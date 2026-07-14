#!/bin/sh
set -e

# At container start, if VITE_API_BASE_URL is provided, write a runtime config
if [ -n "$VITE_API_BASE_URL" ]; then
  echo "Writing runtime config /usr/share/nginx/html/config.json with VITE_API_BASE_URL=$VITE_API_BASE_URL"
  cat > /usr/share/nginx/html/config.json <<EOF
{"VITE_API_BASE_URL":"$VITE_API_BASE_URL"}
EOF
fi

# Fallback: ensure config.json exists (it will be copied from /usr/share/nginx/html if present in build/public)
if [ ! -f /usr/share/nginx/html/config.json ]; then
  echo "No config.json found in build; writing default using build-time variable"
  cat > /usr/share/nginx/html/config.json <<EOF
{"VITE_API_BASE_URL":"${VITE_API_BASE_URL:-https://api.odspieg.nl}"}
EOF
fi

# Start nginx
exec nginx -g 'daemon off;'
