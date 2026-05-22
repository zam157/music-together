import crypto from 'crypto'
import type { ApiConfig, RequestHeaders, FormattedTrack } from './base.js'
import BaseProvider from './base.js'

/**
 * 酷狗音乐平台提供者
 */
export default class KugouProvider extends BaseProvider {
  protected name = 'kugou'
  protected meting: any

  constructor(meting: any) {
    super(meting)
    this.meting = meting
  }

  /**
   * 获取酷狗音乐的请求头配置
   * @returns {RequestHeaders} 请求头对象
   */
  getHeaders(): RequestHeaders {
    return {
      'User-Agent': 'IPhone-8990-searchSong',
      'UNI-UserAgent': 'iOS11.4-Phone8990-1009-0-WiFi',
    }
  }

  /**
   * 搜索歌曲
   * @param {string} keyword 搜索关键词
   * @param {Record<string, unknown>} option 搜索选项
   * @returns {ApiConfig} API 配置对象
   */
  search(keyword: string, option: Record<string, unknown> = {}): ApiConfig {
    return {
      method: 'GET',
      url: 'http://mobilecdn.kugou.com/api/v3/search/song',
      body: {
        api_ver: 1,
        area_code: 1,
        correct: 1,
        pagesize: option.limit || 30,
        plat: 2,
        tag: 1,
        sver: 5,
        showtype: 10,
        page: option.page || 1,
        keyword: keyword,
        version: 8990,
      },
      format: 'data.info',
    }
  }

  /**
   * 获取歌曲详情
   * @param {string} id 歌曲ID
   * @returns {ApiConfig} API 配置对象
   */
  song(id: string): ApiConfig {
    return {
      method: 'POST',
      url: 'http://m.kugou.com/app/i/getSongInfo.php',
      body: {
        cmd: 'playInfo',
        hash: id,
        from: 'mkugou',
      },
      format: '',
    }
  }

  /**
   * 获取专辑信息
   * @param {string} id 专辑ID
   * @returns {ApiConfig} API 配置对象
   */
  album(id: string): ApiConfig {
    return {
      method: 'GET',
      url: 'http://mobilecdn.kugou.com/api/v3/album/song',
      body: {
        albumid: id,
        area_code: 1,
        plat: 2,
        page: 1,
        pagesize: -1,
        version: 8990,
      },
      format: 'data.info',
    }
  }

  /**
   * 获取艺术家作品
   * @param {string} id 艺术家ID
   * @param {number} limit 限制数量
   * @returns {ApiConfig} API 配置对象
   */
  artist(id: string, limit: number = 50): ApiConfig {
    return {
      method: 'GET',
      url: 'http://mobilecdn.kugou.com/api/v3/singer/song',
      body: {
        singerid: id,
        area_code: 1,
        page: 1,
        plat: 0,
        pagesize: limit,
        version: 8990,
      },
      format: 'data.info',
    }
  }

  /**
   * 获取播放列表
   * @param {string} id 播放列表ID
   * @returns {ApiConfig} API 配置对象
   */
  playlist(id: string): ApiConfig {
    return {
      method: 'GET',
      url: 'http://mobilecdn.kugou.com/api/v3/special/song',
      body: {
        specialid: id,
        area_code: 1,
        page: 1,
        plat: 2,
        pagesize: -1,
        version: 8990,
      },
      format: 'data.info',
    }
  }

  /**
   * 获取音频播放链接
   * 有 cookie 时走新接口（songinfo + 签名），无 cookie 走老接口
   * @param {string} id 歌曲ID
   * @param {number} br 比特率
   * @returns {ApiConfig} API 配置对象
   */
  url(id: string, br: number = 320): ApiConfig {
    const cookie = this.parseCookie(this.meting.header['Cookie'] || '')
    const hasToken = !!(cookie.t && cookie.KugooID)

    if (hasToken) {
      const now = Date.now()
      const params = {
        srcappid: '2919',
        clientver: '20000',
        clienttime: String(now),
        mid: cookie.mid || cookie.kg_mid || '',
        uuid: cookie.uuid || cookie.mid || cookie.kg_mid || '',
        dfid: cookie.dfid || cookie.kg_dfid || '',
        appid: '1014',
        platid: '4',
        hash: id,
        token: cookie.t || '',
        userid: cookie.KugooID || '',
      }

      return {
        method: 'GET',
        url: this.buildSonginfoUrl(params),
        body: null,
        decode: 'kugou_url_new',
      }
    }

    // 老接口，无需 cookie
    return {
      method: 'POST',
      url: 'http://media.store.kugou.com/v1/get_res_privilege',
      body: JSON.stringify({
        relate: 1,
        userid: '0',
        vip: 0,
        appid: 1000,
        token: '',
        behavior: 'download',
        area_code: '1',
        clientver: '8990',
        resource: [
          {
            id: 0,
            type: 'audio',
            hash: id,
          },
        ],
      }),
      decode: 'kugou_url_legacy',
    }
  }

