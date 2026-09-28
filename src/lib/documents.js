import { API_BASE_URL } from './api';

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchBlob(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    let message = 'Request failed.';
    try {
      const body = await res.json();
      if (body && body.error && body.error.message) message = body.error.message;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  return res.blob();
}

/**
 * Open a PDF endpoint (e.g. /documents/sale-invoice/:id) in a new browser tab.
 * Falls back to a file download if a popup blocker intervenes.
 */
export async function openPdf(path) {
  const blob = await fetchBlob(path);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Download a CSV endpoint (e.g. /exports/products) as a file. */
export async function downloadFile(path, filename) {
  const blob = await fetchBlob(path);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}