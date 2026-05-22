/**
 * Meting music framework - Node.js version (TypeScript 版)
 * https://i-meto.com
 * https://github.com/metowolf/Meting
 *
 * Copyright 2019, METO Sheel <i@i-meto.com>
 * Released under the MIT license
 */

import { URLSearchParams } from 'url'
import ProviderFactory from './providers/index'
import type BaseProvider from './providers/base'

interface RequestInfo {
  statusCode: number
  headers: Record<string, string>
}

interface TempData {
  [key: string]: any
}

interface RequestHeaders {
  [key: string]: string
}

class Meting {
  VERSION: string
  raw: string | null
  info: RequestInfo | null
  error: string | null
  status: string | null
  temp: TempData

  server: string | null
  provider: BaseProvider | null
  isFormat: boolean
  header: RequestHeaders

  constructor(server: string = 'netease') {
    this.VERSION = '__VERSION__' // 在构建时由 rollup 替换为实际版本号
    this.raw = null
    this.info = null
    this.error = null
    this.status = null
    this.temp = {}

    this.server = null
    this.provider = null
    this.isFormat = false
    this.header = {}

    this.site(server)
  }

  /**
   * 设置音乐平台
   * @param {string} server 平台名称
   * @returns {Meting} 返回 this 以支持链式调用
   */
  site(server: string): Meting {
    if (!ProviderFactory.isSupported(server)) {
      server = 'netease' // 默认使用网易云音乐
    }

    this.server = server
    this.provider = ProviderFactory.create(server, this)
    this.header = this.provider.getHeaders()

    return this
  }

  /**
   * 设置 Cookie
   * @param {string} cookie Cookie 字符串
   * @returns {Meting} 返回 this 以支持链式调用
   */
  cookie(cookie: string): Meting {
    this.header['Cookie'] = cookie
    return this
  }

  /**
   * 设置数据格式化
   * @param {boolean} format 是否格式化
   * @returns {Meting} 返回 this 以支持链式调用
   */
  format(format: boolean = true): Meting {
    this.isFormat = format
    return this
  }

  /**
   * 执行 API 请求的主方法
   * @param {Object} api API 配置对象
   * @returns {Promise<string>} 处理后的结果
   */
  async _exec(api: any): Promise<string> {
    // 让 Provider 自己处理完整的请求流程
    return await this.provider!.executeRequest(api, this)
  }

  /**
   * HTTP 请求方法 - 使用 fetch API
   * @param {string} url 请求地址
   * @param {any} payload 请求体
   * @param {boolean} headerOnly 是否仅返回头部
   * @returns {Promise<Meting>} 返回 this
   */
  async _curl(url: string, payload: any = null, headerOnly: boolean = false): Promise<Meting> {
    const requestOptions: RequestInit = {
      method: payload ? 'POST' : 'GET',
      headers: { ...this.header },
    }

    // 处理请求体
    if (payload) {
      if (typeof payload === 'object' && !Buffer.isBuffer(payload) && typeof payload !== 'string') {
        payload = new URLSearchParams(payload as Record<string, string>).toString()
        requestOptions.headers = {
          ...requestOptions.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
      requestOptions.body = payload
    }

    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    requestOptions.signal = controller.signal

    let retries = 3
    const makeRequest = async (): Promise<Meting> => {
      try {
        const response = await fetch(url, requestOptions)

        clearTimeout(timeoutId)

        // 存储响应信息
        this.info = {
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        }

        // 获取响应数据
        const data = await response.text()
        this.raw = data
        this.error = null
        this.status = ''

        return this
      } catch (err: any) {
        clearTimeout(timeoutId)

        // 处理错误
        if (err.name === 'AbortError') {
          this.error = 'TIMEOUT'
          this.status = 'Request timeout'
        } else {
          this.error = err.code || err.name
          this.status = err.message
        }

        // 重试机制
        if (retries > 0) {
          retries--
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return makeRequest()
        } else {
          return this
        }
      }
    }

    return await makeRequest()
  }

  // ========== 公共 API 方法 ==========

  /**
   * 搜索功能
   * @param {string} keyword 搜索关键词
   * @param {Record<string, unknown>} option 搜索选项
   * @returns {Promise<string>} 搜索结果
   */
  async search(keyword: string, option: Record<string, unknown> = {}): Promise<string> {
    const api = this.provider!.search(keyword, option)
    return await this._exec(api)
  }

  /**
   * 获取歌曲详情
   * @param {string} id 歌曲ID
   * @returns {Promise<string>} 歌曲详情
   */
  async song(id: string): Promise<string> {
    const api = this.provider!.song(id)
    return await this._exec(api)
  }

  /**
   * 获取专辑信息
   * @param {string} id 专辑ID
   * @returns {Promise<string>} 专辑信息
   */
  async album(id: string): Promise<string> {
    const api = this.provider!.album(id)
    return await this._exec(api)
  }

  /**
   * 获取艺术家作品
   * @param {string} id 艺术家ID
   * @param {number} limit 限制数量
   * @returns {Promise<string>} 艺术家作品列表
   */
  async artist(id: string, limit: number = 50): Promise<string> {
    const api = this.provider!.artist(id, limit)
    return await this._exec(api)
  }

  /**
   * 获取播放列表
   * @param {string} id 播放列表ID
   * @returns {Promise<string>} 播放列表
   */
  async playlist(id: string): Promise<string> {
    const api = this.provider!.playlist(id)
    return await this._exec(api)
  }

  /**
   * 获取音频播放链接
   * @param {string} id 歌曲ID
   * @param {number} br 比特率
   * @returns {Promise<string>} 音频链接信息
   */
  async url(id: string, br: number = 320): Promise<string> {
    this.temp.br = br
    const api = this.provider!.url(id, br)
    return await this._exec(api)
  }

  /**
   * 获取歌词
   * @param {string} id 歌曲ID
   * @returns {Promise<string>} 歌词
   */
  async lyric(id: string): Promise<string> {
    const api = this.provider!.lyric(id)
    return await this._exec(api)
  }

  /**
   * 获取封面图片
   * @param {string} id 图片ID
   * @param {number} size 图片尺寸
   * @returns {Promise<string>} 图片URL
   */
  async pic(id: string, size: number = 300): Promise<string> {
    return await this.provider!.pic(id, size)
  }

  // ========== 静态方法 ==========

  /**
   * 获取支持的平台列表
   * @returns {string[]} 平台列表
   */
  static getSupportedPlatforms(): string[] {
    return ProviderFactory.getSupportedPlatforms()
  }

  /**
   * 检查平台是否支持
   * @param {string} platform 平台名称
   * @returns {boolean} 是否支持
   */
  static isSupported(platform: string): boolean {
    return ProviderFactory.isSupported(platform)
  }
}

export default Meting
