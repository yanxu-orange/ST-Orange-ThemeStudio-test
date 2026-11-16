import { portableScheme } from '../portable-scheme.mjs';
export async function expectPortableExport(config) {
  globalThis.fetch = async () => ({ ok: true, blob: async () => null });
  globalThis.FileReader = class {
    readAsDataURL() { this.result = 'data:image/png;base64,AAAA'; this.onload(); }
  };
  return portableScheme(config);
}
