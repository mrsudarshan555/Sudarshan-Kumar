#!/bin/bash
# fullstack-agent: give your AI a full stack — memory, voice, face, hands.
# Copyright (C) 2026 Zafer & Sudarshan. All rights reserved. Private & Proprietary Software. NOT OPEN SOURCE.
#
# This software is private, confidential, and proprietary to Zafer & Sudarshan.
All rights reserved. NOT OPEN SOURCE.
#
# SPDX-License-Identifier: Proprietary

# Starts the agent's pieces, in the right order:
#   ai-visualizer (the face, opens in your browser)
#   barehands     (the hands, URL printed; open it when you want the board)
#   backtalk      (the voice, runs in this terminal; Ctrl-C stops EVERYTHING)
# Pieces you didn't install are skipped automatically.
#
#   ./start.sh          everything installed
#   ./start.sh voice    the voice and the face (no hands)
#   ./start.sh hands    the voice and the hands board (no face)

HERE="$(cd "$(dirname "$0")" && pwd)"
HOME_DIR="$(dirname "$HERE")"
MODE="${1:-all}"
PIDS=()

cleanup() {
  trap - EXIT INT TERM
  for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null; done
  echo
  echo "agent stopped."
}
trap cleanup EXIT INT TERM

echo "fullstack-agent: starting from $HOME_DIR"

if [ -d "$HOME_DIR/ai-visualizer" ] && [ "$MODE" != "hands" ]; then
  (cd "$HOME_DIR/ai-visualizer" && exec python3 server.py) &
  PIDS+=($!)
  echo "  face:  starting (your browser opens on the visualizer)"
fi

if [ -d "$HOME_DIR/barehands" ] && [ "$MODE" != "voice" ]; then
  (cd "$HOME_DIR/barehands" && exec python3 server.py) &
  PIDS+=($!)
  echo "  hands: starting (open the printed URL in Chrome when you want the board)"
fi

if [ -d "$HOME_DIR/backtalk" ]; then
  echo "  voice: starting (hold your talk key and speak; Ctrl-C here stops everything)"
  cd "$HOME_DIR/backtalk" && ./run.sh
else
  echo
  echo "No voice installed; servers are up. Ctrl-C stops everything."
  wait
fi
