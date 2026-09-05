#!/bin/bash
# fullstack-agent: give your AI a full stack — memory, voice, face, hands.
# Copyright (C) 2026 Zafer & Sudarshan. All rights reserved. Private & Proprietary Software. NOT OPEN SOURCE.
#
# This software is private, confidential, and proprietary to Zafer & Sudarshan.
All rights reserved. NOT OPEN SOURCE.
#
# SPDX-License-Identifier: Proprietary

# Pulls the newest version of every installed piece, and of this repo.
# Your own files (your CLAUDE.md, your vault, your configs) live outside
# the repos' tracked files, so updates never touch them. If git reports
# a conflict on a config you edited, your edit wins; keep your version.

HERE="$(cd "$(dirname "$0")" && pwd)"
HOME_DIR="$(dirname "$HERE")"

# Everything runs from main() so the whole script is parsed before any of
# it executes; updating this very file mid-run can then never garble it.
main() {
  for repo in fullstack-agent ai-memory-vault backtalk barehands ai-visualizer; do
    [ -d "$HOME_DIR/$repo/.git" ] || continue
    echo "== $repo"
    # show what is arriving BEFORE applying it, so "what changed?"
    # answers itself on every update
    git -C "$HOME_DIR/$repo" fetch -q origin 2>/dev/null
    git -C "$HOME_DIR/$repo" log --oneline "..@{u}" 2>/dev/null | sed "s/^/   new: /"
    # one-time migration (2026-08): the per-piece configs moved out of git
    # tracking so an update can never collide with personal settings. If
    # this clone still tracks one, lift it aside, pull, put it back as-is.
    CFG=""
    case "$repo" in
      backtalk) CFG="backtalk.json" ;;
      barehands) CFG="barehands.json" ;;
      ai-visualizer) CFG="ai-visualizer.json" ;;
    esac
    MIGRATE=0
    if [ -n "$CFG" ] && [ -f "$HOME_DIR/$repo/$CFG" ] && \
       git -C "$HOME_DIR/$repo" ls-files --error-unmatch "$CFG" >/dev/null 2>&1; then
      cp "$HOME_DIR/$repo/$CFG" "$HOME_DIR/$repo/$CFG.mine" && \
        git -C "$HOME_DIR/$repo" checkout -q -- "$CFG" && MIGRATE=1
    fi
    git -C "$HOME_DIR/$repo" pull --ff-only || \
      echo "   (couldn't fast-forward; your local edits win. See the note at the top of this script.)"
    if [ "$MIGRATE" = 1 ] && [ -f "$HOME_DIR/$repo/$CFG.mine" ]; then
      mv "$HOME_DIR/$repo/$CFG.mine" "$HOME_DIR/$repo/$CFG"
    fi
  done
  echo "update complete."
  if ! ls "$HOME/Desktop/Update "*.command >/dev/null 2>&1; then
    echo "Tip: want a desktop Update icon that does this on a double-click? Open your agent and ask for one."
  fi
}
main "$@"