  /**
   * 获取歌词
   * @param {string} id 歌曲ID
   * @returns {ApiConfig} API 配置对象
   */
  lyric(id: string): ApiConfig {
    return {
      method: 'GET',
      url: 'http://krcs.kugou.com/search',
      body: {
        keyword: '%20-%20',
        ver: 1,
        hash: id,
        client: 'mobi',
        man: 'yes',
      },
      decode: 'kugou_lyric',
    }
  }

  /**
   * 获取封面图片
   * @param {string} id 图片ID
   * @param {number} size 图片尺寸
   * @returns {Promise<string>} 图片URL的JSON字符串
   */
  async pic(id: string, size: number = 300): Promise<string> {
    const format = this.meting.isFormat
    const data = await this.meting.format(false).song(id)
    this.meting.isFormat = format
    const songData = JSON.parse(data)
    let url = songData.imgUrl
    url = url.replace('{size}', '400')
    return JSON.stringify({ url: url })
  }

  /**
   * 格式化酷狗音乐数据
   * @param {Record<string, unknown>} data 原始数据
   * @returns {FormattedTrack} 格式化后的数据
   */
  format(data: any): FormattedTrack {
    const filename = data.filename || data.fileName
    const result: FormattedTrack = {
      id: data.hash,
      name: data.songName || filename,
      artist: [],
      album: data.album_name || '',
      url_id: data.encode_album_audio_id || data.hash,
      pic_id: data.hash,
      lyric_id: data.hash,
      source: 'kugou',
    }

    if (data.authors && Array.isArray(data.authors)) {
      result.artist = data.authors.map((a: any) => a.author_name)
    } else if (filename) {
      const parts = filename.split(' - ')
      if (parts.length >= 2) {
        result.artist = parts[0].split('、')
        result.name = parts[1]
      }
    }

    return result
  }

  /**
   * 解析 Cookie 字符串为对象
   * @param {string} cookieStr Cookie字符串
   * @returns {Record<string, string>} Cookie对象
   */
  private parseCookie(cookieStr: string): Record<string, string> {
    const cookies: Record<string, string> = {}
    if (!cookieStr) return cookies
    cookieStr.split(';').forEach((pair) => {
      const idx = pair.indexOf('=')
      if (idx > 0) {
        const key = pair.substring(0, idx).trim()
        const val = pair.substring(idx + 1).trim()
        cookies[key] = val
      }
    })
    return cookies
  }

  /**
   * 生成酷狗 API 签名
   * @param {Record<string, string>} params 参数对象
   * @returns {string} 签名字符串
   */
  private getSignature(params: Record<string, string>): string {
    const MD5_KEY = 'NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt'
    const paramStr = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    const sorted = paramStr.split('&').sort().join('')
    return crypto
      .createHash('md5')
      .update(`${MD5_KEY}${sorted}${MD5_KEY}`)
      .digest('hex')
  }

  /**
   * 处理酷狗音乐的解码逻辑
   * @param {string} decodeType 解码类型
   * @param {string} data 原始数据
   * @returns {Promise<string>} 解码后的数据
   */
  protected async handleDecode(decodeType: string, data: string): Promise<string> {
    if (decodeType === 'kugou_url_new') {
      return this.urlDecodeNew(data)
    } else if (decodeType === 'kugou_url_legacy') {
      return this.urlDecodeLegacy(data)
    } else if (decodeType === 'kugou_lyric') {
      return this.lyricDecode(data)
    }
    return data
  }

