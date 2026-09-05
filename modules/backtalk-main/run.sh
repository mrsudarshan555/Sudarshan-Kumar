#!/bin/bash
# backtalk: talk to your Claude Code agent out loud.
# Copyright (C) 2026 Zafer & Sudarshan. All rights reserved. Private & Proprietary Software. NOT OPEN SOURCE.
#
# This software is private, confidential, and proprietary to Zafer & Sudarshan.
All rights reserved. NOT OPEN SOURCE.
#
# SPDX-License-Identifier: Proprietary
# backtalk entrypoint — start a spoken conversation with your agent.
# Terminal-invoked (inherits the terminal's mic permission). Ctrl-C hangs up.
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
# Single-instance guard: a stale voice session left in a background
# terminal answers the same mic alongside a fresh launch = two voices at
# once, and it sounds haunted. One body, one mouth.
if pkill -f "backtalk[.]main" 2>/dev/null; then
  echo "[backtalk] replaced a previous voice session"
  sleep 1   # let the old process release mic/speaker devices
fi
# Self-repair: reconcile the environment with the shipped package list
# before launching (sub-second when already current). --inexact keeps
# anything the person's agent added on purpose; a missing package
# (a half-finished install, a drifted env) heals here instead of
# crashing on import. If it fails (offline), launch anyway.
uv sync -q --inexact 2>/dev/null || true
exec uv run python -m backtalk.main "$@" 2> >(grep -vi "pkg_resources\|VIRTUAL_ENV" >&2)
