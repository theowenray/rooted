#!/bin/bash
cd /var/www/html
sudo git pull origin main

# Write current commit hash to version.json
COMMIT=$(git rev-parse --short HEAD)
echo "{ \"version\": \"$COMMIT\" }" | sudo tee /var/www/html/version.json

# Sync api files
rsync -av --exclude='node_modules' --exclude='.env' /var/www/html/api/ /var/www/api/
cd /var/www/api
npm install --omit=dev
pm2 restart rooted-api
