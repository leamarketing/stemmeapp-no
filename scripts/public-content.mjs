/** Feed values must never become paths outside the generated case directory. */
export function assertCaseSlug(value) {
  if (typeof value !== 'string' || value.length > 180 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error('Ugyldig saksadresse; ingen filer er endret.');
  }
  return value;
}

export function safePublicUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}
