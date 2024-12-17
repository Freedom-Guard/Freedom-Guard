@echo off
setlocal enabledelayedexpansion

:: Check if input arguments are provided
if "%~1"=="" (
    echo Usage: set_dns.bat "<primary_dns_ipv4>" "<secondary_dns_ipv4>"
    echo Example: set_dns.bat "8.8.8.8" "8.8.4.4"
    echo Or: set_dns.bat "clear" "clear" to reset DNS to DHCP for all interfaces
    exit /b 1
)

:: Set variables for DNS servers from input arguments
set "PRIMARY_DNS=%~1"
set "SECONDARY_DNS=%~2"

:: Check if "clear" is provided to reset DNS to DHCP
if /i "%PRIMARY_DNS%"=="clear" if /i "%SECONDARY_DNS%"=="clear" (
    echo Resetting DNS settings to DHCP for all connected interfaces...
    :: Loop through all connected interfaces and reset DNS to DHCP
    for /f "tokens=1,2,3,* delims= " %%A in ('netsh interface show interface ^| findstr /i "Connected"') do (
        set "InterfaceName=%%D"
        if not "!InterfaceName!"=="" (
            echo Resetting DNS settings for interface: "!InterfaceName!"
            netsh interface ipv4 set dnsservers name="!InterfaceName!" source=dhcp
            echo DNS reset to DHCP for "!InterfaceName!"
        )
    )
    echo DNS settings have been successfully reset to DHCP for all connected interfaces.
    pause
    exit /b
)

:: Loop through all connected interfaces and apply DNS settings
for /f "tokens=1,2,3,* delims= " %%A in ('netsh interface show interface ^| findstr /i "Connected"') do (
    set "InterfaceName=%%D"

    :: Ensure the name is handled correctly with spaces or special characters
    if not "!InterfaceName!"=="" (
        echo Applying DNS settings to interface: "!InterfaceName!"

        :: Set primary DNS with quotes around interface name
        netsh interface ipv4 set dnsservers name="!InterfaceName!" source=static addr=%PRIMARY_DNS% register=primary
        echo Primary DNS set to %PRIMARY_DNS% for "!InterfaceName!"

        :: Set secondary DNS with quotes around interface name
        netsh interface ipv4 add dnsservers name="!InterfaceName!" addr=%SECONDARY_DNS% index=2
        echo Secondary DNS set to %SECONDARY_DNS% for "!InterfaceName!"
    )
)

echo DNS settings have been successfully applied to all connected interfaces.
