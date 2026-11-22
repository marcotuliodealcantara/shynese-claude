#!/bin/sh
# Prepares the category images in src/assets/categories for the home mosaic (macOS, uses `sips`):
#   - center-crops images wider than 4:3 down to 4:3 (the mosaic cards are 3:4, 1:1 and 4:3,
#     always center-cropped, so nothing visible is lost)
#   - scales down to 768px tall (1024x768) — sharp on phones, small to download
#   - re-encodes as JPEG at quality 72
# Images already at or below 1024x768 and 300 KB are skipped, so it is safe to re-run after
# adding or replacing a single image.
#
# Usage: npm run optimize-images

set -e
DIR="$(dirname "$0")/../src/assets/categories"
MAX_H=768
MAX_KB=300

for f in "$DIR"/*.jpg; do
  [ -e "$f" ] || continue
  w=$(sips -g pixelWidth "$f" | awk '/pixelWidth/{print $2}')
  h=$(sips -g pixelHeight "$f" | awk '/pixelHeight/{print $2}')
  kb=$(( $(stat -f %z "$f") / 1024 ))
  name=$(basename "$f")

  if [ "$h" -le "$MAX_H" ] && [ $(( w * 3 )) -le $(( h * 4 )) ] && [ "$kb" -le "$MAX_KB" ]; then
    echo "ok       $name (${w}x${h}, ${kb} KB)"
    continue
  fi

  # Wider than 4:3 → crop the center to 4:3
  if [ $(( w * 3 )) -gt $(( h * 4 )) ]; then
    sips -c "$h" $(( h * 4 / 3 )) "$f" >/dev/null
  fi
  # Taller than MAX_H → scale down, keeping the aspect ratio
  if [ "$h" -gt "$MAX_H" ]; then
    sips --resampleHeight "$MAX_H" "$f" >/dev/null
  fi
  sips -s format jpeg -s formatOptions 72 "$f" --out "$f" >/dev/null

  nw=$(sips -g pixelWidth "$f" | awk '/pixelWidth/{print $2}')
  nh=$(sips -g pixelHeight "$f" | awk '/pixelHeight/{print $2}')
  echo "resized  $name (${w}x${h}, ${kb} KB → ${nw}x${nh}, $(( $(stat -f %z "$f") / 1024 )) KB)"
done
