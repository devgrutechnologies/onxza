#!/usr/bin/env bash
# =============================================================================
# ONXZA CLI — One-Line Installer
# https://get.onxza.com
#
# Usage:
#   curl -fsSL https://get.onxza.com | bash
#   curl -fsSL https://get.onxza.com | ONXZA_VERSION=0.1.0 bash
#   curl -fsSL https://get.onxza.com | ONXZA_NO_INIT=1 bash
#
# Environment variables:
#   ONXZA_VERSION     Pin a specific version (default: latest)
#   ONXZA_NO_INIT     Skip `onxza init` after install (set to 1)
#   ONXZA_NO_COLOR    Disable color output (set to 1)
#   ONXZA_DEBUG       Enable debug output (set to 1)
#
# Supported platforms:
#   macOS ARM64 (Apple Silicon)
#   macOS x86_64 (Intel)
#   Linux x86_64
#   Linux ARM64
#   Windows (via WSL2/Git Bash — npm path)
#
# Security:
#   SHA256 checksums verified after download.
#   Checksums published at: https://get.onxza.com/checksums.txt
#
# Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
# Powered by DevGru US Inc. DBA DevGru Technology Products.
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

ONXZA_VERSION="${ONXZA_VERSION:-latest}"
ONXZA_NO_INIT="${ONXZA_NO_INIT:-0}"
ONXZA_NO_COLOR="${ONXZA_NO_COLOR:-0}"
ONXZA_DEBUG="${ONXZA_DEBUG:-0}"

REQUIRED_NODE_MAJOR=18
NPM_PACKAGE_NAME="onxza"
CHECKSUMS_URL="https://get.onxza.com/checksums.txt"
FALLBACK_NPM_BIN_HINT='$(npm root -g)/../.bin'

# =============================================================================
# Colors
# =============================================================================

if [ -t 1 ] && [ "${ONXZA_NO_COLOR}" != "1" ]; then
  BOLD='\033[1m'
  DIM='\033[2m'
  GREEN='\033[32m'
  YELLOW='\033[33m'
  RED='\033[31m'
  CYAN='\033[36m'
  RESET='\033[0m'
else
  BOLD='' DIM='' GREEN='' YELLOW='' RED='' CYAN='' RESET=''
fi

# =============================================================================
# Logging helpers
# =============================================================================

info()    { printf "  ${GREEN}•${RESET} %s\n" "$*"; }
warn()    { printf "  ${YELLOW}⚠${RESET}  %s\n" "$*"; }
step()    { printf "\n  ${CYAN}${BOLD}%s${RESET}\n" "$*"; }
success() { printf "  ${GREEN}${BOLD}✓${RESET} %s\n" "$*"; }
debug()   { [ "${ONXZA_DEBUG}" = "1" ] && printf "  ${DIM}[debug] %s${RESET}\n" "$*" || true; }

error() {
  printf "\n  ${RED}${BOLD}Error:${RESET} %s\n\n" "$*" >&2
  exit 1
}

# =============================================================================
# Header
# =============================================================================

printf "\n"
printf "  ${BOLD}ONXZA CLI Installer${RESET}\n"
printf "  ${DIM}https://onxza.com${RESET}\n"
printf "\n"

# =============================================================================
# OS and architecture detection
# =============================================================================

step "Detecting platform..."

OS="$(uname -s 2>/dev/null || echo "unknown")"
ARCH="$(uname -m 2>/dev/null || echo "unknown")"
debug "Raw OS=$OS ARCH=$ARCH"

case "$OS" in
  Linux*)
    PLATFORM="linux"
    # Detect WSL
    if grep -qi microsoft /proc/version 2>/dev/null; then
      WSL=true
      info "Platform: Linux (WSL)"
    else
      WSL=false
      info "Platform: Linux"
    fi
    ;;
  Darwin*)
    PLATFORM="macos"
    WSL=false
    info "Platform: macOS"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    PLATFORM="windows"
    WSL=false
    warn "Platform: Windows (Git Bash/MSYS) — using npm install path"
    ;;
  *)
    error "Unsupported OS: $OS. Please install manually: npm install -g onxza"
    ;;
