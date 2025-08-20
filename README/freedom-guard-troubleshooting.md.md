# Freedom Guard: Troubleshooting Guide

Welcome to the **Freedom Guard** troubleshooting guide. This document provides solutions for common issues and errors on macOS, Linux, and Windows platforms. Follow the steps below to resolve problems related to permissions, proxy settings, TUN mode, or security warnings.

---

## macOS: osascript Access Problem

This error occurs when macOS restricts `osascript` or when **Freedom Guard** lacks the necessary permissions to manage proxy and network settings.

### Solutions

#### 1. Grant Automation Permissions
- Navigate to **System Settings → Privacy & Security → Automation**.
- Locate `Freedom Guard` in the list.
- Enable permissions for **System Events** and **osascript**.

#### 2. Enable Accessibility and Full Disk Access
- Go to **System Settings → Privacy & Security**.
- In **Accessibility**, click the `+` button and add `Freedom Guard`.
- In **Full Disk Access**, add `Freedom Guard` to the list.

#### 3. Reset Automation Permissions
If permissions are corrupted, open Terminal and run:
```bash
tccutil reset AppleEvents
```
Then, restart your Mac to prompt macOS to re-request permissions.

#### 4. Configure Proxy or TUN Mode Manually
##### Proxy Mode
To set up the proxy:
```bash
networksetup -setwebproxy "Wi-Fi" 127.0.0.1 8086
networksetup -setsecurewebproxy "Wi-Fi" 127.0.0.1 8086
```
To disable the proxy:
```bash
networksetup -setwebproxystate "Wi-Fi" off
networksetup -setsecurewebproxystate "Wi-Fi" off
```

##### TUN Mode
- In **System Settings → Privacy & Security**, grant **VPN / System Extension** access to **Freedom Guard**.

#### 5. Restart and Test
- Close **Freedom Guard** completely.
- Reopen the application.
- Select **System Proxy** or **TUN Mode** in the app.
- Test your connection to ensure it works.

---

## Linux: TUN Mode Permission Issues

The error occurs because creating and configuring a TUN interface on Linux requires root privileges. If logs show an "operation not permitted" error and the app wasn’t run as root, TUN mode cannot initialize.

### Solutions

#### 1. Run with Root Privileges
Run **Freedom Guard** with administrator (root) privileges:
```bash
sudo ./freedom-guard-linux-x86_64.AppImage
```
Or, if installed:
```bash
sudo freedom-guard
```
This allows the TUN interface to be created properly.

#### 2. Enable TUN Mode
To run **Freedom Guard** in TUN mode, execute the following commands in sequence:

##### Step 1: Grant Display Access
```bash
xhost +SI:localuser:root
```
This command allows the root user to access your display, enabling the graphical interface.

##### Step 2: Run Freedom Guard
```bash
sudo -E freedom-guard --no-sandbox
```
The `-E` flag preserves environment variables, and `--no-sandbox` disables Electron’s sandbox for full system access in TUN mode.

##### Step 3: Revoke Display Access
After using the app, revoke root access to your display for security:
```bash
xhost -SI:localuser:root
```

#### 3. Verify TUN Mode
- Close **Freedom Guard** completely.
- Reopen the app using the commands above.
- Select **TUN Mode** in the app.
- Test your connection.
  
**Success!** TUN mode should now be operational. 🚀

---

## Windows: Portable Version Issues

Issues with the portable version of **Freedom Guard** on Windows may arise due to missing administrator privileges or security warnings.

### Important Notes
- Always run the portable version as Administrator.
- No installation is required for the portable version.
- The portable version is compatible with all Windows versions.

### Solutions

#### 1. Run as Administrator
- Right-click the `freedom-guard.exe` file.
- Select **Run as administrator** to ensure proper functionality.

#### 2. Test Connection
- Close **Freedom Guard** completely.
- Reopen the app as Administrator.
- Choose your preferred mode (**System Proxy** or **TUN Mode**).
- Test your connection to confirm it works.

---

## Additional Tips
- **Check Logs**: If issues persist, review the application logs for specific error messages.
- **Update Freedom Guard**: Ensure you’re using the latest version of the app, as updates often fix known bugs.
- **Contact Support**: If the steps above don’t resolve your issue, reach out to the Freedom Guard support team for assistance.

