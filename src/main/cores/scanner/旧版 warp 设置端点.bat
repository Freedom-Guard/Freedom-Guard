@echo off
chcp 936 > nul
set endpoint=162.159.192.1:2408
set /p endpoint=请输入需要测速的端口(默认%endpoint%):
warp-cli.exe clear-custom-endpoint
warp-cli.exe set-custom-endpoint %endpoint%
echo 当前端点已经设置为 %endpoint%
pause