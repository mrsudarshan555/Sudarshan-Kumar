@echo off
rem MAYRA & STONICX AR STAGE LAUNCHER
rem Copyright (C) 2026 Zafer & Sudarshan. All rights reserved.
rem Private, confidential, and proprietary software.
rem NOT OPEN SOURCE.
rem barehands launcher (Windows). Python standard library only.
rem   run.bat        the hand-tracked board on http://127.0.0.1:8794/stage.html
cd /d "%~dp0"

rem FIND A PYTHON THAT ACTUALLY RUNS, and validate it by RUNNING it.
rem
rem A clean Windows 11 has no Python but still answers to the name: the
rem Store leaves an execution alias on PATH, so `where python` finds a
rem real file and succeeds, and that file then exits 9009 the moment you
rem run it. A locate-only check is therefore worse than no check at all,
rem because it passes and the launch fails anyway. Only executing an
rem interpreter proves one is there.
rem
rem `if errorlevel` is used rather than %errorlevel%, which expands when a
rem block is PARSED and would test a stale value from an earlier command.
set "PY="

py -3 -c "pass" >nul 2>nul
if not errorlevel 1 set "PY=py -3"

if not defined PY (
  python -c "pass" >nul 2>nul
  if not errorlevel 1 set "PY=python"
)

if not defined PY (
  python3 -c "pass" >nul 2>nul
  if not errorlevel 1 set "PY=python3"
)

rem Last, and on a full agent stack it is the one interpreter guaranteed to
rem exist: the voice line's own virtual environment, which uv builds during
rem install. This server is standard library only, so any Python 3 runs it.
rem The path stays relative so a folder name with a space cannot break it.
if not defined PY (
  if exist "..\backtalk\.venv\Scripts\python.exe" set "PY=..\backtalk\.venv\Scripts\python.exe"
)

if not defined PY (
  echo.
  echo   No working Python was found, so the hands cannot start.
  echo.
  echo   Windows ships a decoy: a "python" on PATH that does nothing but
  echo   open the Microsoft Store, and that is what is happening here.
  echo.
  echo   Install the real one from https://www.python.org/downloads/ and
  echo   tick "Add python.exe to PATH" during setup, then run this again.
  echo.
  pause
  exit /b 1
)

%PY% server.py %*

rem Hold the window on a failure. This is usually launched detached, where
rem a crash would otherwise close instantly and tell the user nothing.
if errorlevel 1 (
  echo.
  echo   The hands stopped with an error. The message is above.
  pause
)
