#!/bin/zsh

# Download Sample Images for WoofMeetup Testing
# This script downloads placeholder images from picsum.photos

echo "=== Downloading Sample Images for WoofMeetup ==="
echo ""

SCRIPT_DIR="${0:A:h}"
DOGS_DIR="${SCRIPT_DIR}/dogs"
PROFILES_DIR="${SCRIPT_DIR}/profiles"

# Create directories if they don't exist
mkdir -p "$DOGS_DIR"
mkdir -p "$PROFILES_DIR"

echo "📁 Directories:"
echo "  Dogs: $DOGS_DIR"
echo "  Profiles: $PROFILES_DIR"
echo ""

# Download dog images
echo "🐕 Downloading dog images..."
for i in {1..3}; do
  echo "  Downloading dog${i}.jpg..."
  curl -sL -o "${DOGS_DIR}/dog${i}.jpg" "https://picsum.photos/800/600?random=${i}"
  if [[ $? -eq 0 ]] && [[ -s "${DOGS_DIR}/dog${i}.jpg" ]]; then
    SIZE=$(du -h "${DOGS_DIR}/dog${i}.jpg" | cut -f1)
    echo "  ✓ dog${i}.jpg downloaded (${SIZE})"
  else
    echo "  ✗ Failed to download dog${i}.jpg"
  fi
done

echo ""

# Download profile images
echo "👤 Downloading profile images..."
for i in {1..3}; do
  echo "  Downloading profile${i}.jpg..."
  curl -sL -o "${PROFILES_DIR}/profile${i}.jpg" "https://picsum.photos/400/400?random=$((i+10))"
  if [[ $? -eq 0 ]] && [[ -s "${PROFILES_DIR}/profile${i}.jpg" ]]; then
    SIZE=$(du -h "${PROFILES_DIR}/profile${i}.jpg" | cut -f1)
    echo "  ✓ profile${i}.jpg downloaded (${SIZE})"
  else
    echo "  ✗ Failed to download profile${i}.jpg"
  fi
done

echo ""
echo "════════════════════════════════════════"
echo "✓ Download Complete!"
echo "════════════════════════════════════════"
echo ""
echo "Images saved to:"
echo "  Dogs: $DOGS_DIR"
echo "  Profiles: $PROFILES_DIR"
echo ""
echo "You can now run: cd ../auth && ./signup.sh 1"