  /**
   * 构建带签名的 songinfo 请求 URL
   * @param {Record<string, string>} params 参数对象
   * @returns {string} 完整URL
   */
  private buildSonginfoUrl(params: Record<string, string>): string {
    const signature = this.getSignature(params)
    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    return `https://wwwapi.kugou.com/play/songinfo?${queryString}&signature=${signature}`
  }

  /**
   * 酷狗音乐 URL 解码（新接口，需要 cookie）
   * @param {string} result 原始结果
   * @returns {Promise<string>} 解码后的结果
   */
  private async urlDecodeNew(result: string): Promise<string> {
    try {
      const json = JSON.parse(result)
      const data = json.data
      if (!data || !data.encode_album_audio_id) {
        return JSON.stringify({ url: '', size: 0, br: -1 })
      }

      // 第二步：用 encode_album_audio_id 重新查询
      const cookie = this.parseCookie(this.meting.header['Cookie'] || '')
      const now = Date.now()
      const params = {
        srcappid: '2919',
        clientver: '20000',
        clienttime: String(now),
        mid: cookie.mid || cookie.kg_mid || '',
        uuid: cookie.uuid || cookie.mid || cookie.kg_mid || '',
        dfid: cookie.dfid || cookie.kg_dfid || '',
        appid: '1014',
        platid: '4',
        encode_album_audio_id: data.encode_album_audio_id,
        token: cookie.t || '',
        userid: cookie.KugooID || '',
      }

      const api: any = {
        method: 'GET',
        url: this.buildSonginfoUrl(params),
        body: null,
      }
      const response = JSON.parse(await this.meting._exec(api))
      const detail = response.data
      if (detail) {
        const url = detail.play_url || detail.play_backup_url || ''
        return JSON.stringify({
          url: url,
          size: detail.filesize || 0,
          br: detail.bitrate || -1,
        })
      }
    } catch (e) {
      // parse error
    }
    return JSON.stringify({ url: '', size: 0, br: -1 })
  }

  /**
   * 酷狗音乐 URL 解码（老接口，无需 cookie）
   * @param {string} result 原始结果
   * @returns {Promise<string>} 解码后的结果
   */
  private async urlDecodeLegacy(result: string): Promise<string> {
    try {
      const data = JSON.parse(result)

      let maxBr = 0
      let url: any

      for (const item of data.data[0].relate_goods) {
        if (item.info.bitrate <= this.meting.temp.br && item.info.bitrate > maxBr) {
          const api: any = {
            method: 'GET',
            url: 'http://trackercdn.kugou.com/i/v2/',
            body: {
              hash: item.hash,
              key: crypto
                .createHash('md5')
                .update(item.hash + 'kgcloudv2')
                .digest('hex'),
              pid: 3,
              behavior: 'play',
              cmd: '25',
              version: 8990,
            },
          }

          const response = JSON.parse(await this.meting._exec(api))
          if (response.url) {
            maxBr = response.bitRate / 1000
            url = {
              url: Array.isArray(response.url) ? response.url[0] : response.url,
              size: response.fileSize,
              br: response.bitRate / 1000,
            }
          }
        }
      }

      if (url) {
        return JSON.stringify(url)
      }
    } catch (e) {
      // parse error
    }
    return JSON.stringify({ url: '', size: 0, br: -1 })
  }

  /**
   * 酷狗音乐歌词解码
   * @param {string} result 原始结果
   * @returns {Promise<string>} 解码后的结果
   */
  protected async lyricDecode(result: string): Promise<string> {
    const data = JSON.parse(result)

    if (!data.candidates || data.candidates.length === 0) {
      return JSON.stringify({ lyric: '', tlyric: '' })
    }

    const api: any = {
      method: 'GET',
      url: 'http://lyrics.kugou.com/download',
      body: {
        charset: 'utf8',
        accesskey: data.candidates[0].accesskey,
        id: data.candidates[0].id,
        client: 'mobi',
        fmt: 'lrc',
        ver: 1,
      },
    }

    const response = JSON.parse(await this.meting._exec(api))
    const lyricData = {
      lyric: Buffer.from(response.content, 'base64').toString(),
      tlyric: '',
    }

    return JSON.stringify(lyricData)
  }
}
