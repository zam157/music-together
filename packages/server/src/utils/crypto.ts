import crypto from 'node:crypto'

/**
 * 网易云音乐 weapi 加密解密模块
 * 支持 AES-128-CBC 加密和 RSA 加密
 */

// 网易云音乐 API 常量
const NETEASE_CONSTANTS = {
  // AES 加密密钥
  aesKey: '0CoJUm6Qyw8W8jud',
  // AES 初始化向量
  aesIv: '0102030405060708',
  // RSA 公钥模数 (十六进制)
  rsaN: '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7',
  // RSA 指数
  rsaE: '010001',
} as const

/**
 * 生成随机密钥
 * @param length 密钥长度
 * @returns 随机字符串
 */
export function generateRandomKey(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// function s(t, n) {
//   var e = i.default.enc.Utf8.parse(n)
//     , r = i.default.enc.Utf8.parse("0102030405060708")
//     , o = i.default.enc.Utf8.parse(t);
//   return i.default.AES.encrypt(o, e, {
//     iv: r,
//     mode: i.default.mode.CBC
//   }).toString()
// }

export function aesEncrypt(data: string, key: string) {
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'binary'), Buffer.from(NETEASE_CONSTANTS.aesIv, 'binary'))
  let encrypted = cipher.update(data, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return encrypted
}

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n
  base = base % modulus
  while (exponent > 0) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus
    }
    exponent = exponent >> 1n
    base = (base * base) % modulus
  }
  return result
}

// function u(t, n, e) {
//   var r;
//   return o.default.setMaxDigits(131),
//   r = new o.default.RSAKeyPair(n,"",e),
//   o.default.encryptedString(r, t)
// }
export function rsaEncrypt(data: string, pubKey: string, modulus: string) {
  const reversedData = data.split('').reverse().join('')
  const dataHex = Buffer.from(reversedData).toString('hex')
  const dataBigInt = BigInt(`0x${dataHex}`)
  const pubKeyBigInt = BigInt(`0x${pubKey}`)
  const modulusBigInt = BigInt(`0x${modulus}`)
  const encryptedBigInt = modPow(dataBigInt, pubKeyBigInt, modulusBigInt)
  return encryptedBigInt.toString(16).padStart(256, '0')
}

export function createWeapiEncryptedPayload(data: Record<string, any>) {
  const jsonData = JSON.stringify(data)
  const secretKey = generateRandomKey(16)
  const encryptedData = aesEncrypt(aesEncrypt(jsonData, NETEASE_CONSTANTS.aesKey), secretKey)
  const encryptedKey = rsaEncrypt(secretKey, NETEASE_CONSTANTS.rsaE, NETEASE_CONSTANTS.rsaN)
  return {
    params: encryptedData,
    encSecKey: encryptedKey,
  }
}