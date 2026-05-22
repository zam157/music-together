import crypto from 'crypto'
import type { ApiConfig, RequestHeaders, FormattedTrack } from './base'
import BaseProvider from './base'

/**
 * 百度音乐平台提供者
 */
export default class BaiduProvider extends BaseProvider {
  protected name = 'baidu'
  protected meting: any
  constructor(meting: any) {
    super(meting)
    this.meting = meting
  }

  /**
   * 获取百度音乐的请求头配置
   * @returns {RequestHeaders} 请求头对象
   */
  getHeaders(): RequestHeaders {
    return {
      'Cookie': `BAIDUID=${this._getRandomHex(32)}:FG=1`,
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) baidu-music/1.2.1 Chrome/66.0.3359.181 Electron/3.0.5 Safari/537.36',
      'Accept': '*/*',
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept-Language': 'zh-CN',
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
      url: 'http://musicapi.taihe.com/v1/restserver/ting',
      body: {
        from: 'qianqianmini',
        method: 'baidu.ting.search.merge',
        isNew: 1,
        platform: 'darwin',
        page_no: option.page || 1,
        query: keyword,
        version: '11.2.1',
        page_size: option.limit || 30,
      },
      format: 'result.song_info.song_list',
    }
  }

  /**
   * 获取歌曲详情
   * @param {string} id 歌曲ID
   * @returns {ApiConfig} API 配置对象
   */
  song(id: string): ApiConfig {
    return {
      method: 'GET',
      url: 'http://musicapi.taihe.com/v1/restserver/ting',
      body: {
        from: 'qianqianmini',
        method: 'baidu.ting.song.getInfos',
        songid: id,
        res: 1,
        platform: 'darwin',
        version: '1.0.0',
      },
      encode: 'baidu_AESCBC',
      format: 'songinfo',
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
      url: 'http://musicapi.taihe.com/v1/restserver/ting',
      body: {
        from: 'qianqianmini',
        method: 'baidu.ting.album.getAlbumInfo',
        album_id: id,
        platform: 'darwin',
        version: '11.2.1',
      },
      format: 'songlist',
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
      url: 'http://musicapi.taihe.com/v1/restserver/ting',
      body: {
        from: 'qianqianmini',
        method: 'baidu.ting.artist.getSongList',
        artistid: id,
        limits: limit,
        platform: 'darwin',
        offset: 0,
        tinguid: 0,
        version: '11.2.1',
      },
      format: 'songlist',
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
      url: 'http://musicapi.taihe.com/v1/restserver/ting',
      body: {
        from: 'qianqianmini',
        method: 'baidu.ting.diy.gedanInfo',
        listid: id,
        platform: 'darwin',
        version: '11.2.1',
      },
      format: 'content',
    }
  }

  /**
   * 获取音频播放链接
   * @param {string} id 歌曲ID
   * @param {number} br 比特率
   * @returns {ApiConfig} API 配置对象
   */
  url(id: string, br: number = 320): ApiConfig {
    return {
      method: 'GET',
      url: 'http://musicapi.taihe.com/v1/restserver/ting',
      body: {
        from: 'qianqianmini',
        method: 'baidu.ting.song.getInfos',
        songid: id,
        res: 1,
        platform: 'darwin',
        version: '1.0.0',
      },
      encode: 'baidu_AESCBC',
      decode: 'baidu_url',
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
      url: 'http://musicapi.taihe.com/v1/restserver/ting',
      body: {
        from: 'qianqianmini',
        method: 'baidu.ting.song.lry',
        songid: id,
        platform: 'darwin',
        version: '1.0.0',
      },
      decode: 'baidu_lyric',
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
    const url = songData.songinfo.pic_radio || songData.songinfo.pic_small
    return JSON.stringify({ url: url })
  }

  /**
   * 格式化百度音乐数据
   * @param {Record<string, unknown>} data 原始数据
   * @returns {FormattedTrack} 格式化后的数据
   */
  format(data: any): FormattedTrack {
    return {
      id: data.song_id,
      name: data.title,
      artist: data.author ? data.author.split(',') : [],
      album: data.album_title || '',
      pic_id: data.song_id,
      url_id: data.song_id,
      lyric_id: data.song_id,
      source: 'baidu',
    }
  }

  /**
   * 处理百度音乐的编码逻辑
   * @param {ApiConfig} api API 配置对象
   * @returns {Promise<ApiConfig>} 编码后的 API 配置
   */
  async handleEncode(api: ApiConfig): Promise<ApiConfig> {
    if (api.encode === 'baidu_AESCBC') {
      return this.aesEncrypt(api)
    }
    return api
  }

  /**
   * 处理百度音乐的解码逻辑
   * @param {string} decodeType 解码类型
   * @param {string} data 原始数据
   * @returns {Promise<string>} 解码后的数据
   */
  async handleDecode(decodeType: string, data: string): Promise<string> {
    if (decodeType === 'baidu_url') {
      return this.urlDecode(data)
    } else if (decodeType === 'baidu_lyric') {
      return this.lyricDecode(data)
    }
    return data
  }

  /**
   * 百度音乐 AES 加密
   * @param {ApiConfig} api API 配置对象
   * @returns {Promise<ApiConfig>} 加密后的 API 配置
   */
  private async aesEncrypt(api: ApiConfig): Promise<ApiConfig> {
    const key = 'DBEECF8C50FD160E'
    const vi = '1231021386755796'

    const data = `songid=${(api.body as any).songid}&ts=${Date.now()}`

    const cipher = crypto.createCipheriv('aes-128-cbc', key as any, vi as any)
    cipher.setAutoPadding(true)
    let encrypted = cipher.update(data, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    ;(api.body as any).e = encrypted

    return api
  }

  /**
   * 百度音乐 URL 解码
   * @param {string} result 原始结果
   * @returns {string} 解码后的结果
   */
  protected urlDecode(result: string) {
    const data = JSON.parse(result)

    let maxBr = 0
    let url: any

    data.songurl.url.forEach((item: any) => {
      if (item.file_bitrate <= this.meting.temp.br && item.file_bitrate > maxBr) {
        maxBr = item.file_bitrate
        url = {
          url: item.file_link,
          br: item.file_bitrate,
        }
      }
    })

    if (!url) {
      url = {
        url: '',
        br: -1,
      }
    }

    return JSON.stringify(url)
  }

  /**
   * 百度音乐歌词解码
   * @param {string} result 原始结果
   * @returns {string} 解码后的结果
   */
  protected lyricDecode(result: string): string {
    const data = JSON.parse(result)
    const lyricData = {
      lyric: data.lrcContent || '',
      tlyric: '',
    }

    return JSON.stringify(lyricData)
  }

  // ========== 私有工具方法 ==========

  /**
   * 生成随机十六进制字符串
   * @param {number} length 长度
   * @returns {string} 随机十六进制字符串
   */
  private _getRandomHex(length: number): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
  }
}
