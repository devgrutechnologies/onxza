#!/usr/bin/env bash
# generate-checksums.sh — Generate checksums.txt for a released onxza version.
#
# Run after `npm publish` to produce the checksums file that the install script
# downloads and verifies against.
#
# Usage:
#   ./generate-checksums.sh 0.1.0
#   ./generate-checksums.sh $(node -p "require('../cli/package.json').version")
#
# Output: checksums.txt (SHA256 of the npm tarball)
# Upload to: https://get.onxza.com/checksums.txt (alongside install.sh)
#
# Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
# Powered by DevGru US Inc. DBA DevGru Technology Products.

set -euo pipefail

VERSION="${1:-}"
if [ -z "${VERSION}" ]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

echo "Generating checksums for onxza@${VERSION}..."

# Download the published tarball from npm
TMP_DIR="$(mktemp -d)"
cd "${TMP_DIR}"

echo "  Downloading onxza@${VERSION} from npm..."
npm pack "onxza@${VERSION}" >/dev/null 2>&1
TARBALL="onxza-${VERSION}.tgz"

if [ ! -f "${TARBALL}" ]; then
  echo "Error: tarball not found after npm pack" >&2
  exit 1
fi

# Compute SHA256
if command -v sha256sum >/dev/null 2>&1; then
  CHECKSUM="$(sha256sum "${TARBALL}" | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  CHECKSUM="$(shasum -a 256 "${TARBALL}" | awk '{print $1}')"
else
  echo "Error: no sha256sum or shasum found" >&2
  exit 1
fi

# Write checksums.txt (append — supports multiple versions in one file)
CHECKSUMS_FILE="$(dirname "$0")/checksums.txt"
cd - >/dev/null

# Remove any existing line for this version
if [ -f "${CHECKSUMS_FILE}" ]; then
  grep -v "onxza-${VERSION}.tgz" "${CHECKSUMS_FILE}" > "${CHECKSUMS_FILE}.tmp" 2>/dev/null || true
  mv "${CHECKSUMS_FILE}.tmp" "${CHECKSUMS_FILE}"
fi

echo "${CHECKSUM}  onxza-${VERSION}.tgz" >> "${CHECKSUMS_FILE}"
sort -k2 "${CHECKSUMS_FILE}" -o "${CHECKSUMS_FILE}"

echo "  SHA256: ${CHECKSUM}"
echo "  Written to: ${CHECKSUMS_FILE}"
echo ""
echo "Upload checksums.txt to https://get.onxza.com/checksums.txt"

# Cleanup
rm -rf "${TMP_DIR}"
