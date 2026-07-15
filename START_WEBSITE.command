#!/bin/zsh
cd "$(dirname "$0")"
echo "Starting CareWise website at http://localhost:4173/?ui=109-mobile"
echo "Keep this Terminal window open while previewing the site."
python3 -m http.server 4173
