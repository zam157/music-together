import NeteaseProvider from './netease'
import TencentProvider from './tencent'
import KugouProvider from './kugou'
import BaiduProvider from './baidu'
import KuwoProvider from './kuwo'
import NeteaseVoiceProvider from './netease-voice'
import type BaseProvider from './base'

type ProviderConstructor = new (meting: any) => BaseProvider

/**
 * 音乐平台提供者工厂
 */
export default class ProviderFactory {
  static providers: Record<string, ProviderConstructor> = {
    netease: NeteaseProvider,
    tencent: TencentProvider,
    kugou: KugouProvider,
    baidu: BaiduProvider,
    kuwo: KuwoProvider,
    'netease-voice': NeteaseVoiceProvider,
  }

  /**
   * 创建指定平台的提供者实例
   * @param platform 平台名称
   * @param meting Meting 实例
   * @returns 平台提供者实例
   */
  static create(platform: string, meting: any): BaseProvider {
    const ProviderClass = this.providers[platform]
    if (!ProviderClass) {
      throw new Error(`Unsupported platform: ${platform}`)
    }
    return new ProviderClass(meting)
  }

  /**
   * 获取支持的平台列表
   * @returns 支持的平台名称数组
   */
  static getSupportedPlatforms(): string[] {
    return Object.keys(this.providers)
  }

  /**
   * 检查平台是否支持
   * @param platform 平台名称
   * @returns 是否支持
   */
  static isSupported(platform: string): boolean {
    return platform in this.providers
  }
}
