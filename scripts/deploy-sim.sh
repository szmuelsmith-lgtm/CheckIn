#!/bin/bash
set -e

WORKTREE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MAIN_REPO="/Users/samuelsmith/Desktop/Check-in"
SIM_ID="DDF3BF56-5708-49C8-8594-E811584755FE"
BUNDLE_ID="com.athleteanchor.checkin"
XCODE="DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer /Applications/Xcode.app/Contents/Developer/usr/bin"

echo "→ Building Next.js..."
cd "$WORKTREE_DIR"
BUILD_TARGET=app npm run build

echo "→ Copying assets to main repo iOS public..."
cp -r "$WORKTREE_DIR/out/"* "$MAIN_REPO/ios/App/App/public/"

echo "→ Building Xcode..."
eval "$XCODE/xcodebuild \
  -project '$MAIN_REPO/ios/App/App.xcodeproj' \
  -scheme App -configuration Debug \
  -destination 'platform=iOS Simulator,id=$SIM_ID' \
  -derivedDataPath /tmp/checkin-build \
  build 2>&1 | grep -E 'error:|BUILD (SUCCEEDED|FAILED)' | tail -5"

echo "→ Installing and launching..."
eval "$XCODE/simctl" terminate "$SIM_ID" "$BUNDLE_ID" 2>/dev/null || true
eval "$XCODE/simctl" uninstall "$SIM_ID" "$BUNDLE_ID" 2>/dev/null || true
eval "$XCODE/simctl" install "$SIM_ID" /tmp/checkin-build/Build/Products/Debug-iphonesimulator/App.app
eval "$XCODE/simctl" launch "$SIM_ID" "$BUNDLE_ID"

echo "✓ Done"
