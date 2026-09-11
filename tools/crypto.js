// ============================================================
// ONYXVIRUS — Crypto Tools
// Real AES-GCM, hashing, encoders, steganography.
// ============================================================

const Crypto = (() => {

  // ---------- Random ----------
  function randomBytes(n) {
    const b = new Uint8Array(n);
    crypto.getRandomValues(b);
    return b;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function hexToBytes(hex) {
    const clean = hex.replace(/\s+/g,'');
    const out = new Uint8Array(clean.length/2);
    for (let i=0; i<clean.length; i+=2) {
      out[i/2] = parseInt(clean.substr(i,2), 16);
    }
    return out;
  }

  function b64url(bytes) {
    let s = '';
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }

  function b64urlDecode(str) {
    str = str.replace(/-/g,'+').replace(/_/g,'/');
    while (str.length % 4) str += '=';
    const s = atob(str);
    const out = new Uint8Array(s.length);
    for (let i=0; i<s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  // ---------- AES-GCM ----------
  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name:'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name:'PBKDF2', salt, iterations:200000, hash:'SHA-256' },
      keyMaterial,
      { name:'AES-GCM', length:256 },
      false,
      ['encrypt','decrypt']
    );
  }

  async function encrypt(plaintext, password) {
    const enc = new TextEncoder();
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveKey(password, salt);
    const ciphertext = await crypto.subtle.encrypt(
      { name:'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );
    const combined = new Uint8Array(16 + 12 + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, 16);
    combined.set(new Uint8Array(ciphertext), 28);
    return b64url(combined);
  }

  async function decrypt(b64, password) {
    const combined = b64urlDecode(b64);
    const salt = combined.slice(0,16);
    const iv = combined.slice(16,28);
    const ciphertext = combined.slice(28);
    const key = await deriveKey(password, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name:'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  }

  // ---------- Hashes ----------
  async function sha(algo, text) {
    const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
    return bytesToHex(new Uint8Array(buf));
  }

  function md5(str) {
    function L(k,d){return(k<<d)|(k>>>(32-d))}
    function u(G,F,aa,Z,k,H,I){G=G+(((F&aa)|(~F&Z))+k+I);return L(G,H)+F}
    function f(G,F,aa,Z,k,H,I){G=G+(((F&Z)|(aa&~Z))+k+I);return L(G,H)+F}
    function D(G,F,aa,Z,k,H,I){G=G+((F^aa^Z)+k+I);return L(G,H)+F}
    function t(G,F,aa,Z,k,H,I){G=G+((aa^(F|~Z))+k+I);return L(G,H)+F}
    function e(G){
      const F=G.length, x=F+8, k=(x-(x%64))/64, I=(k+1)*16;
      const aa=Array(I-1).fill(0);
      let d=0, H=0;
      while(H<F){const Z=(H-(H%4))/4; d=(H%4)*8; aa[Z]=aa[Z]|(G.charCodeAt(H)<<d); H++;}
      const Z=(H-(H%4))/4; d=(H%4)*8;
      aa[Z]=aa[Z]|(0x80<<d);
      aa[I-2]=F<<3;
      aa[I-1]=F>>>29;
      return aa;
    }
    function B(x){let k='',F='';for(let d=0;d<=3;d++){const G=(x>>>(d*8))&255;F='0'+G.toString(16);k=k+F.substr(F.length-2,2);}return k;}
    function J(k){
      k=k.replace(/\r\n/g,'\n');
      let d='';
      for(let F=0;F<k.length;F++){
        const x=k.charCodeAt(F);
        if(x<128)d+=String.fromCharCode(x);
        else if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128);}
        else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128);}
      }
      return d;
    }
    str=J(str);
    const x=e(str);
    let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for(let i=0;i<x.length;i+=16){
      const oa=a,ob=b,oc=c,od=d;
      a=u(a,b,c,d,x[i+0],7,-680876936); d=u(d,a,b,c,x[i+1],12,-389564586);
      c=u(c,d,a,b,x[i+2],17,606105819); b=u(b,c,d,a,x[i+3],22,-1044525330);
      a=u(a,b,c,d,x[i+4],7,-176418897); d=u(d,a,b,c,x[i+5],12,1200080426);
      c=u(c,d,a,b,x[i+6],17,-1473231341); b=u(b,c,d,a,x[i+7],22,-45705983);
      a=u(a,b,c,d,x[i+8],7,1770035416); d=u(d,a,b,c,x[i+9],12,-1958414417);
      c=u(c,d,a,b,x[i+10],17,-42063); b=u(b,c,d,a,x[i+11],22,-1990404162);
      a=u(a,b,c,d,x[i+12],7,1804603682); d=u(d,a,b,c,x[i+13],12,-40341101);
      c=u(c,d,a,b,x[i+14],17,-1502002290); b=u(b,c,d,a,x[i+15],22,1236535329);
      a=f(a,b,c,d,x[i+1],5,-165796510); d=f(d,a,b,c,x[i+6],9,-1069501632);
      c=f(c,d,a,b,x[i+11],14,643717713); b=f(b,c,d,a,x[i+0],20,-373897302);
      a=f(a,b,c,d,x[i+5],5,-701558691); d=f(d,a,b,c,x[i+10],9,38016083);
      c=f(c,d,a,b,x[i+15],14,-660478335); b=f(b,c,d,a,x[i+4],20,-405537848);
      a=f(a,b,c,d,x[i+9],5,568446438); d=f(d,a,b,c,x[i+14],9,-1019803690);
      c=f(c,d,a,b,x[i+3],14,-187363961); b=f(b,c,d,a,x[i+8],20,1163531501);
      a=f(a,b,c,d,x[i+13],5,-1444681467); d=f(d,a,b,c,x[i+2],9,-51403784);
      c=f(c,d,a,b,x[i+7],14,1735328473); b=f(b,c,d,a,x[i+12],20,-1926607734);
      a=D(a,b,c,d,x[i+5],4,-378558); d=D(d,a,b,c,x[i+8],11,-2022574463);
      c=D(c,d,a,b,x[i+11],16,1839030562); b=D(b,c,d,a,x[i+14],23,-35309556);
      a=D(a,b,c,d,x[i+1],4,-1530992060); d=D(d,a,b,c,x[i+4],11,1272893353);
      c=D(c,d,a,b,x[i+7],16,-155497632); b=D(b,c,d,a,x[i+10],23,-1094730640);
      a=D(a,b,c,d,x[i+13],4,681279174); d=D(d,a,b,c,x[i+0],11,-358537222);
      c=D(c,d,a,b,x[i+3],16,-722521979); b=D(b,c,d,a,x[i+6],23,76029189);
      a=D(a,b,c,d,x[i+9],4,-640364487); d=D(d,a,b,c,x[i+12],11,-421815835);
      c=D(c,d,a,b,x[i+15],16,530742520); b=D(b,c,d,a,x[i+2],23,-995338651);
      a=t(a,b,c,d,x[i+0],6,-198630844); d=t(d,a,b,c,x[i+7],10,1126891415);
      c=t(c,d,a,b,x[i+14],15,-1416354905); b=t(b,c,d,a,x[i+5],21,-57434055);
      a=t(a,b,c,d,x[i+12],6,1700485571); d=t(d,a,b,c,x[i+3],10,-1894986606);
      c=t(c,d,a,b,x[i+10],15,-1051523); b=t(b,c,d,a,x[i+1],21,-2054922799);
      a=t(a,b,c,d,x[i+8],6,1873313359); d=t(d,a,b,c,x[i+15],10,-30611744);
      c=t(c,d,a,b,x[i+6],15,-1560198380); b=t(b,c,d,a,x[i+13],21,1309151649);
      a=t(a,b,c,d,x[i+4],6,-145523070); d=t(d,a,b,c,x[i+11],10,-1120210379);
      c=t(c,d,a,b,x[i+2],15,718787259); b=t(b,c,d,a,x[i+9],21,-343485551);
      a=(a+oa)|0; b=(b+ob)|0; c=(c+oc)|0; d=(d+od)|0;
    }
    return B(a)+B(b)+B(c)+B(d);
  }

  // ---------- Encoders ----------
  const MORSE = {
    A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',
    I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',
    Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',
    Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--',
    '4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
    '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--','/':'-..-.',
    '@':'.--.-.',' ':'/'
  };
  const MORSE_REV = Object.fromEntries(
    Object.entries(MORSE).map(([k,v])=>[v,k])
  );

  function morseEncode(s) {
    return s.toUpperCase().split('').map(c=>MORSE[c]||'').filter(Boolean).join(' ');
  }
  function morseDecode(s) {
    return s.trim().split(/\s+/).map(m=>MORSE_REV[m]||'').join('');
  }
  function rot13(s) {
    return s.replace(/[a-z]/gi,c=>{
      const base=c===c.toUpperCase()?65:97;
      return String.fromCharCode(((c.charCodeAt(0)-base+13)%26)+base);
    });
  }

  // ---------- Password ----------
  function generatePassword(len=20, opts={}) {
    const lower='abcdefghijklmnopqrstuvwxyz';
    const upper='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits='0123456789';
    const symbols='!@#$%^&*()-_=+[]{};:,.<>?';
    let pool = lower+upper+digits+(opts.symbols!==false?symbols:'');
    if (opts.readable) pool = pool.replace(/[Il1O0o]/g,'');
    const arr = randomBytes(len);
    let out='';
    for (let i=0;i<len;i++) out += pool[arr[i]%pool.length];
    return out;
  }

  function passwordStrength(pw) {
    let score=0;
    if (pw.length>=8) score++;
    if (pw.length>=12) score++;
    if (pw.length>=16) score++;
    if (/[a-z]/.test(pw)&&/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return Math.min(5,score);
  }

  // ---------- Steganography ----------
  async function hideInImage(imageFile, message) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img,0,0);
        const idata = ctx.getImageData(0,0,c.width,c.height);
        const data = idata.data;
        const msgBytes = new TextEncoder().encode(message);
        const bits=[];
        for (let i=31;i>=0;i--) bits.push((msgBytes.length>>i)&1);
        for (const byte of msgBytes) {
          for (let i=7;i>=0;i--) bits.push((byte>>i)&1);
        }
        if (bits.length > data.length) {
          reject(new Error('Message too long for this image'));
          return;
        }
        for (let i=0;i<bits.length;i++) data[i]=(data[i]&0xFE)|bits[i];
        ctx.putImageData(idata,0,0);
        c.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  // ---------- QR (via public API — safe, read-only) ----------
  async function qrURL(text, size=220) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=' +
           size + 'x' + size + '&data=' + encodeURIComponent(text);
  }

  return {
    randomBytes, bytesToHex, hexToBytes, b64url, b64urlDecode,
    encrypt, decrypt,
    sha, md5,
    morseEncode, morseDecode, rot13, MORSE,
    generatePassword, passwordStrength,
    hideInImage, qrURL
  };
})();
