import './styles.css';
import { YouTubeService } from './youtube-service';
import { StorageService, AppSettings } from './storage-service';
import { NotificationService } from './notification-service';
import { AuthService, GOOGLE_CLIENT_ID } from './auth-service';

class PopupApp {
  private setupButton!: HTMLButtonElement;
  private testButton!: HTMLButtonElement;
  private stopButton!: HTMLButtonElement;
  private loginButton!: HTMLButtonElement;
  private logoutButton!: HTMLButtonElement;
  private message!: HTMLElement;
  private setupSection!: HTMLElement;
  private statusSection!: HTMLElement;
  private apiKeyInput!: HTMLInputElement;
  private channelInput!: HTMLInputElement;
  private checkIntervalSelect!: HTMLSelectElement;
  private notificationsCheckbox!: HTMLInputElement;
  private channelNameElement!: HTMLElement;
  private lastCheckElement!: HTMLElement;
  private statusIndicator!: HTMLElement;

  private youtubeService: YouTubeService | null = null;
  private settings: AppSettings | null = null;

  constructor() {
    this.initializeElements();
    this.init();
  }

  private init(): void {
    document.addEventListener('DOMContentLoaded', () => {
      this.attachEventListeners();
      this.loadSettings();
    });
  }

  private initializeElements(): void {
    this.setupButton = document.getElementById('setupButton') as HTMLButtonElement;
    this.testButton = document.getElementById('testButton') as HTMLButtonElement;
    this.stopButton = document.getElementById('stopButton') as HTMLButtonElement;
    this.loginButton = document.getElementById('loginButton') as HTMLButtonElement;
    this.logoutButton = document.getElementById('logoutButton') as HTMLButtonElement;
    this.message = document.getElementById('message') as HTMLElement;
    this.setupSection = document.getElementById('setupSection') as HTMLElement;
    this.statusSection = document.getElementById('statusSection') as HTMLElement;
    this.apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
    this.channelInput = document.getElementById('channelInput') as HTMLInputElement;
    this.checkIntervalSelect = document.getElementById('checkInterval') as HTMLSelectElement;
    this.notificationsCheckbox = document.getElementById('notificationsEnabled') as HTMLInputElement;
    this.channelNameElement = document.getElementById('channelName') as HTMLElement;
    this.lastCheckElement = document.getElementById('lastCheck') as HTMLElement;
    this.statusIndicator = document.getElementById('statusIndicator') as HTMLElement;
  }

