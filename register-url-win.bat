@echo off
setlocal

REM Set the path to your Electron app executable
set "APP_PATH=%~dp0..\Freedom Guard.exe"

REM Check if the URL scheme is already registered
reg query "HKCU\Software\Classes\fg\shell\open\command" /ve >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo URL scheme 'fg://' is already registered.
) else (
    REM Create the registry keys and values
    reg add "HKCU\Software\Classes\fg" /ve /d "URL:fg Protocol" /f
    reg add "HKCU\Software\Classes\fg" /v "URL Protocol" /d "" /f
    reg add "HKCU\Software\Classes\fg\shell" /ve /d "" /f
    reg add "HKCU\Software\Classes\fg\shell\open" /ve /d "" /f
    reg add "HKCU\Software\Classes\fg\shell\open\command" /ve /d "\"%APP_PATH%\" \"%%1\"" /f

    echo URL scheme 'fg://' has been registered.
)

endlocal