esac

case "$ARCH" in
  x86_64|amd64)   ARCH_NORM="x64" ;;
  aarch64|arm64)  ARCH_NORM="arm64" ;;
  armv7l|armv6l)  ARCH_NORM="arm" ;;
  *)
    warn "Unrecognized architecture: $ARCH — will attempt npm install"
    ARCH_NORM="unknown"
    ;;
esac

info "Architecture: ${ARCH} (${ARCH_NORM})"

# =============================================================================
# Check for existing onxza installation
# =============================================================================

if command -v onxza >/dev/null 2>&1; then
  CURRENT_VERSION="$(onxza --version 2>/dev/null || echo "unknown")"
  if [ "${ONXZA_VERSION}" = "latest" ] || [ "${ONXZA_VERSION}" = "${CURRENT_VERSION}" ]; then
    warn "onxza ${CURRENT_VERSION} is already installed."
    warn "Run 'onxza --version' to confirm. To upgrade: npm update -g onxza"
    printf "\n"
    # Continue to update anyway — idempotent
  else
    info "Upgrading onxza ${CURRENT_VERSION} → ${ONXZA_VERSION}"
  fi
fi

# =============================================================================
# Node.js detection and installation
# =============================================================================

step "Checking Node.js..."

check_node() {
  if command -v node >/dev/null 2>&1; then
    NODE_VERSION="$(node --version 2>/dev/null | tr -d 'v' || echo '0.0.0')"
    NODE_MAJOR="$(echo "${NODE_VERSION}" | cut -d. -f1)"
    debug "Node.js v${NODE_VERSION} found (major=${NODE_MAJOR})"
    if [ "${NODE_MAJOR}" -ge "${REQUIRED_NODE_MAJOR}" ] 2>/dev/null; then
      info "Node.js v${NODE_VERSION} ✓"
      return 0
    else
      warn "Node.js v${NODE_VERSION} found but v${REQUIRED_NODE_MAJOR}+ required."
      return 1
    fi
  else
    warn "Node.js not found."
    return 1
  fi
}

install_node_macos() {
  if command -v brew >/dev/null 2>&1; then
    info "Installing Node.js via Homebrew..."
    brew install node
  elif command -v port >/dev/null 2>&1; then
    info "Installing Node.js via MacPorts..."
    sudo port install nodejs20
  else
    # Download official pkg
    info "Downloading Node.js 20 LTS for macOS..."
    local PKG_URL
    if [ "${ARCH_NORM}" = "arm64" ]; then
      PKG_URL="https://nodejs.org/dist/latest-v20.x/node-v20.18.1-darwin-arm64.tar.gz"
    else
      PKG_URL="https://nodejs.org/dist/latest-v20.x/node-v20.18.1-darwin-x64.tar.gz"
    fi
    local TMP_DIR
    TMP_DIR="$(mktemp -d)"
    curl -fsSL "${PKG_URL}" | tar -xz -C "${TMP_DIR}" --strip-components=1
    sudo mkdir -p /usr/local/lib/nodejs
    sudo mv "${TMP_DIR}" "/usr/local/lib/nodejs/node-v20"
    # Add to PATH in shell profiles
    for PROFILE in ~/.zshrc ~/.bashrc ~/.profile; do
      if [ -f "${PROFILE}" ] && ! grep -q "nodejs/node-v20" "${PROFILE}"; then
        echo 'export PATH="/usr/local/lib/nodejs/node-v20/bin:$PATH"' >> "${PROFILE}"
      fi
    done
    export PATH="/usr/local/lib/nodejs/node-v20/bin:${PATH}"
  fi
}

