// ============================================================
// ONYXVIRUS — Terminal Engine
// Handles input, history, tab-completion, command dispatch.
// ============================================================

const Terminal = (() => {

  const screen = document.getElementById('termScreen');
  const input = document.getElementById('termInput');

  let history = [];
  let histIdx = -1;
  let histStash = '';
  let theme = 'default';

  function print(html, cls='') {
    const d = document.createElement('div');
    d.className = 'term-line ' + cls;
    d.innerHTML = html;
    screen.appendChild(d);
    screen.scrollTop = screen.scrollHeight;
  }

  function printRaw(html) {
    const d = document.createElement('div');
    d.className = 'term-line';
    d.innerHTML = html;
    screen.appendChild(d);
    screen.scrollTop = screen.scrollHeight;
  }

  function clear() {
    screen.innerHTML = '';
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function echoPrompt(cmd) {
    print(`<span class="accent">⛧➜</span> <span class="dim">${esc(cmd)}</span>`);
  }

  // ---------- COMMANDS ----------
  const commands = {

    help: {
      desc: 'Show all commands',
      run: async () => {
        const groups = {
          'CRYPTO':      ['encrypt','decrypt','secret','vault','hash','password','base64','hex','morse','rot13'],
          'STEGO & QR':  ['stego','qr'],
          'RECON':       ['dns','subdomain','ip','headers','dnssec','breach'],
          'NETWORK':     ['ping','conn','localip'],
          'TERMINAL':    ['help','about','tools','theme','matrix','clear','history','echo']
        };
        printRaw(`<span class="accent">⛧ ONYXVIRUS — COMMANDS</span>`);
        printRaw('');
        for (const [group, cmds] of Object.entries(groups)) {
          printRaw(`<span class="info">▸ ${group}</span>`);
          for (const c of cmds) {
            if (commands[c]) {
              printRaw(`  <span class="ok">${c.padEnd(14)}</span> <span class="dim">${commands[c].desc}</span>`);
            }
          }
          printRaw('');
        }
        printRaw(`<span class="dim">Tip: type "help <command>" for usage.</span>`);
        return null;
      }
    },

    about: {
      desc: 'About ONYXVIRUS',
      run: async () => {
        printRaw(`<span class="accent">⛧ ONYXVIRUS v2.0</span>`);
        printRaw('');
        printRaw(`A BeEF-style control panel with a <span class="ok">real</span> crypto + recon terminal.`);
        printRaw('');
        printRaw(`Everything runs locally in your browser.`);
        printRaw(`No servers. No tracking. No data leaves unless you send it.`);
        printRaw('');
        printRaw(`<span class="warn">The panel is simulated. The terminal tools are real.</span>`);
        printRaw(`Built by OnyxSoul · 🐟🎁`);
        return null;
      }
    },

    tools: {
      desc: 'List command categories',
      run: async () => commands.help.run()
    },

    echo: {
      desc: 'Echo text back',
      run: async (args) => {
        if (!args.length) return printRaw('<span class="warn">Usage: echo &lt;text&gt;</span>');
        printRaw(esc(args.join(' ')));
        return null;
      }
    },

    history: {
      desc: 'Show recent commands',
      run: async () => {
        if (!history.length) return printRaw('<span class="dim">(no history)</span>');
        history.forEach((h,i) => printRaw(`<span class="dim">${String(i+1).padStart(3)}</span>  ${esc(h)}`));
        return null;
      }
    },

    clear: {
      desc: 'Clear the terminal',
      run: async () => { clear(); return null; }
    },

    // ---------- CRYPTO ----------
    encrypt: {
      desc: 'AES-256-GCM encrypt',
      usage: 'encrypt <password> <text>',
      run: async (args) => {
        if (args.length < 2) return printRaw('<span class="err">Usage: encrypt &lt;password&gt; &lt;text&gt;</span>');
        const pw = args[0];
        const text = args.slice(1).join(' ');
        const out = await Crypto.encrypt(text, pw);
        printRaw(`<span class="ok">🔐 Encrypted (AES-256-GCM):</span>`);
        printRaw(`<span class="hot">${esc(out)}</span>`);
        printRaw('');
        printRaw(`<span class="dim">Send the ciphertext. Share the password via a different channel.</span>`);
        return null;
      }
    },

    decrypt: {
      desc: 'Decrypt AES-256-GCM ciphertext',
      usage: 'decrypt <password> <ciphertext>',
      run: async (args) => {
        if (args.length < 2) return printRaw('<span class="err">Usage: decrypt &lt;password&gt; &lt;ciphertext&gt;</span>');
        const pw = args[0];
        const b64 = args.slice(1).join(' ');
        try {
          const out = await Crypto.decrypt(b64, pw);
          printRaw(`<span class="ok">🔓 Decrypted:</span>`);
          printRaw(esc(out));
        } catch(e) {
          printRaw(`<span class="err">❌ Wrong password or corrupted ciphertext.</span>`);
        }
        return null;
      }
    },

    secret: {
      desc: 'Create an encrypted share link',
      usage: 'secret <password> <message>',
      run: async (args) => {
        if (args.length < 2) return printRaw('<span class="err">Usage: secret &lt;password&gt; &lt;message&gt;</span>');
        const pw = args[0];
        const msg = args.slice(1).join(' ');
        const cipher = await Crypto.encrypt(msg, pw);
        const base = location.origin + location.pathname;
        const link = `${base}#msg=${encodeURIComponent(cipher)}`;
        printRaw(`<span class="ok">🔗 Encrypted share link:</span>`);
        printRaw(`<span class="hot">${esc(link)}</span>`);
        printRaw('');
        printRaw(`<span class="dim">Send this link. Only someone with the password can read it.</span>`);
        return null;
      }
    },

    hash: {
      desc: 'Hash text (MD5, SHA-1, SHA-256, SHA-384, SHA-512)',
      usage: 'hash <text>',
      run: async (args) => {
        const text = args.join(' ');
        if (!text) return printRaw('<span class="err">Usage: hash &lt;text&gt;</span>');
        const md5 = Crypto.md5(text);
        const sha1 = await Crypto.sha('SHA-1', text);
        const sha256 = await Crypto.sha('SHA-256', text);
        const sha384 = await Crypto.sha('SHA-384', text);
        const sha512 = await Crypto.sha('SHA-512', text);
        printRaw(`<span class="info">Input:</span> ${esc(text)}`);
        printRaw('');
        printRaw(`<span class="dim">MD5:     </span><span class="hot">${md5}</span>`);
        printRaw(`<span class="dim">SHA-1:   </span><span class="hot">${sha1}</span>`);
        printRaw(`<span class="dim">SHA-256: </span><span class="hot">${sha256}</span>`);
        printRaw(`<span class="dim">SHA-384: </span><span class="hot">${sha384}</span>`);
        printRaw(`<span class="dim">SHA-512: </span><span class="hot">${sha512}</span>`);
        return null;
      }
    },

    password: {
      desc: 'Generate a strong password',
      usage: 'password [length] [--readable]',
      run: async (args) => {
        const len = parseInt(args[0]) || 20;
        const opts = { readable: args.includes('--readable') };
        const pw = Crypto.generatePassword(len, opts);
        const s = Crypto.passwordStrength(pw);
        const labels = ['','VERY WEAK','WEAK','FAIR','STRONG','VERY STRONG'];
        printRaw(`<span class="ok">🔑 Password:</span>`);
        printRaw(`<span class="hot">${esc(pw)}</span>`);
        printRaw('');
        printRaw(`<span class="dim">Length: ${len} · Strength: ${labels[s]}</span>`);
        return null;
      }
    },

    base64: {
      desc: 'Base64 encode / decode',
      usage: 'base64 enc|dec <text>',
      run: async (args) => {
        const [mode, ...rest] = args;
        const text = rest.join(' ');
        if (!mode || !text) return printRaw('<span class="err">Usage: base64 enc|dec &lt;text&gt;</span>');
        if (mode === 'enc') {
          printRaw(`<span class="hot">${esc(btoa(unescape(encodeURIComponent(text))))}</span>`);
        } else {
          try { printRaw(`<span class="hot">${esc(decodeURIComponent(escape(atob(text))))}</span>`); }
          catch(e) { printRaw(`<span class="err">Invalid Base64</span>`); }
        }
        return null;
      }
    },

    hex: {
      desc: 'Hex encode / decode',
      usage: 'hex enc|dec <text>',
      run: async (args) => {
        const [mode, ...rest] = args;
        const text = rest.join(' ');
        if (!mode || !text) return printRaw('<span class="err">Usage: hex enc|dec &lt;text&gt;</span>');
        if (mode === 'enc') {
          printRaw(`<span class="hot">${Crypto.bytesToHex(new TextEncoder().encode(text))}</span>`);
        } else {
          try {
            printRaw(`<span class="hot">${esc(new TextDecoder().decode(Crypto.hexToBytes(text)))}</span>`);
          } catch(e) { printRaw(`<span class="err">Invalid hex</span>`); }
        }
        return null;
      }
    },

    morse: {
      desc: 'Morse code encode / decode',
      usage: 'morse enc|dec <text>',
      run: async (args) => {
        const [mode, ...rest] = args;
        const text = rest.join(' ');
        if (!mode || !text) return printRaw('<span class="err">Usage: morse enc|dec &lt;text&gt;</span>');
        if (mode === 'enc') printRaw(`<span class="hot">${esc(Crypto.morseEncode(text))}</span>`);
        else printRaw(`<span class="hot">${esc(Crypto.morseDecode(text))}</span>`);
        return null;
      }
    },

    rot13: {
      desc: 'ROT13 encode/decode',
      usage: 'rot13 <text>',
      run: async (args) => {
        printRaw(`<span class="hot">${esc(Crypto.rot13(args.join(' ')))}</span>`);
        return null;
      }
    },

    // ---------- STEGO ----------
    stego: {
      desc: 'Hide text in an image',
      run: async () => {
        printRaw(`<span class="info">Opening file picker...</span>`);
        const picker = document.createElement('input');
        picker.type = 'file';
        picker.accept = 'image/*';
        picker.onchange = async () => {
          const f = picker.files[0];
          if (!f) return;
          const msg = window.prompt('Secret message to hide:');
          if (!msg) return;
          try {
            const url = await Crypto.hideInImage(f, msg);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'onyxvirus-stego.png';
            a.click();
            printRaw(`<span class="ok">✓ Encoded. Downloaded: onyxvirus-stego.png</span>`);
          } catch(e) {
            printRaw(`<span class="err">❌ ${esc(e.message)}</span>`);
          }
        };
        picker.click();
        return null;
      }
    },

    qr: {
      desc: 'Generate a QR code',
      usage: 'qr <text>',
      run: async (args) => {
        const text = args.join(' ');
        if (!text) return printRaw('<span class="err">Usage: qr &lt;text&gt;</span>');
        const url = await Crypto.qrURL(text);
        printRaw(`<span class="info">▸ QR for:</span> ${esc(text)}`);
        printRaw(`<img src="${url}" style="max-width:200px;border:4px solid #fff;border-radius:.3rem;background:#fff;padding:4px;margin-top:.5rem;" />`);
        return null;
      }
    },

    // ---------- RECON ----------
    dns: {
      desc: 'Real DNS lookup',
      usage: 'dns <domain>',
      run: async (args) => {
        const domain = args[0];
        if (!domain) return printRaw('<span class="err">Usage: dns &lt;domain&gt;</span>');
        printRaw(`<span class="info">▸ Querying ${esc(domain)}...</span>`);
        const out = await Recon.dns(domain);
        for (const [type, list] of Object.entries(out)) {
          printRaw(`<span class="dim">${type}:</span>`);
          if (list.length) list.forEach(a => printRaw(`  <span class="ok">${esc(a)}</span>`));
          else printRaw(`  <span class="dim">(none)</span>`);
        }
        return null;
      }
    },

    subdomain: {
      desc: 'Find subdomains via crt.sh',
      usage: 'subdomain <domain>',
      run: async (args) => {
        const domain = args[0];
        if (!domain) return printRaw('<span class="err">Usage: subdomain &lt;domain&gt;</span>');
        printRaw(`<span class="info">▸ Fetching CT logs...</span>`);
        try {
          const list = await Recon.subdomains(domain);
          printRaw(`<span class="ok">▸ ${list.length} subdomains found:</span>`);
          list.slice(0,40).forEach(s => printRaw(`  ${esc(s)}`));
        } catch(e) {
          printRaw(`<span class="err">❌ Lookup failed.</span>`);
        }
        return null;
      }
    },

    ip: {
      desc: 'Public IP + geolocation',
      run: async () => {
        printRaw(`<span class="info">▸ Looking up...</span>`);
        const j = await Recon.ipGeo();
        if (!j.success) return printRaw('<span class="err">Lookup failed.</span>');
        printRaw(`<span class="dim">IP:       </span><span class="hot">${esc(j.ip)}</span>`);
        printRaw(`<span class="dim">Country:  </span>${esc(j.country)} ${j.flag?.emoji||''}`);
        printRaw(`<span class="dim">Region:   </span>${esc(j.region||'—')}`);
        printRaw(`<span class="dim">City:     </span>${esc(j.city||'—')}`);
        printRaw(`<span class="dim">ISP:      </span>${esc(j.connection?.isp||'—')}`);
        printRaw(`<span class="dim">Timezone: </span>${esc(j.timezone?.id||'—')}`);
        return null;
      }
    },

    headers: {
      desc: 'Security headers of a URL',
      usage: 'headers <url>',
      run: async (args) => {
        const url = args[0];
        if (!url) return printRaw('<span class="err">Usage: headers &lt;url&gt;</span>');
        printRaw(`<span class="info">▸ Fetching headers...</span>`);
        try {
          const r = await Recon.headers(url);
          printRaw(`<span class="dim">Status:</span> ${r.status}`);
          printRaw('');
          printRaw(`<span class="ok">Security headers present:</span>`);
          r.present.length ? r.present.forEach(h => printRaw(`  ✓ ${h}`)) : printRaw('  (none)');
          printRaw('');
          printRaw(`<span class="err">Missing:</span>`);
          r.missing.length ? r.missing.forEach(h => printRaw(`  ✗ ${h}`)) : printRaw('  (none)');
        } catch(e) {
          printRaw(`<span class="err">❌ Could not fetch (CORS).</span>`);
        }
        return null;
      }
    },

    dnssec: {
      desc: 'Check DNSSEC validation',
      usage: 'dnssec <domain>',
      run: async (args) => {
        const domain = args[0];
        if (!domain) return printRaw('<span class="err">Usage: dnssec &lt;domain&gt;</span>');
        const r = await Recon.dnssec(domain);
        if (r.ad) printRaw(`<span class="ok">✓ DNSSEC validated.</span>`);
        else printRaw(`<span class="warn">⚠ Not DNSSEC-validated.</span>`);
        return null;
      }
    },

    breach: {
      desc: 'Check if password is in a breach',
      usage: 'breach <password>',
      run: async (args) => {
        const pw = args.join(' ');
        if (!pw) return printRaw('<span class="err">Usage: breach &lt;password&gt;</span>');
        printRaw(`<span class="info">▸ Querying Pwned Passwords...</span>`);
        try {
          const r = await Recon.breachCheck(pw);
          if (r.pwned) printRaw(`<span class="err">⚠ PWNED — found in ${r.count.toLocaleString()} breaches.</span>`);
          else printRaw(`<span class="ok">✓ Not found in known breaches.</span>`);
        } catch(e) {
          printRaw(`<span class="err">❌ Lookup failed.</span>`);
        }
        return null;
      }
    },

    // ---------- NET ----------
    ping: {
      desc: 'Measure round-trip time (real)',
      usage: 'ping [host]',
      run: async (args) => {
        const host = args[0] || '1.1.1.1';
        printRaw(`<span class="info">▸ Pinging ${esc(host)}...</span>`);
        const r = await Net.pingMultiple(host, 4);
        r.results.forEach((t,i) => printRaw(`  seq ${i+1}: ${t} ms`));
        printRaw('');
        printRaw(`<span class="dim">min/avg/max: ${r.min}/${r.avg}/${r.max} ms</span>`);
        return null;
      }
    },

    conn: {
      desc: 'Connection info',
      run: async () => {
        const c = Net.connectionInfo();
        printRaw(`<span class="dim">Protocol:  </span>${c.protocol}`);
        printRaw(`<span class="dim">Effective: </span>${c.effective}`);
        printRaw(`<span class="dim">Downlink:  </span>${c.downlink} Mbps`);
        printRaw(`<span class="dim">RTT:       </span>${c.rtt} ms`);
        printRaw(`<span class="dim">Save-data: </span>${c.saveData}`);
        printRaw(`<span class="dim">Online:    </span>${c.online}`);
        printRaw(`<span class="dim">Timezone:  </span>${c.timezone}`);
        return null;
      }
    },

    localip: {
      desc: 'Find your local IPs via WebRTC',
      run: async () => {
        printRaw(`<span class="info">▸ Scanning WebRTC...</span>`);
        const ips = await Net.localIPs();
        if (!ips.length) printRaw(`<span class="ok">✓ No local IP exposed (mDNS masking active).</span>`);
        else {
          printRaw(`<span class="warn">⚠ Local IPs exposed:</span>`);
          ips.forEach(ip => printRaw(`  ${esc(ip)}`));
        }
        return null;
      }
    },

    // ---------- VAULT ----------
    vault: {
      desc: 'Store a secret in the local vault',
      usage: 'vault <password> <name> <value>',
      run: async (args) => {
        if (args.length < 3) return printRaw('<span class="err">Usage: vault &lt;password&gt; &lt;name&gt; &lt;value&gt;</span>');
        const [pw, name, ...rest] = args;
        const value = rest.join(' ');
        try {
          await Vault.put(pw, name, value);
          printRaw(`<span class="ok">✓ Stored "${esc(name)}" in encrypted vault.</span>`);
        } catch(e) { printRaw(`<span class="err">❌ ${esc(e.message)}</span>`); }
        return null;
      }
    },

    'vault-list': {
      desc: 'List vault entries',
      run: async () => {
        const names = Vault.list();
        if (!names.length) return printRaw('<span class="dim">(vault empty)</span>');
        printRaw(`<span class="info">🔒 Vault entries:</span>`);
        names.forEach(n => printRaw(`  • ${esc(n)}`));
        return null;
      }
    },

    'vault-get': {
      desc: 'Retrieve a vault entry',
      usage: 'vault-get <password> <name>',
      run: async (args) => {
        if (args.length < 2) return printRaw('<span class="err">Usage: vault-get &lt;password&gt; &lt;name&gt;</span>');
        try {
          const out = await Vault.get(args[0], args[1]);
          printRaw(`<span class="ok">🔓 ${esc(args[1])}:</span>`);
          printRaw(esc(out));
        } catch(e) {
          printRaw(`<span class="err">❌ Wrong password or not found.</span>`);
        }
        return null;
      }
    },

    'vault-del': {
      desc: 'Delete a vault entry',
      usage: 'vault-del <name>',
      run: async (args) => {
        if (!args[0]) return printRaw('<span class="err">Usage: vault-del &lt;name&gt;</span>');
        printRaw(Vault.del(args[0]) ? `<span class="ok">✓ Deleted "${esc(args[0])}".</span>` : `<span class="err">Not found.</span>`);
        return null;
      }
    },

    // ---------- THEME ----------
    theme: {
      desc: 'Change terminal theme',
      usage: 'theme [tokyo|nord|matrix|amber|ice|pink]',
      run: async (args) => {
        const themes = {
          tokyo:  { fg:'#00ffaa', bg:'#0a0c10', accent:'#00ffaa' },
          nord:   { fg:'#88c0d0', bg:'#2e3440', accent:'#a3be8c' },
          matrix: { fg:'#00ff41', bg:'#000000', accent:'#00ff41' },
          amber:  { fg:'#ffb000', bg:'#1a0f00', accent:'#ffd066' },
          ice:    { fg:'#66ddff', bg:'#0a1020', accent:'#aaccff' },
          pink:   { fg:'#ff66cc', bg:'#1a0a14', accent:'#ff99dd' }
        };
        const t = args[0];
        if (!t) {
          printRaw(`<span class="info">Available themes:</span>`);
          Object.keys(themes).forEach(n => printRaw(`  • ${n}`));
          return null;
        }
        if (!themes[t]) return printRaw('<span class="err">Unknown theme</span>');
        document.documentElement.style.setProperty('--accent', themes[t].accent);
        document.documentElement.style.setProperty('--bg', themes[t].bg);
        document.body.style.background = themes[t].bg;
        printRaw(`<span class="ok">✓ Theme set to ${t}</span>`);
        return null;
      }
    },

    matrix: {
      desc: 'Matrix rain for 5 seconds',
      run: async () => {
        const chars = 'アウエオカキクケコ0123456789ABCDEF';
        const cols = Math.floor(screen.clientWidth / 12);
        const start = Date.now();
        const iv = setInterval(() => {
          if (Date.now() - start > 5000) { clearInterval(iv); printRaw('<span class="ok">⛧ Wake up, Butter...</span>'); return; }
          let line = '';
          for (let i=0;i<cols;i++) {
            line += Math.random() > 0.7 ? chars[Math.floor(Math.random()*chars.length)] : ' ';
          }
          printRaw(`<span class="accent" style="opacity:.8">${line}</span>`);
        }, 60);
        return null;
      }
    }
  };

  // ---------- ALIASES ----------
  const aliases = {
    'ls': 'help', '?': 'help', 'cls': 'clear', 'h': 'help',
    'enc': 'encrypt', 'dec': 'decrypt', 'pw': 'password'
  };

  // ---------- DISPATCH ----------
  async function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    echoPrompt(cmd);
    history.push(cmd);
    histIdx = history.length;

    const parts = cmd.split(/\s+/);
    let name = parts[0].toLowerCase();
    name = aliases[name] || name;
    const args = parts.slice(1);

    const command = commands[name];
    if (!command) {
      printRaw(`<span class="err">⛧ Unknown command: ${esc(name)}</span>`);
      printRaw(`<span class="dim">Type "help" for the list.</span>`);
      return;
    }

    try {
      await command.run(args);
    } catch(e) {
      printRaw(`<span class="err">⛧ Error: ${esc(e.message)}</span>`);
    }
  }

  // ---------- INPUT ----------
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = input.value;
      input.value = '';
      run(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) {
        if (histIdx === history.length) histStash = input.value;
        histIdx--;
        input.value = history[histIdx] || '';
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx] || ''; }
      else { histIdx = history.length; input.value = histStash; }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const cur = input.value.trim();
      if (!cur) return;
      const matches = Object.keys(commands).filter(n => n.startsWith(cur));
      if (matches.length === 1) input.value = matches[0] + ' ';
      else if (matches.length > 1) {
        echoPrompt(cur);
        printRaw(matches.map(m => `<span class="ok">${m}</span>`).join('  '));
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clear();
    }
  });

  document.addEventListener('click', () => input.focus());
  input.focus();

  return { run, print, printRaw, clear, commands };
})();

