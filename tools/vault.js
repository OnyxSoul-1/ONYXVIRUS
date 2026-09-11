// ============================================================
// ONYXVIRUS — Local Encrypted Vault
// AES-GCM encrypted key/value store in localStorage.
// ============================================================

const Vault = (() => {
  const KEY = 'onyxvirus_vault_v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch(e) { return {}; }
  }

  function save(vault) {
    localStorage.setItem(KEY, JSON.stringify(vault));
  }

  async function put(password, name, value) {
    const vault = load();
    vault[name] = await Crypto.encrypt(value, password);
    save(vault);
    return true;
  }

  async function get(password, name) {
    const vault = load();
    if (!vault[name]) throw new Error('Not found');
    return await Crypto.decrypt(vault[name], password);
  }

  function list() {
    return Object.keys(load());
  }

  function del(name) {
    const vault = load();
    if (!vault[name]) return false;
    delete vault[name];
    save(vault);
    return true;
  }

  return { put, get, list, del };
})();
