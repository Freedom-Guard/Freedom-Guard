chcp 936
cls
@echo off & setlocal enabledelayedexpansion
set endpoint=162.159.192.1:2408
set /p endpoint=请输入端点(默认%endpoint%):
warp-cli tunnel endpoint reset
warp-cli tunnel endpoint set %endpoint%
echo 当前端点已经设置为 %endpoint%
pause