// ============================================================
// PANEL — sidebar, tabs, browser list, uptime, modules
// ============================================================

const COMMAND_MODULES = [
  { id:'fingerprint', name:'🔍 Fingerprint', desc:'OS, plugins, screen' },
  { id:'screenshot',  name:'📸 Screenshot',   desc:'Capture the page (real API)' },
  { id:'clipboard',   name:'📋 Clipboard',    desc:'Read clipboard (asks perm)' },
  { id:'cookies',     name:'🍪 Cookies',      desc:'Count visible cookies' },
  { id:'localstorage',name:'💾 LocalStorage', desc:'Dump browser storage' },
  { id:'geolocation', name:'📍 Geolocation',  desc:'Request location (asks perm)' },
  { id:'network',     name:'🌐 Network Info', desc:'Connection details' },
  { id:'alerts',      name:'💬 Alert Spam',   desc:'Demo alert flood' },
];

const state = { currentIP: '192.168.1.101', hooked: 2, startTime: Date.now() };

function renderCommands() {
  document.getElementById('commandGrid').innerHTML = COMMAND_MODULES.map(c => `
    <div class="command-item">
      <div class="info">
        <div class="name">${c.name}</div>
        <div class="desc">${c.desc}</div>
      </div>
      <button onclick="runModule('${c.id}')">▶ Run</button>
    </div>
  `).join('');
}

