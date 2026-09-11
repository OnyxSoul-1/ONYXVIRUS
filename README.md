# ⛧ ONYXVIRUS

**A BeEF-style control panel with a real crypto + recon terminal.**

Live demo: `https://github.com/OnyxSoul-1/ONYXVIRUS`

---

## What it is

A browser-based control panel that combines:
- A **simulated BeEF-style C2 panel** (hooked browsers, command modules)
- A **real terminal** with working crypto and recon tools

Everything runs locally. Nothing leaves your browser unless you send it.

---

## Files
onyxvirus/
├── index.html
├── style.css
├── terminal.js
├── tools/
│ ├── crypto.js — AES-GCM, hashing, encoders, stego
│ ├── recon.js — DNS, subdomains, IP geo, breach, DNSSEC
│ ├── vault.js — encrypted local storage
│ └── net.js — connection info, real RTT measurement
└── README.md

---

## Terminal commands

### Crypto
| Command | Description |
|---------|-------------|
| `encrypt <pw> <text>` | AES-256-GCM encrypt |
| `decrypt <pw> <cipher>` | Decrypt |
| `secret <pw> <msg>` | Generate encrypted share link |
| `hash <text>` | MD5, SHA-1, SHA-256, SHA-384, SHA-512 |
| `password [len]` | Strong password generator |
| `base64 enc\|dec` | Base64 |
| `hex enc\|dec` | Hex |
| `morse enc\|dec` | Morse code |
| `rot13 <text>` | ROT13 |
| `stego` | Hide text inside an image |
| `qr <text>` | Generate QR code |

### Recon (real public data)
| Command | Description |
|---------|-------------|
| `dns <domain>` | Real DNS lookup |
| `subdomain <domain>` | Subdomain discovery via crt.sh |
| `ip` | Your public IP + geolocation |
| `headers <url>` | Security headers scan |
| `dnssec <domain>` | DNSSEC validation |
| `breach <password>` | Check against Pwned Passwords |

### Network
| Command | Description |
|---------|-------------|
| `ping [host]` | Real round-trip measurement |
| `conn` | Connection info |
| `localip` | Detect WebRTC IP leaks |

### Vault
| Command | Description |
|---------|-------------|
| `vault <pw> <name> <value>` | Store encrypted secret |
| `vault-list` | List entries |
| `vault-get <pw> <name>` | Retrieve |
| `vault-del <name>` | Delete |

### Terminal
| Command | Description |
|---------|-------------|
| `help` | List all commands |
| `about` | About the tool |
| `theme [name]` | Change colors |
| `matrix` | Matrix rain |
| `history` | Command history |
| `clear` | Clear screen |

---

## Deploy on GitHub Pages

1. Create a repo called `onyxvirus`
2. Upload all files (keep the `tools/` folder structure)
3. Settings → Pages → Source: `main` branch, `/` root
4. Live at `https://YOUR_USERNAME.github.io/onyxvirus/`

---

## Ethical use

This is a **simulated** panel + **real** terminal tools. No real hooks,
no victims, no attacks. Some commands use real browser APIs (clipboard,
geolocation, camera) but only after you grant permission. Nothing leaves
your page.

**Never** use real exploitation frameworks on systems you don't own.

---

⛧ Built by **OnyxSoul** · Breaker of Limits · 🐟🎁
