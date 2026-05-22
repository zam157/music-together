/**
 * 音乐平台提供者基础类
 * 定义所有音乐平台提供者需要实现的接口
 */

export interface ApiConfig {
  method: string
  url: string
  body?: Record<string, unknown> | string | null
  encode?: string
  format?: string
  decode?: string
}

export interface RequestHeaders {
  [key: string]: string
}

export interface FormattedTrack {
  id: string | number
  name: string
  artist: string[]
  album: string
  pic_id: string | number
  url_id: string | number
  lyric_id: string | number
  source: string
}

export default class BaseProvider implements BaseProviderType {
  protected meting: any
  protected name: string

  constructor(meting: any) {
    this.meting = meting
    this.name = 'base'
  }

  /**
   * 获取平台的请求头配置
   * @returns {RequestHeaders} 请求头对象
   */
  getHeaders(): RequestHeaders {
    return {}
  }

  /**
   * 搜索歌曲
   * @param {string} keyword 搜索关键词
   * @param {Record<string, unknown>} [option={}] 搜索选项
   * @returns {ApiConfig} API 配置对象
   */
  search(keyword: string, option: Record<string, unknown> = {}): ApiConfig {
    throw new Error(`${this.name} provider must implement search method`)
  }

  /**
   * 获取歌曲详情
   * @param {string} id 歌曲ID
   * @returns {ApiConfig} API 配置对象
   */
  song(id: string): ApiConfig {
    throw new Error(`${this.name} provider must implement song method`)
  }

  /**
   * 获取专辑信息
   * @param {string} id 专辑ID
   * @returns {ApiConfig} API 配置对象
   */
  album(id: string): ApiConfig {
    throw new Error(`${this.name} provider must implement album method`)
  }

  /**
   * 获取艺术家作品
   * @param {string} id 艺术家ID
   * @param {number} limit 限制数量
   * @returns {ApiConfig} API 配置对象
   */
  artist(id: string, limit: number = 50): ApiConfig {
    throw new Error(`${this.name} provider must implement artist method`)
  }

  /**
   * 歌单详情
   * @param {string} id 播放列表ID
   * @returns {ApiConfig} API 配置对象
   */
  playlist(id: string): ApiConfig {
    throw new Error(`${this.name} provider must implement playlist method`)
  }

  /**
   * 获取音频播放链接
   * @param {string} id 歌曲ID
   * @param {number} br 比特率
   * @returns {ApiConfig} API 配置对象
   */
  url(id: string, br: number = 320): ApiConfig {
    throw new Error(`${this.name} provider must implement url method`)
  }

  /**
   * 获取歌词
   * @param {string} id 歌曲ID
   * @returns {ApiConfig} API 配置对象
   */
  lyric(id: string): ApiConfig {
    throw new Error(`${this.name} provider must implement lyric method`)
  }

  /**
   * 获取封面图片
   * @param {string} id 图片ID
   * @param {number} size 图片尺寸
   * @returns {Promise<string>} 图片URL的JSON字符串
   */
  async pic(id: string, size: number = 300): Promise<string> {
    throw new Error(`${this.name} provider must implement pic method`)
  }

  /**
   * 格式化数据
   * @param {Record<string, unknown>} data 原始数据
   * @returns {FormattedTrack} 格式化后的数据
   */
  format(data: Record<string, unknown>): FormattedTrack {
    throw new Error(`${this.name} provider must implement format method`)
  }

  /**
   * URL 解码方法（如果需要）
   * @param {string} result 原始结果
   * @returns {string} 解码后的结果
   */
  protected urlDecode(result: string): Promise<string> | string {
    // 默认实现，子类可以覆盖
    return result
  }

  /**
   * 歌词解码方法（如果需要）
   * @param {string} result 原始结果
   * @returns {string} 解码后的结果
   */
  protected lyricDecode(result: string): string | Promise<string> {
    // 默认实现，子类可以覆盖
    return result
  }

  /**
   * 执行完整的 API 请求流程
   * @param {ApiConfig} api API 配置对象
   * @param {any} meting Meting 实例
   * @returns {Promise<string>} 处理后的结果
   */
  async executeRequest(api: ApiConfig, meting: any): Promise<string> {
    // 如果有编码方法，先进行编码
    if (api.encode) {
      api = await this.handleEncode(api)
    }

    // 处理 GET 请求的参数
    if (api.method === 'GET' && api.body) {
      const params = new URLSearchParams(api.body as Record<string, string>)
      api.url += '?' + params.toString()
      api.body = null
    }

    // 发送 HTTP 请求
    await meting._curl(api.url, api.body)

    // 如果不需要格式化，直接返回原始数据
    if (!meting.isFormat) {
      return meting.raw
    }

    let data = meting.raw

    // 如果有解码方法，进行解码
    if (api.decode) {
      data = await this.handleDecode(api.decode, data)
    }

    // 如果有格式化规则，进行数据清理
    if ('format' in api) {
      data = this.cleanData(data, api.format, meting)
    }

    return data
  }

  /**
   * 处理编码逻辑
   * @param {ApiConfig} api API 配置对象
   * @returns {Promise<ApiConfig>} 编码后的 API 配置
   */
  protected async handleEncode(api: ApiConfig): Promise<ApiConfig> {
    // 子类可以覆盖此方法来处理特定的编码逻辑
    return api
  }

  /**
   * 处理解码逻辑
   * @param {string} decodeType 解码类型
   * @param {string} data 原始数据
   * @returns {Promise<string>} 解码后的数据
   */
  protected async handleDecode(decodeType: string, data: string): Promise<string> {
    // 根据解码类型调用相应的方法
    if (decodeType.includes('url')) {
      return this.urlDecode(data)
    } else if (decodeType.includes('lyric')) {
      return this.lyricDecode(data)
    }
    return data
  }

  /**
   * 数据清理方法
   */
  protected cleanData(raw: string, rule: string | undefined, meting: any): string {
    let data: any
    try {
      data = JSON.parse(raw)
    } catch (e) {
      return JSON.stringify([])
    }

    if (rule) {
      data = this.pickupData(data, rule)
    }

    if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
      data = [data]
    }

    if (!Array.isArray(data)) {
      return JSON.stringify([])
    }

    // 使用当前 provider 的格式化方法
    if (typeof this.format === 'function') {
      const result = data.map((item: any) => this.format(item))
      return JSON.stringify(result)
    }

    return JSON.stringify(data)
  }

  /**
   * 数据提取方法
   * @param {Record<string, unknown>} array 数据对象
   * @param {string} rule 提取规则
   * @returns {Record<string, unknown>} 提取后的数据
   */
  protected pickupData(array: Record<string, unknown>, rule: string): Record<string, unknown> {
    const parts = rule.split('.')
    let result: any = array

    for (const part of parts) {
      if (!result || typeof result !== 'object' || !(part in result)) {
        return {}
      }
      result = result[part]
    }

    return result
  }
}

// BaseProvider 改成 interface
export interface BaseProviderType {
  getHeaders(): RequestHeaders
  search(keyword: string, option?: Record<string, unknown>): ApiConfig
  song(id: string): ApiConfig
  album(id: string): ApiConfig
  artist(id: string, limit?: number): ApiConfig
  playlist(id: string): ApiConfig
  url(id: string, br?: number): ApiConfig
  lyric(id: string): ApiConfig
  pic(id: string, size?: number): Promise<string>
  format(data: Record<string, unknown>): FormattedTrack
}