function runModule(id) {
  log(`▶ Module: ${id} → ${state.currentIP}`, 'exploit');
  setTimeout(() => {
    switch(id) {
      case 'fingerprint':
        log(`OS: ${navigator.platform} · Screen: ${screen.width}x${screen.height} · UA: ${navigator.userAgent.slice(0,40)}...`, 'success');
        break;
      case 'screenshot':
        log(`[!] Screenshot simulation — no image captured.`, 'warn');
        break;
      case 'clipboard':
        navigator.clipboard?.readText()
          .then(t => log(`[+] Clipboard: ${t.slice(0,80) || '(empty)'}`, 'success'))
          .catch(() => log(`[!] Clipboard permission denied`, 'warn'));
        break;
      case 'cookies':
        const c = document.cookie.split(';').filter(x=>x.trim()).length;
        log(`[+] Visible cookies: ${c}`, 'success');
        break;
      case 'localstorage':
        log(`[+] LocalStorage items: ${localStorage.length}`, 'success');
        break;
      case 'geolocation':
        navigator.geolocation?.getCurrentPosition(
          p => log(`[+] Location: ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`, 'success'),
          () => log(`[!] Location denied`, 'warn')
        );
        break;
      case 'network':
        const n = navigator.connection || {};
        log(`[+] Effective: ${n.effectiveType||'?'} · Downlink: ${n.downlink||'?'} Mbps`, 'success');
        break;
      case 'alerts':
        for (let i=1;i<=3;i++) setTimeout(() => alert(`ONYXVIRUS demo alert ${i}/3`), i*300);
        log(`[+] Firing 3 demo alerts`, 'success');
        break;
    }
  }, 600);
}

