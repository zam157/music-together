import type { ApiConfig } from "./base";
import NeteaseProvider from "./netease";

export default class NeteaseVoiceProvider extends NeteaseProvider {
  protected name = 'netease-voice'
  protected meting: any

  constructor(meting: any) {
    super(meting)
    this.meting = meting
  }

  /**
   * 搜索歌曲
   * @param keyword 搜索关键词
   * @param option 搜索选项
   * @returns API 配置对象
   */
  search(keyword: string, option: Record<string, unknown> = {}): ApiConfig {
    return {
      method: 'POST',
      url: 'http://music.163.com/api/search/voice/get',
      body: {
        keyword,
        scene: 'normal',
        limit: option.limit || 30,
        total: 'true',
        offset: (option.page && option.limit) ? ((option.page as number) - 1) * (option.limit as number) : 0,
      },
      encode: 'netease_eapi',
      format: 'result.songs',
    }
  }

  // /**
  //  * 格式化网易云音乐数据
  //  * @param {Record<string, unknown>} data 原始数据
  //  * @returns {FormattedTrack} 格式化后的数据
  //  */
  // format(data: any): FormattedTrack {
  //   const result: FormattedTrack = {
  //     id: data.id,
  //     name: data.name,
  //     artist: [],
  //     album: data.al.name,
  //     pic_id: data.al.pic_str || data.al.pic,
  //     url_id: data.id,
  //     lyric_id: data.id,
  //     source: 'netease-voice',
  //   }

  //   if (data.al.picUrl) {
  //     const match = data.al.picUrl.match(/\/(\d+)\./)
  //     if (match) {
  //       result.pic_id = match[1]
  //     }
  //   }

  //   data.ar.forEach((artist: any) => {
  //     ;(result.artist as string[]).push(artist.name)
  //   })

  //   return result
  // }
}