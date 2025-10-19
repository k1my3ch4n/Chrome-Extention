export interface AppSettings {
  apiKey: string;
  channelId: string;
  channelName: string;
  checkInterval: number; // 분 단위
  lastCheckTime: string;
  lastVideoId: string;
  notificationsEnabled: boolean;
}

export class StorageService {
  private static readonly STORAGE_KEY = 'youtubeChannelMonitorSettings';

  /**
   * 설정을 저장합니다
   */
  static async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: updatedSettings
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * 설정을 불러옵니다
   */
  static async getSettings(): Promise<AppSettings> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const settings = result[this.STORAGE_KEY];
      
      if (!settings) {
        // 기본 설정 반환
        return {
          apiKey: '',
          channelId: '',
          channelName: '',
          checkInterval: 30, // 30분마다 체크
          lastCheckTime: '',
          lastVideoId: '',
          notificationsEnabled: true
        };
      }
      
      return settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  }

  /**
   * 설정을 초기화합니다
   */
  static async clearSettings(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing settings:', error);
      throw error;
    }
  }

  /**
   * 특정 설정값을 업데이트합니다
   */
  static async updateSetting<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings[key] = value;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }
}