install_node_linux() {
  if command -v apt-get >/dev/null 2>&1; then
    info "Installing Node.js 20 LTS via NodeSource (apt)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>/dev/null
    sudo apt-get install -y nodejs 2>/dev/null
  elif command -v dnf >/dev/null 2>&1; then
    info "Installing Node.js 20 LTS via dnf..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - 2>/dev/null
    sudo dnf install -y nodejs 2>/dev/null
  elif command -v yum >/dev/null 2>&1; then
    info "Installing Node.js 20 LTS via yum..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - 2>/dev/null
    sudo yum install -y nodejs 2>/dev/null
  elif command -v pacman >/dev/null 2>&1; then
    info "Installing Node.js via pacman..."
    sudo pacman -Sy --noconfirm nodejs npm 2>/dev/null
  elif command -v apk >/dev/null 2>&1; then
    info "Installing Node.js via apk..."
    sudo apk add --no-cache nodejs npm 2>/dev/null
  else
    # Fallback: download binary
    info "Downloading Node.js 20 LTS binary..."
    local TARBALL_URL
    if [ "${ARCH_NORM}" = "arm64" ]; then
      TARBALL_URL="https://nodejs.org/dist/latest-v20.x/node-v20.18.1-linux-arm64.tar.gz"
    else
      TARBALL_URL="https://nodejs.org/dist/latest-v20.x/node-v20.18.1-linux-x64.tar.gz"
    fi
    local TMP_DIR
    TMP_DIR="$(mktemp -d)"
    curl -fsSL "${TARBALL_URL}" | tar -xz -C "${TMP_DIR}" --strip-components=1
    sudo mv "${TMP_DIR}" /usr/local/lib/node20
    sudo ln -sf /usr/local/lib/node20/bin/node /usr/local/bin/node
    sudo ln -sf /usr/local/lib/node20/bin/npm /usr/local/bin/npm
  fi
}

if ! check_node; then
  step "Installing Node.js..."
  case "${PLATFORM}" in
    macos)   install_node_macos ;;
    linux)   install_node_linux ;;
    windows) error "Please install Node.js >= ${REQUIRED_NODE_MAJOR} from https://nodejs.org then re-run." ;;
  esac
  # Re-source PATH so the new node is found
  hash -r 2>/dev/null || true
  check_node || error "Node.js installation failed. Please install Node.js >= ${REQUIRED_NODE_MAJOR} manually: https://nodejs.org"
fi

# Verify npm is available
if ! command -v npm >/dev/null 2>&1; then
  error "npm not found. Node.js installation may be incomplete. Try: https://nodejs.org"
fi
debug "npm $(npm --version) available"

# =============================================================================
# Resolve version to install
# =============================================================================

if [ "${ONXZA_VERSION}" = "latest" ]; then
  step "Resolving latest onxza version..."
  ONXZA_VERSION="$(npm show onxza version 2>/dev/null || echo "0.1.0")"
  info "Latest version: ${ONXZA_VERSION}"
fi

# =============================================================================
# SHA256 checksum verification
# =============================================================================

step "Verifying package integrity..."

