@echo off
rem fullstack-agent: give your AI a full stack — memory, voice, face, hands.
rem Copyright (C) 2026 Zafer & Sudarshan. All rights reserved. Private & Proprietary Software. NOT OPEN SOURCE.
rem
rem This software is private, confidential, and proprietary to Zafer & Sudarshan.
All rights reserved. NOT OPEN SOURCE.
rem
rem SPDX-License-Identifier: Proprietary

rem Starts the agent's pieces. Each server gets its own window;
rem close the windows (or this one for the voice) to stop.
rem   start.bat          everything installed
rem   start.bat voice    the voice and the face (no hands)
rem   start.bat hands    the voice and the hands board (no face)

cd /d "%~dp0.."

if exist "ai-visualizer\" if not "%1"=="hands" (
  echo   face:  starting
  start "agent face" cmd /c "cd ai-visualizer && run.bat"
)

if exist "barehands\" if not "%1"=="voice" (
  echo   hands: starting
  rem if errorlevel reads the where result at run time. A percent-style
  rem check here would expand when this block is parsed and test a stale value.
  where py >nul 2>nul
  if errorlevel 1 (
    start "agent hands" cmd /c "cd barehands && python server.py"
  ) else (
    start "agent hands" cmd /c "cd barehands && py server.py"
  )
)

if exist "backtalk\" (
  echo   voice: starting in this window. Close it to hang up.
  cd backtalk
  rem Self-repair: reconcile the voice line's packages before launch
  rem (fast when current; heals a half-installed environment).
  uv sync -q --inexact >nul 2>nul
  uv run python -m backtalk.main
  rem A clean goodbye exits 0 and the window may close. An error exits
  rem nonzero, and the window HOLDS so the message can be read.
  if errorlevel 1 (
    echo.
    echo   The voice line stopped with an error. The message is above.
    echo   The log lives in backtalk\logs\backtalk.log
    pause
  )
)
