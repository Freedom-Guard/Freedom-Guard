#!/bin/bash

# Get arguments
dnsone="$1"
dnstwo="$2"

# Check if arguments are provided
if [ -z "$dnsone" ] || [ -z "$dnstwo" ]; then
  echo "Usage: $0 <proxy_host> <proxy_port>"
  exit 1
fi

echo -e "[main]\ndns=$dnsone;$dnstwo;" | sudo tee /etc/NetworkManager/NetworkManager.conf

sudo systemctl restart NetworkManager

echo -e "[Resolve]\nDNS=$dnsone $dnstwo" | sudo tee /etc/systemd/resolved.conf
