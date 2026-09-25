#!/bin/bash

# 1. Update system and install Nginx + Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Copy the Nginx config to sites-available
sudo cp nginx.conf /etc/nginx/sites-available/madamebeauty
sudo ln -sf /etc/nginx/sites-available/madamebeauty /etc/nginx/sites-enabled/

# Sync project files to the Nginx root (Ensure this matches the 'root' in nginx.conf)
# Secure copy: Deploy only required public web assets, ignoring scripts and configuration source files
sudo mkdir -p /var/www/madamebeauty
sudo cp index.html /var/www/madamebeauty/
sudo cp services.json /var/www/madamebeauty/
sudo cp services.js admin.js contact.js /var/www/madamebeauty/
sudo cp salonIntro.jpeg /var/www/madamebeauty/ 2>/dev/null || true

# Ensure the web server user owns the files and permissions are correct
sudo chown -R www-data:www-data /var/www/madamebeauty
sudo chmod -R 755 /var/www/madamebeauty

# 3. Test Nginx and reload
sudo nginx -t && sudo systemctl reload nginx

# 4. Run Certbot to get the SSL certificate and auto-configure Nginx
# Replace your-email@example.com with your real email for renewal notifications
sudo certbot --nginx -d madamebeauty.com -d www.madamebeauty.com -d priceless-integrity.com -d www.priceless-integrity.com --non-interactive --agree-tos -m contact@madamebeauty.com

echo "SSL setup complete! Certbot will automatically renew the certificate."
echo "You can check renewal status with: sudo certbot renew --dry-run"