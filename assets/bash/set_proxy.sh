#!/bin/bash

# Get arguments
PROXY_HOST="$1"
PROXY_PORT="$2"

# Check if arguments are provided
if [ -z "$PROXY_HOST" ] || [ -z "$PROXY_PORT" ]; then
  echo "Usage: $0 <proxy_host> <proxy_port>"
  exit 1
fi

# Set environment variables for SOCKS5 proxy
export http_proxy="socks5://$PROXY_HOST:$PROXY_PORT"
export https_proxy="socks5://$PROXY_HOST:$PROXY_PORT"
export ftp_proxy="socks5://$PROXY_HOST:$PROXY_PORT"
export all_proxy="socks5://$PROXY_HOST:$PROXY_PORT"

# Apply to system (for various Linux distributions)
gsettings set org.gnome.system.proxy mode 'manual'
gsettings set org.gnome.system.proxy.socks host "$PROXY_HOST"
gsettings set org.gnome.system.proxy.socks port "$PROXY_PORT"

# Confirm settings
echo "SOCKS5 proxy set to $PROXY_HOST:$PROXY_PORT"