  private attachEventListeners(): void {
    if (this.setupButton) {
      this.setupButton.addEventListener('click', this.handleSetup.bind(this));
    }
    if (this.testButton) {
      this.testButton.addEventListener('click', this.handleTest.bind(this));
    }
    if (this.stopButton) {
      this.stopButton.addEventListener('click', this.handleStop.bind(this));
    }
    if (this.loginButton) {
      this.loginButton.addEventListener('click', this.handleLogin.bind(this));
    }
    if (this.logoutButton) {
      this.logoutButton.addEventListener('click', this.handleLogout.bind(this));
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      this.settings = await StorageService.getSettings();
      // OAuth 토큰 존재 시 로그인 상태로 전환
      const token = await AuthService.getValidAccessToken();
      if (token) {
        this.showStatusView();
        this.updateAuthButtons(true);
        return;
      }

      if (this.settings.apiKey) {
        this.youtubeService = new YouTubeService(this.settings.apiKey);
        this.showStatusView();
        this.updateStatusDisplay();
      } else {
        this.showSetupView();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showMessage('설정을 불러오는 중 오류가 발생했습니다.', 'error');
    }
  }

  private showSetupView(): void {
    if (this.setupSection) this.setupSection.classList.remove('hidden');
    if (this.statusSection) this.statusSection.classList.add('hidden');
    if (this.stopButton) this.stopButton.classList.add('hidden');
    if (this.testButton) this.testButton.classList.add('hidden');
    this.updateAuthButtons(false);
  }

  private showStatusView(): void {
    if (this.setupSection) this.setupSection.classList.add('hidden');
    if (this.statusSection) this.statusSection.classList.remove('hidden');
    if (this.stopButton) this.stopButton.classList.remove('hidden');
    if (this.testButton) this.testButton.classList.remove('hidden');
    this.updateAuthButtons(true);
  }

  private updateAuthButtons(isLoggedIn: boolean): void {
    if (!this.loginButton || !this.logoutButton) return;
    if (isLoggedIn) {
      this.loginButton.classList.add('hidden');
      this.logoutButton.classList.remove('hidden');
    } else {
      this.loginButton.classList.remove('hidden');
      this.logoutButton.classList.add('hidden');
    }
  }

  private async handleSetup(): Promise<void> {
    // 기존 API Key 기반 설정은 유지하되, OAuth 도입 이후엔 미사용 가능
    if (!this.apiKeyInput || !this.channelInput || !this.checkIntervalSelect || !this.notificationsCheckbox) {
      return;
    }

    const apiKey = this.apiKeyInput.value.trim();
    const channelInput = this.channelInput.value.trim();
    const checkInterval = parseInt(this.checkIntervalSelect.value);
    const notificationsEnabled = this.notificationsCheckbox.checked;

    if (!apiKey) {
      this.showMessage('API 키를 입력해주세요.', 'error');
      return;
    }

    if (!channelInput) {
      this.showMessage('채널 URL 또는 ID를 입력해주세요.', 'error');
      return;
    }

    try {
      this.showMessage('설정 중...', 'info');
      
      this.youtubeService = new YouTubeService(apiKey);
      
      // 채널 ID 추출
      let channelId = this.youtubeService.extractChannelIdFromUrl(channelInput);
      
      if (!channelId) {
        this.showMessage('유효하지 않은 채널 URL입니다.', 'error');
        return;
      }

      // 채널 정보 확인
      const channelInfo = await this.youtubeService.getChannelInfo(channelId);
      if (!channelInfo) {
        this.showMessage('채널을 찾을 수 없습니다.', 'error');
        return;
      }

      // 설정 저장
      const settings: AppSettings = {
        apiKey,
        channelId,
        channelName: channelInfo.title,
        checkInterval,
        lastCheckTime: new Date().toISOString(),
        lastVideoId: '',
        notificationsEnabled
      };

      await StorageService.saveSettings(settings);
      this.settings = settings;

      // 알림 권한 요청
      if (notificationsEnabled) {
        await NotificationService.requestPermission();
      }

      // 백그라운드 스크립트에 설정 전달
      chrome.runtime.sendMessage({ action: 'startMonitoring', settings });

      this.showStatusView();
      this.updateStatusDisplay();
      this.showMessage('설정이 완료되었습니다!', 'success');

      // 설정 완료 알림
      if (notificationsEnabled) {
        await NotificationService.showSetupCompleteNotification(channelInfo.title);
      }

    } catch (error) {
      console.error('Setup error:', error);
      this.showMessage('설정 중 오류가 발생했습니다: ' + (error as Error).message, 'error');
    }
  }

  private async handleLogin(): Promise<void> {
    // if (GOOGLE_CLIENT_ID === 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID') {
    //   this.showMessage('GCP 클라이언트 ID를 설정해주세요.', 'error');
    //   return;
    // }
    try {
      this.showMessage('Google 로그인 중...', 'info');
      const tokens = await AuthService.signIn();
      if (tokens.accessToken) {
        this.showMessage('로그인 완료!', 'success');
        this.showStatusView();
      }
    } catch (e) {
      console.error(e);
      this.showMessage('로그인에 실패했습니다.', 'error');
    }
  }

  private async handleLogout(): Promise<void> {
    try {
      await AuthService.signOut();
      this.showMessage('로그아웃되었습니다.', 'info');
      this.showSetupView();
    } catch (e) {
      console.error(e);
      this.showMessage('로그아웃 중 오류가 발생했습니다.', 'error');
    }
  }

  private async handleTest(): Promise<void> {
    if (!this.youtubeService || !this.settings) {
      this.showMessage('먼저 설정을 완료해주세요.', 'error');
      return;
    }

    try {
      this.showMessage('채널을 확인하는 중...', 'info');
      
      const videos = await this.youtubeService.getLatestVideos(this.settings.channelId, 1);
      
      if (videos.length > 0) {
        const latestVideo = videos[0];
        this.showMessage(`최신 영상: "${latestVideo.title}"`, 'success');
      } else {
        this.showMessage('영상을 찾을 수 없습니다.', 'warning');
      }
    } catch (error) {
      console.error('Test error:', error);
      this.showMessage('테스트 중 오류가 발생했습니다: ' + (error as Error).message, 'error');
    }
  }

  private async handleStop(): Promise<void> {
    try {
      chrome.runtime.sendMessage({ action: 'stopMonitoring' });
      await StorageService.clearSettings();
      this.settings = null;
      this.youtubeService = null;
      this.showSetupView();
      this.showMessage('모니터링이 중지되었습니다.', 'info');
    } catch (error) {
      console.error('Stop error:', error);
      this.showMessage('중지 중 오류가 발생했습니다.', 'error');
    }
  }

  private updateStatusDisplay(): void {
    if (!this.settings || !this.channelNameElement || !this.lastCheckElement) {
      return;
    }

    this.channelNameElement.textContent = this.settings.channelName;
    this.lastCheckElement.textContent = `마지막 체크: ${new Date(this.settings.lastCheckTime).toLocaleString()}`;
  }

  private showMessage(text: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    if (!this.message) return;

    const colors = {
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600'
    };

    this.message.innerHTML = `
      <div class="animate-pulse">
        <p class="${colors[type]} font-semibold text-sm">${text}</p>
      </div>
    `;
  }
}

// 앱 초기화
new PopupApp();
