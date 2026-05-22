import type { ApiConfig, RequestHeaders, FormattedTrack } from './base'
import BaseProvider from './base'

/**
 * 酷我音乐平台提供者
 */
export default class KuwoProvider extends BaseProvider {
  protected name = 'kuwo'
  protected meting: any

  constructor(meting: any) {
    super(meting)
    this.meting = meting
  }

  /**
   * 获取酷我音乐的请求头配置
   * @returns {RequestHeaders} 请求头对象
   */
  getHeaders(): RequestHeaders {
    return {
      'Cookie':
        'Hm_lvt_cdb524f42f0ce19b169a8071123a4797=1623339177,1623339183; _ga=GA1.2.1195980605.1579367081; Hm_lpvt_cdb524f42f0ce19b169a8071123a4797=1623339982; kw_token=3E7JFQ7MRPL; _gid=GA1.2.747985028.1623339179; _gat=1',
      'csrf': '3E7JFQ7MRPL',
      'Host': 'www.kuwo.cn',
      'Referer': 'http://www.kuwo.cn/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36',
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
      url: 'http://www.kuwo.cn/api/www/search/searchMusicBykeyWord',
      body: {
        key: keyword,
        pn: option.page || 1,
        rn: option.limit || 30,
        httpsStatus: 1,
      },
      format: 'data.list',
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
      url: 'http://www.kuwo.cn/api/www/music/musicInfo',
      body: {
        mid: id,
        httpsStatus: 1,
      },
      format: 'data',
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
      url: 'http://www.kuwo.cn/api/www/album/albumInfo',
      body: {
        albumId: id,
        pn: 1,
        rn: 1000,
        httpsStatus: 1,
      },
      format: 'data.musicList',
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
      url: 'http://www.kuwo.cn/api/www/artist/artistMusic',
      body: {
        artistid: id,
        pn: 1,
        rn: limit,
        httpsStatus: 1,
      },
      format: 'data.list',
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
      url: 'http://www.kuwo.cn/api/www/playlist/playListInfo',
      body: {
        pid: id,
        pn: 1,
        rn: 1000,
        httpsStatus: 1,
      },
      format: 'data.musicList',
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
      url: 'http://www.kuwo.cn/api/v1/www/music/playUrl',
      body: {
        mid: id,
        type: 'music',
        httpsStatus: 1,
      },
      decode: 'kuwo_url',
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
      url: 'http://m.kuwo.cn/newh5/singles/songinfoandlrc',
      body: {
        musicId: id,
        httpsStatus: 1,
      },
      decode: 'kuwo_lyric',
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
    const url = songData.data.pic || songData.data.albumpic
    return JSON.stringify({ url: url })
  }

  /**
   * 格式化酷我音乐数据
   * @param {Record<string, unknown>} data 原始数据
   * @returns {FormattedTrack} 格式化后的数据
   */
  format(data: any): FormattedTrack {
    return {
      id: data.rid,
      name: data.name,
      artist: data.artist ? data.artist.split('&') : [],
      album: data.album || '',
      pic_id: data.rid,
      url_id: data.rid,
      lyric_id: data.rid,
      source: 'kuwo',
    }
  }

  /**
   * 处理酷我音乐的解码逻辑
   * @param {string} decodeType 解码类型
   * @param {string} data 原始数据
   * @returns {Promise<string>} 解码后的数据
   */
  protected async handleDecode(decodeType: string, data: string): Promise<string> {
    if (decodeType === 'kuwo_url') {
      return this.urlDecode(data)
    } else if (decodeType === 'kuwo_lyric') {
      return this.lyricDecode(data)
    }
    return data
  }

  /**
   * 酷我音乐 URL 解码
   * @param {string} result 原始结果
   * @returns {Promise<string>} 解码后的结果
   */
  protected async urlDecode(result: string): Promise<string> {
    const data = JSON.parse(result)

    let url: any
    if (data.code === 200 && data.data && data.data.url) {
      url = {
        url: data.data.url,
        br: 128,
      }
    } else {
      url = {
        url: '',
        br: -1,
      }
    }

    return JSON.stringify(url)
  }

  /**
   * 酷我音乐歌词解码
   * @param {string} result 原始结果
   * @returns {Promise<string>} 解码后的结果
   */
  protected async lyricDecode(result: string): Promise<string> {
    const data = JSON.parse(result)

    let lyric = ''
    if (data.data && data.data.lrclist && data.data.lrclist.length > 0) {
      data.data.lrclist.forEach((item: any) => {
        const time = parseFloat(item.time)
        const min = Math.floor(time / 60)
          .toString()
          .padStart(2, '0')
        const sec = Math.floor(time % 60)
          .toString()
          .padStart(2, '0')
        const msec = ((time % 1) * 100)
          .toFixed(0)
          .padStart(2, '0')

        lyric += `[${min}:${sec}.${msec}]${item.lineLyric}\n`
      })
    }

    const lyricData = {
      lyric: lyric,
      tlyric: '',
    }

    return JSON.stringify(lyricData)
  }
}
