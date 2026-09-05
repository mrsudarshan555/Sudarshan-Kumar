@echo off
rem ai-visualizer: give your AI agent a face.
rem Copyright (C) 2026 Zafer & Sudarshan. All rights reserved. Private & Proprietary Software. NOT OPEN SOURCE.
rem
rem This software is private, confidential, and proprietary to Zafer & Sudarshan.
All rights reserved. NOT OPEN SOURCE.
rem
rem SPDX-License-Identifier: Proprietary
rem ai-visualizer launcher (Windows). Python standard library only.
rem   run.bat                  the real signal bus
rem   run.bat --mock speaking  a synthesized state, no voice line needed
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py server.py %*
) else (
  python server.py %*
)