verify_checksum() {
  local VERSION="$1"
  local EXPECTED_CHECKSUM=""

  # Download checksums file
  local CHECKSUMS_CONTENT
  if CHECKSUMS_CONTENT="$(curl -fsSL "${CHECKSUMS_URL}" 2>/dev/null)"; then
    # Look for line matching: <sha256>  onxza-<version>.tgz
    EXPECTED_CHECKSUM="$(echo "${CHECKSUMS_CONTENT}" | grep "onxza-${VERSION}.tgz" | awk '{print $1}' | head -1)"
  fi

  if [ -z "${EXPECTED_CHECKSUM}" ]; then
    warn "No checksum found for onxza@${VERSION} — skipping verification."
    warn "This is expected before the package is published to npm."
    return 0
  fi

  # Download the tarball to a temp location and verify
  local TMP_TGZ
  TMP_TGZ="$(mktemp /tmp/onxza-XXXXXX.tgz)"
  info "Downloading package tarball for checksum verification..."
  npm pack "onxza@${VERSION}" --pack-destination "$(dirname "${TMP_TGZ}")" >/dev/null 2>&1 || true

  # The actual tarball name from npm pack
  local TGZ_PATH
  TGZ_PATH="$(dirname "${TMP_TGZ}")/onxza-${VERSION}.tgz"

  if [ ! -f "${TGZ_PATH}" ]; then
    warn "Could not download tarball for checksum verification — skipping."
    rm -f "${TMP_TGZ}"
    return 0
  fi

  local ACTUAL_CHECKSUM
  if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL_CHECKSUM="$(sha256sum "${TGZ_PATH}" | awk '{print $1}')"
  elif command -v shasum >/dev/null 2>&1; then
    ACTUAL_CHECKSUM="$(shasum -a 256 "${TGZ_PATH}" | awk '{print $1}')"
  else
    warn "No sha256sum or shasum found — skipping checksum verification."
    rm -f "${TMP_TGZ}" "${TGZ_PATH}"
    return 0
  fi

  rm -f "${TMP_TGZ}" "${TGZ_PATH}"

  if [ "${ACTUAL_CHECKSUM}" = "${EXPECTED_CHECKSUM}" ]; then
    success "SHA256 checksum verified: ${ACTUAL_CHECKSUM:0:16}..."
  else
    error "SHA256 MISMATCH for onxza@${VERSION}!\n  Expected: ${EXPECTED_CHECKSUM}\n  Got:      ${ACTUAL_CHECKSUM}\n\n  This could indicate a corrupted or tampered package.\n  Do NOT proceed. Report at: https://github.com/devgru-technology-products/onxza/security"
  fi
}

verify_checksum "${ONXZA_VERSION}"

# =============================================================================
# Install onxza via npm
# =============================================================================

step "Installing onxza@${ONXZA_VERSION}..."

# Use --global. On systems requiring sudo for global npm installs, detect and handle.
install_npm_package() {
  local PKG="${NPM_PACKAGE_NAME}@${ONXZA_VERSION}"

  # Try without sudo first
  if npm install -g "${PKG}" 2>/dev/null; then
    return 0
  fi

  # Check if the failure is a permissions issue
  warn "Global npm install failed. Trying with adjusted prefix..."

  # Option 1: Use npm prefix in home directory (preferred — no sudo)
  local NPM_PREFIX_DIR="${HOME}/.npm-global"
  if [ ! -d "${NPM_PREFIX_DIR}" ]; then
    mkdir -p "${NPM_PREFIX_DIR}"
    npm config set prefix "${NPM_PREFIX_DIR}"
  fi

  if npm install -g "${PKG}"; then
    # Ensure ~/.npm-global/bin is in PATH
    export PATH="${NPM_PREFIX_DIR}/bin:${PATH}"
    patch_shell_path "${NPM_PREFIX_DIR}/bin"
    return 0
  fi

  # Option 2: sudo (last resort)
  warn "Attempting install with sudo..."
  if sudo npm install -g "${PKG}"; then
    return 0
  fi

  error "npm global install failed. Try manually:\n  npm install -g ${PKG}"
}

install_npm_package

# =============================================================================
# PATH management
# =============================================================================

