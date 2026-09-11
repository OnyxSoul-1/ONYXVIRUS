// ============================================================
// ONYXVIRUS — Net Tools
// Real connection info, simulated ping with real RTT measurement.
// ============================================================

const Net = (() => {

  function connectionInfo() {
    const c = navigator.connection || {};
    return {
      protocol: location.protocol.replace(':','').toUpperCase(),
      effective: c.effectiveType || '?',
      downlink: c.downlink || '?',
      rtt: c.rtt || '?',
      saveData: c.saveData ? 'yes' : 'no',
      online: navigator.onLine,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  async function ping(host = '1.1.1.1') {
    const start = performance.now();
    try {
      await fetch('https://' + host, { method:'HEAD', mode:'no-cors', cache:'no-store' });
    } catch(e) { /* ignore — no-cors failure is still a round-trip */ }
    const rtt = performance.now() - start;
    return Math.round(rtt);
  }

  async function pingMultiple(host, count=4) {
    const results = [];
    for (let i=0; i<count; i++) {
      const rtt = await ping(host);
      results.push(rtt);
      await new Promise(r => setTimeout(r, 500));
    }
    const min = Math.min(...results);
    const max = Math.max(...results);
    const avg = results.reduce((a,b)=>a+b,0)/results.length;
    return { results, min, max, avg: Math.round(avg) };
  }

  function localIPs() {
    return new Promise((resolve) => {
      const ips = new Set();
      let pc;
      try {
        pc = new RTCPeerConnection({
          iceServers: [{ urls:'stun:stun.l.google.com:19302' }]
        });
      } catch(e) { resolve([]); return; }
      try { pc.createDataChannel(''); } catch(e) {}
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const parts = e.candidate.candidate.split(' ');
        const addr = parts[4];
        if (addr && !addr.endsWith('.local')) ips.add(addr);
      };
      pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => {});
      setTimeout(() => {
        try { pc.close(); } catch(e) {}
        resolve(Array.from(ips));
      }, 3000);
    });
  }

  return { connectionInfo, ping, pingMultiple, localIPs };
})();
