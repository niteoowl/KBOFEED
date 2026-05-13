/**
 * 8자리 62진수 ShortID 생성 유틸리티
 * Base-62: 0-9, a-z, A-Z  →  62^8 ≈ 218조 개의 고유 ID 생성 가능
 */

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateShortId(length = 8): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => BASE62_CHARS[b % 62])
    .join('');
}

/** ShortID 유효성 검사: 정확히 8자리 base-62 문자열 */
export function isValidShortId(id: string): boolean {
  return /^[0-9a-zA-Z]{8}$/.test(id);
}