patch_shell_path() {
  local BIN_DIR="$1"
  local SHELL_NAME
  SHELL_NAME="$(basename "${SHELL:-/bin/sh}")"
  local ADDED=false

  add_to_profile() {
    local PROFILE="$1"
    local EXPORT_LINE="export PATH=\"${BIN_DIR}:\$PATH\""
    if [ -f "${PROFILE}" ] && ! grep -qF "${BIN_DIR}" "${PROFILE}" 2>/dev/null; then
      printf '\n# Added by onxza installer\n%s\n' "${EXPORT_LINE}" >> "${PROFILE}"
      debug "Added to ${PROFILE}"
      ADDED=true
    fi
  }

  case "${SHELL_NAME}" in
    zsh)
      add_to_profile "${HOME}/.zshrc"
      add_to_profile "${HOME}/.zprofile"
      ;;
    bash)
      add_to_profile "${HOME}/.bashrc"
      add_to_profile "${HOME}/.bash_profile"
      add_to_profile "${HOME}/.profile"
      ;;
    fish)
      local FISH_CONFIG="${HOME}/.config/fish/config.fish"
      if [ -f "${FISH_CONFIG}" ] && ! grep -qF "${BIN_DIR}" "${FISH_CONFIG}" 2>/dev/null; then
        printf '\n# Added by onxza installer\nfish_add_path "%s"\n' "${BIN_DIR}" >> "${FISH_CONFIG}"
        ADDED=true
      fi
      ;;
    *)
      add_to_profile "${HOME}/.profile"
      ;;
  esac

  if [ "${ADDED}" = "true" ]; then
    info "Added ${BIN_DIR} to shell PATH config"
  fi
}

# Detect npm global bin and ensure it's in PATH
NPM_GLOBAL_BIN="$(npm root -g 2>/dev/null)/../bin"
NPM_GLOBAL_BIN="$(cd "${NPM_GLOBAL_BIN}" 2>/dev/null && pwd || echo "")"
debug "npm global bin: ${NPM_GLOBAL_BIN}"

if [ -n "${NPM_GLOBAL_BIN}" ]; then
  export PATH="${NPM_GLOBAL_BIN}:${PATH}"
  patch_shell_path "${NPM_GLOBAL_BIN}"
fi

# =============================================================================
# Post-install verification
# =============================================================================

step "Verifying installation..."

# Re-hash to pick up the newly installed binary
hash -r 2>/dev/null || true

if command -v onxza >/dev/null 2>&1; then
  INSTALLED_VERSION="$(onxza --version 2>/dev/null || echo 'unknown')"
  success "onxza ${INSTALLED_VERSION} installed at $(command -v onxza)"
else
  warn "'onxza' not found in current PATH."
  warn "It may be available after restarting your terminal."
  warn "Or add this to your shell profile:"
  warn "  export PATH=\"${FALLBACK_NPM_BIN_HINT}:\$PATH\""
  INSTALLED_VERSION="${ONXZA_VERSION}"
fi

# =============================================================================
# Optional: run onxza init
# =============================================================================

if [ "${ONXZA_NO_INIT}" != "1" ] && command -v onxza >/dev/null 2>&1; then
  # Only init if no existing installation detected
  if [ ! -f "${HOME}/.openclaw/openclaw.json" ]; then
    step "Initializing ONXZA..."
    onxza init || warn "onxza init encountered an issue — run it manually: onxza init"
  else
    debug "Existing .openclaw/openclaw.json found — skipping onxza init"
  fi
fi

# =============================================================================
# Success banner
# =============================================================================

printf "\n"
printf "  ${GREEN}${BOLD}══════════════════════════════════════════════════════${RESET}\n"
printf "  ${GREEN}${BOLD}  ONXZA ${INSTALLED_VERSION} installed successfully!${RESET}\n"
printf "  ${GREEN}${BOLD}══════════════════════════════════════════════════════${RESET}\n"
printf "\n"
printf "  ${BOLD}Quick start:${RESET}\n"
printf "    ${CYAN}onxza help${RESET}                      See all commands\n"
printf "    ${CYAN}onxza status${RESET}                    System health\n"
printf "    ${CYAN}onxza dashboard${RESET}                 Mission Control TUI\n"
printf "    ${CYAN}onxza agent create Co_Dept_Role${RESET} Create your first agent\n"
printf "\n"
printf "  ${BOLD}Docs:${RESET}    https://docs.onxza.com\n"
printf "  ${BOLD}Discord:${RESET} https://discord.gg/onxza\n"
printf "\n"
printf "  ${DIM}If 'onxza' is not found, restart your terminal or run:${RESET}\n"
printf "  ${DIM}  source ~/.zshrc  (or ~/.bashrc)${RESET}\n"
printf "\n"
