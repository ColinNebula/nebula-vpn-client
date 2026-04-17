#!/bin/bash
# =============================================================================
# Nebula VPN – WireGuard Server Setup Script
# =============================================================================
# Run this script as root on a fresh Ubuntu 22.04/24.04 VPS:
#
#   curl -fsSL https://raw.githubusercontent.com/ColinNebula/nebula-vpn-client/main/server/setup-wireguard-server.sh | sudo bash
#
# Or copy it to the server and run:
#   chmod +x setup-wireguard-server.sh && sudo ./setup-wireguard-server.sh
#
# When the script finishes it prints the three values you need to paste into
# your server/.env file:
#   WG_SERVER_PUBLIC_KEY
#   WG_SERVER_ENDPOINT
#   WG_INTERFACE
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Root check ────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "This script must be run as root. Use: sudo $0"

# ── Config ────────────────────────────────────────────────────────────────────
WG_IFACE="${WG_IFACE:-wg0}"
WG_PORT="${WG_PORT:-51820}"
WG_SUBNET="${WG_SUBNET:-10.8.0.1/24}"
WG_DIR="/etc/wireguard"
SERVER_CONF="${WG_DIR}/${WG_IFACE}.conf"

# ── Detect public IP ──────────────────────────────────────────────────────────
info "Detecting server public IP..."
SERVER_IP=$(curl -s --max-time 5 https://api.ipify.org || \
            curl -s --max-time 5 https://ifconfig.me  || \
            curl -s --max-time 5 https://icanhazip.com | tr -d '\n')

if [[ -z "$SERVER_IP" ]]; then
  warn "Could not auto-detect public IP. Please enter it manually."
  read -rp "Server public IP: " SERVER_IP
fi
success "Server public IP: ${SERVER_IP}"

# ── Detect primary network interface ─────────────────────────────────────────
NET_IF=$(ip route get 8.8.8.8 2>/dev/null | awk '/dev/{print $5; exit}')
[[ -z "$NET_IF" ]] && NET_IF="eth0"
info "Primary network interface: ${NET_IF}"

# ── 1. Install dependencies ───────────────────────────────────────────────────
info "Updating package list and installing WireGuard + iptables..."
apt-get update -qq
apt-get install -y -qq wireguard wireguard-tools iptables curl ufw 2>/dev/null || \
  apt-get install -y -qq wireguard wireguard-tools iptables curl
success "Packages installed"

# ── 2. Enable IPv4 forwarding ─────────────────────────────────────────────────
info "Enabling IP forwarding..."
sysctl -w net.ipv4.ip_forward=1 > /dev/null

if ! grep -q "^net.ipv4.ip_forward=1" /etc/sysctl.conf; then
  echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
fi
# IPv6 forwarding too
sysctl -w net.ipv6.conf.all.forwarding=1 > /dev/null 2>&1 || true
if ! grep -q "^net.ipv6.conf.all.forwarding=1" /etc/sysctl.conf; then
  echo "net.ipv6.conf.all.forwarding=1" >> /etc/sysctl.conf
fi
success "IP forwarding enabled"

# ── 3. Generate server key pair ───────────────────────────────────────────────
mkdir -p "${WG_DIR}"
chmod 700 "${WG_DIR}"

PRIV_KEY_FILE="${WG_DIR}/server_private.key"
PUB_KEY_FILE="${WG_DIR}/server_public.key"

if [[ -f "${PRIV_KEY_FILE}" ]]; then
  warn "Server keys already exist – reusing existing keys."
else
  info "Generating WireGuard server key pair..."
  wg genkey | tee "${PRIV_KEY_FILE}" | wg pubkey > "${PUB_KEY_FILE}"
  chmod 600 "${PRIV_KEY_FILE}"
  chmod 644 "${PUB_KEY_FILE}"
  success "Keys generated"
fi

SERVER_PRIV_KEY=$(cat "${PRIV_KEY_FILE}")
SERVER_PUB_KEY=$(cat "${PUB_KEY_FILE}")

# ── 4. Write WireGuard config ─────────────────────────────────────────────────
info "Writing WireGuard interface config to ${SERVER_CONF}..."

# Backup existing config if present
[[ -f "${SERVER_CONF}" ]] && cp "${SERVER_CONF}" "${SERVER_CONF}.bak.$(date +%s)"

cat > "${SERVER_CONF}" <<EOF
[Interface]
Address = ${WG_SUBNET}
ListenPort = ${WG_PORT}
PrivateKey = ${SERVER_PRIV_KEY}

# NAT: forward VPN traffic out through the primary interface
PostUp   = iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o ${NET_IF} -j MASQUERADE
PostUp   = ip6tables -t nat -A POSTROUTING -s fd86:ea04:1115::/64 -o ${NET_IF} -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -s 10.8.0.0/24 -o ${NET_IF} -j MASQUERADE
PostDown = ip6tables -t nat -D POSTROUTING -s fd86:ea04:1115::/64 -o ${NET_IF} -j MASQUERADE

# Peers are added dynamically by the Nebula VPN API server via: wg set wg0 peer ...
EOF

chmod 600 "${SERVER_CONF}"
success "WireGuard config written"

# ── 5. Enable and start WireGuard ─────────────────────────────────────────────
info "Enabling wg-quick@${WG_IFACE} systemd service..."
systemctl enable "wg-quick@${WG_IFACE}" > /dev/null 2>&1
systemctl start  "wg-quick@${WG_IFACE}" || {
  warn "wg-quick start failed – checking if interface is already up..."
  wg-quick up "${SERVER_CONF}" 2>/dev/null || true
}
success "WireGuard interface ${WG_IFACE} is running"

# ── 6. Firewall rules ─────────────────────────────────────────────────────────
info "Opening firewall port ${WG_PORT}/udp..."

# Try UFW first, fall back to iptables
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow "${WG_PORT}/udp" comment "WireGuard" > /dev/null
  ufw allow 22/tcp comment "SSH"                 > /dev/null
  ufw allow 3001/tcp comment "Nebula API"        > /dev/null
  success "UFW rules applied"
else
  # Direct iptables rules
  iptables  -A INPUT  -p udp --dport "${WG_PORT}" -j ACCEPT
  iptables  -A INPUT  -i   "${WG_IFACE}"          -j ACCEPT
  iptables  -A FORWARD -i  "${WG_IFACE}"          -j ACCEPT
  iptables  -A FORWARD -o  "${WG_IFACE}" -m state --state RELATED,ESTABLISHED -j ACCEPT

  # Persist rules
  if command -v netfilter-persistent &>/dev/null; then
    netfilter-persistent save > /dev/null 2>&1 || true
  elif command -v iptables-save &>/dev/null; then
    iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
    iptables-save > /etc/iptables.rules    2>/dev/null || true
  fi

  success "iptables rules applied"
fi

# ── 7. Verify interface is up ─────────────────────────────────────────────────
info "Verifying WireGuard interface..."
if wg show "${WG_IFACE}" &>/dev/null; then
  success "Interface ${WG_IFACE} confirmed up"
else
  warn "Interface may not be up yet. Run: wg show ${WG_IFACE}"
fi

# ── 8. Install Node.js + Nebula API (optional) ────────────────────────────────
if ! command -v node &>/dev/null; then
  info "Node.js not found. Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null
  success "Node.js $(node -v) installed"
else
  success "Node.js $(node -v) already installed"
fi

# ── 9. Print .env values ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  WireGuard server setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Copy these three lines into your ${CYAN}server/.env${NC} file:"
echo ""
echo -e "${YELLOW}WG_INTERFACE=${WG_IFACE}${NC}"
echo -e "${YELLOW}WG_SERVER_PUBLIC_KEY=${SERVER_PUB_KEY}${NC}"
echo -e "${YELLOW}WG_SERVER_ENDPOINT=${SERVER_IP}:${WG_PORT}${NC}"
echo -e "${YELLOW}WG_DNS=1.1.1.1,1.0.0.1${NC}"
echo -e "${YELLOW}WG_SUBNET=10.8.0.0/24${NC}"
echo ""
echo -e "Verify the interface at any time with: ${CYAN}wg show ${WG_IFACE}${NC}"
echo -e "View connected peers in real time with: ${CYAN}watch -n1 wg show${NC}"
echo ""

# ── 10. Create a quick-status alias ──────────────────────────────────────────
if ! grep -q "alias wg-status" /root/.bashrc 2>/dev/null; then
  echo "alias wg-status='wg show && echo && ip addr show ${WG_IFACE}'" >> /root/.bashrc
fi

exit 0