function setupBrowserClicks() {
  document.querySelectorAll('.browser-item').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.browser-item').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      state.currentIP = el.dataset.ip;
      document.getElementById('selectedBrowser').textContent = state.currentIP;
      log(`Selected browser: ${state.currentIP}`, 'info');
    });
  });
}

function addDemoBrowser() {
  const ips = ['192.168.1.103','192.168.1.104','10.0.0.51','172.16.0.26'];
  const oss = ['Chrome 121 · Windows 11','Firefox 120 · macOS 15','Edge 120 · Windows 10','Safari 18 · macOS 14'];
  const idx = Math.floor(Math.random()*ips.length);
  const ip = ips[idx];
  const os = oss[idx];
  const div = document.createElement('div');
  div.className = 'browser-item';
  div.dataset.ip = ip;
  div.dataset.os = os;
  div.innerHTML = `
    <div class="ip">${ip}</div>
    <div class="os">${os}</div>
    <span class="status">ONLINE</span>
  `;
  document.getElementById('browserList').appendChild(div);
  setupBrowserClicks();
  state.hooked++;
  document.getElementById('hookCount').textContent = state.hooked;
  log(`[+] New browser hooked: ${ip} (${os})`, 'success');
}

function refreshBrowsers() {
  log(`🔄 Refreshed — ${state.hooked} active hooks`, 'info');
}

function clearLogs() {
  document.getElementById('logBox').innerHTML = '<div class="info">[system] Logs cleared.</div>';
}

function exportLog() {
  const text = document.getElementById('logBox').innerText;
  const blob = new Blob([text], { type:'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `onyxvirus-log-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  log(`[+] Log exported.`, 'success');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('tab-' + tab);
  if (target) target.classList.add('active');
  document.querySelector(`.tabs button[data-tab="${tab}"]`)?.classList.add('active');
}

function log(msg, type='info') {
  const ts = new Date().toLocaleTimeString();
  const el = document.createElement('div');
  el.className = type;
  el.textContent = `[${ts}] ${msg}`;
  const box = document.getElementById('logBox');
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

setInterval(() => {
  const s = Math.floor((Date.now() - state.startTime) / 1000);
  const m = String(Math.floor(s/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  document.getElementById('uptime').textContent = `${m}:${sec}`;
}, 1000);

renderCommands();
setupBrowserClicks();
log('[+] ONYXVIRUS v2.0 initialized.', 'success');
log('[+] Terminal ready — type "help" to begin.', 'info');
