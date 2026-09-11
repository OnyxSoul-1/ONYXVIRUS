// ============================================================
// ONYXVIRUS — Recon Tools
// DNS, subdomains, IP geolocation, breach check, DNSSEC, certs.
// ============================================================

const Recon = (() => {

  async function dns(domain) {
    const types = ['A','AAAA','MX','TXT','NS'];
    const out = {};
    for (const t of types) {
      try {
        const r = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${t}`,
          { headers: { 'Accept': 'application/dns-json' } }
        );
        const j = await r.json();
        out[t] = (j.Answer || []).map(a => a.data);
      } catch(e) { out[t] = []; }
    }
    return out;
  }

  async function subdomains(domain) {
    const r = await fetch(
      `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`
    );
    const j = await r.json();
    const set = new Set();
    j.forEach(e => e.name_value.split('\n').forEach(n => {
      if (n.includes(domain)) set.add(n.trim());
    }));
    return Array.from(set).sort();
  }

  async function ipGeo(ip) {
    const url = ip ? `https://ipwho.is/${ip}` : 'https://ipwho.is/';
    const r = await fetch(url);
    return await r.json();
  }

  async function headers(url) {
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const r = await fetch(url, { method:'HEAD', mode:'cors' });
    const headers = {};
    r.headers.forEach((v,k) => headers[k] = v);
    const security = ['content-security-policy','x-frame-options','strict-transport-security','x-content-type-options','referrer-policy','permissions-policy'];
    const present = security.filter(h => r.headers.has(h));
    const missing = security.filter(h => !r.headers.has(h));
    return { status: r.status, headers, present, missing };
  }

  async function dnssec(domain) {
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A&do=1`,
      { headers: { 'Accept': 'application/dns-json' } }
    );
    const j = await r.json();
    return { ad: j.AD === true, status: j.Status };
  }

  async function breachCheck(password) {
    const hash = (await Crypto.sha('SHA-1', password)).toUpperCase();
    const prefix = hash.slice(0,5);
    const suffix = hash.slice(5);
    const r = await fetch('https://api.pwnedpasswords.com/range/' + prefix);
    const text = await r.text();
    for (const line of text.split('\n')) {
      const [s,c] = line.split(':');
      if (s.trim() === suffix) return { pwned:true, count:parseInt(c,10)||0 };
    }
    return { pwned:false, count:0 };
  }

  return { dns, subdomains, ipGeo, headers, dnssec, breachCheck };
})();
