import { YouTubeService } from './youtube-service';
import { StorageService, AppSettings } from './storage-service';
import { NotificationService } from './notification-service';

class BackgroundService {
  private settings: AppSettings | null = null;
  private youtubeService: YouTubeService | null = null;
  private alarmName = 'youtubeChannelCheck';

  constructor() {
    this.init();
  }

  private init(): void {
    // 메시지 리스너 등록
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 비동기 응답을 위해 true 반환
    });

    // 알람 리스너 등록
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === this.alarmName) {
        this.checkForNewVideos();
      }
    });

    // 확장 프로그램 설치/업데이트 시 초기화
    chrome.runtime.onInstalled.addListener(() => {
      this.loadSettings();
    });
  }

  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): Promise<void> {
    try {
      switch (message.action) {
        case 'startMonitoring':
          await this.startMonitoring(message.settings);
          sendResponse({ success: true });
          break;
        case 'stopMonitoring':
          await this.stopMonitoring();
          sendResponse({ success: true });
          break;
        case 'getStatus':
          const status = await this.getStatus();
          sendResponse({ success: true, status });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      this.settings = await StorageService.getSettings();
      if (this.settings && this.settings.apiKey) {
        this.youtubeService = new YouTubeService(this.settings.apiKey);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  private async startMonitoring(settings: AppSettings): Promise<void> {
    try {
      this.settings = settings;
      this.youtubeService = new YouTubeService(settings.apiKey);

      // 기존 알람 제거
      await chrome.alarms.clear(this.alarmName);

      // 새 알람 설정 (분 단위를 밀리초로 변환)
      const intervalInMinutes = settings.checkInterval;
      await chrome.alarms.create(this.alarmName, {
        delayInMinutes: 1, // 1분 후 첫 체크
        periodInMinutes: intervalInMinutes
      });

      console.log(`YouTube channel monitoring started for ${settings.channelName}`);
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  }

  private async stopMonitoring(): Promise<void> {
    try {
      await chrome.alarms.clear(this.alarmName);
      this.settings = null;
      this.youtubeService = null;
      console.log('YouTube channel monitoring stopped');
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  }

  private async checkForNewVideos(): Promise<void> {
    if (!this.settings || !this.youtubeService) {
      console.log('No settings or YouTube service available');
      return;
    }

    try {
      console.log(`Checking for new videos from ${this.settings.channelName}...`);
      
      const videos = await this.youtubeService.getLatestVideos(this.settings.channelId, 1);
      
      if (videos.length === 0) {
        console.log('No videos found');
        return;
      }

      const latestVideo = videos[0];
      
      // 마지막으로 확인한 영상과 비교
      if (this.settings.lastVideoId && this.settings.lastVideoId === latestVideo.id) {
        console.log('No new videos found');
        return;
      }

      // 새 영상 발견!
      console.log(`New video found: ${latestVideo.title}`);
      
      // 설정 업데이트
      this.settings.lastVideoId = latestVideo.id;
      this.settings.lastCheckTime = new Date().toISOString();
      await StorageService.saveSettings(this.settings);

      // 알림 표시
      if (this.settings.notificationsEnabled) {
        await NotificationService.showNewVideoNotification(latestVideo, this.settings.channelName);
      }

    } catch (error) {
      console.error('Error checking for new videos:', error);
      
      // 에러 알림 표시
      if (this.settings && this.settings.notificationsEnabled) {
        await NotificationService.showErrorNotification(
          `${this.settings.channelName} 채널 확인 중 오류가 발생했습니다.`
        );
      }
    }
  }

  private async getStatus(): Promise<any> {
    return {
      isMonitoring: this.settings !== null,
      channelName: this.settings?.channelName || null,
      lastCheckTime: this.settings?.lastCheckTime || null,
      checkInterval: this.settings?.checkInterval || null
    };
  }
}

// 백그라운드 서비스 초기화
new BackgroundService();
