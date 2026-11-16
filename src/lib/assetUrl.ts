export function resolveAssetUrl(url: string): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (normalizedBase !== '/' && url.startsWith(normalizedBase)) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${normalizedBase}${url.slice(1)}`;
  }
  return `${normalizedBase}${url}`;
}
