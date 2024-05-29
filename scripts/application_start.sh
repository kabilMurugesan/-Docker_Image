#!/bin/bash
cd /var/www/gobox-api/
sudo pm2 start ecosystem.config.json
