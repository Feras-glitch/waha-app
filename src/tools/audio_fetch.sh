#!/usr/bin/env bash
# The recitation pack for one build (build-all.yml calls this in each job).
# - No release yet for $AUDIO_TAG: the build goes on without recitation, with a warning (the first builds of a fork).
# - A release exists but the download fails, or the zip is not the pack recorded in src/tools/audio.sha256, or it holds no
#   audio/manifest.js: the build stops. A published version is never replaced, so a version silently built without its
#   recitation (or with another pack than its siblings) would stay that way.
set -euo pipefail
TAG="${AUDIO_TAG:?AUDIO_TAG}"
ZIP="${RUNNER_TEMP:-/tmp}/waha-audio.zip"
if ! gh api "repos/${GITHUB_REPOSITORY}/releases/tags/${TAG}" >/dev/null 2>&1; then
  echo "::warning::حزمة التلاوة (${TAG}) لم تُنشر بعد، فتُبنى هذه النسخة بلا تلاوة. شغّلوا «Audio pack» من صفحة Actions."
  exit 0
fi
gh release download "$TAG" -p waha-audio.zip -D "$(dirname "$ZIP")" --clobber
GOT=$(sha256sum "$ZIP" | cut -d' ' -f1)
SUM="src/tools/audio.sha256"
if [ -s "$SUM" ]; then
  WANT=$(cut -d' ' -f1 "$SUM")
  if [ "$WANT" != "$GOT" ]; then
    echo "::error::حزمة التلاوة المنشورة (${GOT}) ليست المسجّلة في ${SUM} (${WANT}). إن كانت حزمةً جديدة مقصودة فسجّلوا بصمتها في الملف."
    exit 1
  fi
else
  echo "::warning::لا بصمة مسجّلة لحزمة التلاوة في ${SUM}. بصمة هذه الحزمة: ${GOT}"
fi
unzip -q -o "$ZIP" -d web
test -f web/audio/manifest.js || { echo "::error::الحزمة بلا audio/manifest.js"; exit 1; }
du -sh web/audio
