#!/bin/bash
# ai-visualizer: give your AI agent a face.
# Copyright (C) 2026 Zafer & Sudarshan. All rights reserved. Private & Proprietary Software. NOT OPEN SOURCE.
#
# This software is private, confidential, and proprietary to Zafer & Sudarshan.
All rights reserved. NOT OPEN SOURCE.
#
# SPDX-License-Identifier: Proprietary
# ai-visualizer launcher. Python standard library only, nothing to install.
#   ./run.sh                 the real signal bus
#   ./run.sh --mock speaking a synthesized state, no voice line needed
#   ./run.sh --no-open       do not auto-open the browser
cd "$(dirname "$0")"
exec python3 server.py "$@"
