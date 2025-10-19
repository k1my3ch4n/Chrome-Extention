import { YouTubeVideo } from './youtube-service';

export class NotificationService {
  /**
   * 알림 권한을 요청합니다
   */
  static async requestPermission(): Promise<boolean> {
    try {
      // Chrome 확장 프로그램에서는 권한이 이미 manifest.json에 선언되어 있음
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * 새 영상 알림을 표시합니다
   */
  static async showNewVideoNotification(video: YouTubeVideo, channelName: string): Promise<void> {
    try {
      const notificationId = `new-video-${video.id}`;
      
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: video.thumbnailUrl,
        title: `🎥 ${channelName}에 새 영상이 올라왔습니다!`,
        message: video.title,
        contextMessage: 'YouTube Channel Monitor',
        buttons: [
          { title: '영상 보기' },
          { title: '나중에' }
        ]
      });

      // 알림 클릭 이벤트 리스너 추가
      chrome.notifications.onClicked.addListener((clickedNotificationId) => {
        if (clickedNotificationId === notificationId) {
          chrome.tabs.create({ url: video.videoUrl });
        }
      });

      // 알림 버튼 클릭 이벤트 리스너 추가
      chrome.notifications.onButtonClicked.addListener((clickedNotificationId, buttonIndex) => {
        if (clickedNotificationId === notificationId) {
          if (buttonIndex === 0) {
            // "영상 보기" 버튼 클릭
            chrome.tabs.create({ url: video.videoUrl });
          }
          // "나중에" 버튼은 아무것도 하지 않음
        }
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * 설정 완료 알림을 표시합니다
   */
  static async showSetupCompleteNotification(channelName: string): Promise<void> {
    try {
      await chrome.notifications.create('setup-complete', {
        type: 'basic',
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDRDMzUuMDQ1NyA0IDQ0IDEyLjk1NDMgNDQgMjRDMzUuMDQ1NyA0NCAyNCA1Mi45NTQzIDI0IDQ0QzEyLjk1NDMgNDQgNCAzNS4wNDU3IDQgMjRDNCAxMi45NTQzIDEyLjk1NDMgNCAyNCA0WiIgZmlsbD0iIzQxQjU4MyIvPgo8cGF0aCBkPSJNMjAgMjhMMjQgMzJMMjggMjgiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
        title: '✅ 설정이 완료되었습니다!',
        message: `${channelName} 채널을 모니터링하기 시작합니다.`,
        contextMessage: 'YouTube Channel Monitor'
      });
    } catch (error) {
      console.error('Error showing setup complete notification:', error);
    }
  }

  /**
   * 에러 알림을 표시합니다
   */
  static async showErrorNotification(message: string): Promise<void> {
    try {
      await chrome.notifications.create('error', {
        type: 'basic',
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDRDMzUuMDQ1NyA0IDQ0IDEyLjk1NDMgNDQgMjRDMzUuMDQ1NyA0NCAyNCA1Mi45NTQzIDI0IDQ0QzEyLjk1NDMgNDQgNCAzNS4wNDU3IDQgMjRDNCAxMi45NTQzIDEyLjk1NDMgNCAyNCA0WiIgZmlsbD0iI0Y0NDM0MyIvPgo8cGF0aCBkPSJNMjQgMTZWMjQiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yNCAzMkgyNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
        title: '❌ 오류가 발생했습니다',
        message: message,
        contextMessage: 'YouTube Channel Monitor'
      });
    } catch (error) {
      console.error('Error showing error notification:', error);
    }
  }

  /**
   * 모든 알림을 지웁니다
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      // Chrome notifications API의 타입 문제로 인해 any로 캐스팅
      const notifications = await (chrome.notifications.getAll as any)();
      if (notifications && typeof notifications === 'object') {
        for (const notificationId in notifications) {
          await chrome.notifications.clear(notificationId);
        }
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}
