import type { ApiConfig, FormattedTrack } from "./base";
import NeteaseProvider from "./netease.js";

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
   * @param option.limit 每页数量，默认为30
   * @param option.page 页码，默认为1
   * @param option.type 搜索类型，可选 'song' 或 'playlist', 默认为 'song'
   * @returns API 配置对象
   */
  search(keyword: string, option: { limit?: number, page?: number, type?: 'song' | 'playlist' } = {}): ApiConfig {
    if (option.type === 'playlist') {
      // playlist
      return {
        method: 'POST',
        url: 'http://music.163.com/api/search/voicelist/get',
        // url: 'https://music.163.com/weapi/search/voicelist/get',
        body: {
          keyword,
          scene: 'NORMAL',
          limit: option.limit || 30,
          offset: (option.page && option.limit) ? ((option.page as number) - 1) * (option.limit as number) : 0,
        },
        encode: 'netease_eapi',
      }
    }
    else {
      // song
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
        format: 'data.resources',
      }
    }
  }

  /**
   * 获取播放列表
   * @param {string} id 播放列表ID
   * @returns {ApiConfig} API 配置对象
   */
  playlist(id: string): ApiConfig {
    return {
      method: 'POST',
      // url: 'http://music.163.com/api/voice/workbench/voicelist/detail',
      url: 'http://music.163.com/weapi/djradio/v3/get',
      body: {
        id,
      },
      encode: 'netease_weapi',
      // format: 'playlist.tracks',
    }
  }

  fetchProgramList(id: string, limit: number = 1000, offset: number = 0) {
    return {
      method: 'POST',
      url: 'https://music.163.com/weapi/v6/dj/program/byradio',
      body: {
        radioId: id,
        limit,
        offset,
        asc: "false",
        updateOrder: "true",
      },
      encode: 'netease_weapi',
    }
  }

  /**
   * 获取歌词
   * @param {string} id 歌曲ID
   * @returns {ApiConfig} API 配置对象
   */
  lyric(id: string): ApiConfig {
    return {
      method: 'POST',
      url: 'http://music.163.com/api/voice/lyric/get',
      body: {
        programId: id,
      },
      encode: 'netease_eapi',
      decode: 'netease_lyric',
    }
  }
}