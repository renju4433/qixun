const K = '_t_cfg';

function read(): string | null {
  // localStorage > sessionStorage > cookie
  try { const v = localStorage.getItem(K); if (v) return v; } catch { }
  try { const v = sessionStorage.getItem(K); if (v) return v; } catch { }
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${K}=([^;]+)`));
    if (m) return m[1];
  } catch { }
  return null;
}

function write(id: string) {
  try { localStorage.setItem(K, id); } catch { }
  try { sessionStorage.setItem(K, id); } catch { }
  try { document.cookie = `${K}=${id};path=/;max-age=31536000;SameSite=Lax`; } catch { }
}

export function getClientTrace(): string {
  try {
    let id = read();
    if (!id || id.length < 30) {
      id = crypto.randomUUID();
      write(id);
    }
    return id;
  } catch {
    return '';
  }
}
