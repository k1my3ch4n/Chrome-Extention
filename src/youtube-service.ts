export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: string;
}

export interface YouTubeSubscription {
  id: string;
  channelId: string;
  channelTitle: string;
  channelDescription: string;
  thumbnailUrl: string;
  publishedAt: string;
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * OAuth 토큰을 사용하여 사용자의 구독 목록을 가져옵니다
   */
  static async getSubscriptions(accessToken: string, maxResults: number = 50): Promise<YouTubeSubscription[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items) {
        return [];
      }

      return data.items.map((item: any) => ({
        id: item.id,
        channelId: item.snippet.resourceId.channelId,
        channelTitle: item.snippet.title,
        channelDescription: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt
      }));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  /**
   * 채널 ID로 채널 정보를 가져옵니다
   */
  async getChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnailUrl: channel.snippet.thumbnails.medium.url,
          subscriberCount: channel.statistics.subscriberCount
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching channel info:', error);
      throw error;
    }
  }

  /**
   * 채널의 최신 영상들을 가져옵니다
   */
  async getLatestVideos(channelId: string, maxResults: number = 5): Promise<YouTubeVideo[]> {
    try {
      // 먼저 채널의 업로드 플레이리스트 ID를 가져옵니다
      const channelResponse = await fetch(
        `${this.baseUrl}/channels?part=contentDetails&id=${channelId}&key=${this.apiKey}`
      );
      
      if (!channelResponse.ok) {
        throw new Error(`HTTP error! status: ${channelResponse.status}`);
      }

      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('Channel not found');
      }

      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

      // 업로드 플레이리스트에서 최신 영상들을 가져옵니다
      const videosResponse = await fetch(
        `${this.baseUrl}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${this.apiKey}`
      );

      if (!videosResponse.ok) {
        throw new Error(`HTTP error! status: ${videosResponse.status}`);
      }

      const videosData = await videosResponse.json();
      
      if (!videosData.items) {
        return [];
      }

      return videosData.items.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
      }));
    } catch (error) {
      console.error('Error fetching latest videos:', error);
      throw error;
    }
  }

  /**
   * 채널명으로 채널 ID를 검색합니다
   */
  async searchChannelByUsername(username: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=id&forUsername=${username}&key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return data.items[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('Error searching channel:', error);
      throw error;
    }
  }

  /**
   * 채널 URL에서 채널 ID를 추출합니다
   */
  extractChannelIdFromUrl(url: string): string | null {
    // @username 형태의 URL에서 username 추출
    const usernameMatch = url.match(/@([^/?]+)/);
    if (usernameMatch) {
      return usernameMatch[1];
    }

    // channel/UC... 형태의 URL에서 채널 ID 추출
    const channelIdMatch = url.match(/channel\/([^/?]+)/);
    if (channelIdMatch) {
      return channelIdMatch[1];
    }

    return null;
  }
}
