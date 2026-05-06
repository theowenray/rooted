#!/bin/bash
cd /var/www/html
sudo git pull origin main
cd /var/www/html/api
npm install --omit=dev
pm2 restart rooted-api
