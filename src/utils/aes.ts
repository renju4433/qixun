import * as aesjs from 'aes-js';
import SparkMD5 from 'spark-md5';

function base64UrlToBytes(input: string): Uint8Array {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad === 2) b64 += '==';
  else if (pad === 3) b64 += '=';
  else if (pad !== 0) b64 += '===';
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : '0' + hex;
  const len = clean.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

function stripPkcs7Padding(bytes: Uint8Array): Uint8Array {
  if (!bytes || bytes.length === 0) return bytes;
  const pad = bytes[bytes.length - 1];
  if (pad < 1 || pad > 16 || pad > bytes.length) return bytes;
  return bytes.slice(0, bytes.length - pad);
}

/**
 * 使用 MD5(key) 作为 AES-ECB 密钥，解密后端 Base64URL 编码的密文
 */
export function decryptAesEcbBase64Url(
  ciphertextBase64Url: string,
  key: string,
): string {
  const cipherBytes = base64UrlToBytes(ciphertextBase64Url);
  const md5Hex = SparkMD5.hash(key);
  const keyBytes = hexToBytes(md5Hex); // 16 字节
  const aesEcb = new aesjs.ModeOfOperation.ecb(keyBytes);
  const decrypted = aesEcb.decrypt(cipherBytes);
  const unpadded = stripPkcs7Padding(decrypted);
  return aesjs.utils.utf8.fromBytes(unpadded);
}
