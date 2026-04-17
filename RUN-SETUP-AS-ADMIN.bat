@echo off
echo Starting Nebula VPN Split Tunneling Setup...
powershell.exe -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0SETUP-SPLIT-TUNNELING-FIXED.ps1\"'"
pause