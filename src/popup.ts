import './styles.css';

class PopupApp {
  private button: HTMLButtonElement | null;
  private message: HTMLElement | null;

  constructor() {
    this.button = null;
    this.message = null;
    this.init();
  }

  private init(): void {
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeElements();
      this.attachEventListeners();
    });
  }

  private initializeElements(): void {
    this.button = document.getElementById('clickMe') as HTMLButtonElement;
    this.message = document.getElementById('message') as HTMLElement;
  }

  private attachEventListeners(): void {
    if (this.button) {
      this.button.addEventListener('click', this.handleButtonClick.bind(this));
    }
  }

  private handleButtonClick(): void {
    if (!this.message) return;

    const messages = [
      '버튼을 클릭했습니다! 🎉',
      '훌륭합니다! 👏',
      '잘했어요! ✨',
      '멋져요! 🚀',
      '완벽합니다! 💯'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    this.message.innerHTML = `
      <div class="animate-pulse">
        <p class="text-green-600 font-semibold text-sm">${randomMessage}</p>
        <p class="text-xs text-gray-500 mt-1">클릭 횟수: ${this.getClickCount()}</p>
      </div>
    `;
  }

  private getClickCount(): number {
    const count = localStorage.getItem('clickCount');
    const newCount = count ? parseInt(count) + 1 : 1;
    localStorage.setItem('clickCount', newCount.toString());
    return newCount;
  }
}

// 앱 초기화
new PopupApp();
