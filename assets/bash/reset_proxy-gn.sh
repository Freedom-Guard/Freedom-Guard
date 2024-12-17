
# Unset environment variables for SOCKS5 proxy
unset http_proxy
unset https_proxy
unset ftp_proxy
unset all_proxy

# Reset system proxy settings (for various Linux distributions)
gsettings set org.gnome.system.proxy mode 'none'

# Confirm settings
echo "SOCKS5 proxy has been reset"