export const MAX_IMAGE_DATA_LENGTH = 2800000;
export const MAX_IMAGE_URL_LENGTH = 8192;

export function validEmbeddedImage(value) {
  return typeof value === 'string' && value.length <= MAX_IMAGE_DATA_LENGTH &&
    /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value);
}

/** Keep remote sources verbatim, including signed queries. Never accept active schemes. */
export function validImageUrl(value) {
  if (typeof value !== 'string' || !value || value.length > MAX_IMAGE_URL_LENGTH ||
      !/^https?:\/\/[^/?#]+(?:[/?#]|$)/i.test(value) || /[\s\u0000-\u001f\u007f-\u009f\\"'<>]/u.test(value)) return false;
  try {
    const url = new URL(value);
    const authority = value.replace(/^https?:\/\//i, '').split(/[/?#]/, 1)[0];
    return ['https:', 'http:'].includes(url.protocol) && !!url.hostname && !authority.includes('@') && !url.username && !url.password;
  } catch { return false; }
}

export function normalizeImageUrl(value) {
  const url = typeof value === 'string' ? value.trim() : '';
  if (!validImageUrl(url)) throw Error('请输入有效的 HTTP(S) 图片链接，建议使用 HTTPS；不支持带账号密码的链接。');
  return url;
}

export function validImage(value) {
  return validEmbeddedImage(value) || validImageUrl(value);
}
