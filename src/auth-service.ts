// 환경변수 타입 정의
declare const process: {
  env: {
    GOOGLE_CLIENT_ID?: string;
  };
};

export type OAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
};

const OAUTH_STORAGE_KEY = 'googleOauthTokens';

// 환경변수에서 클라이언트 ID를 가져옵니다
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'Google Client ID'

const OAUTH_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const OAUTH_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'openid',
  'email',
  'profile'
];

export class AuthService {
  static async signIn(scopes: string[] = DEFAULT_SCOPES): Promise<OAuthTokens> {
    const redirectUri = chrome.identity.getRedirectURL();
    
    // Chrome 확장에서는 PKCE 대신 간단한 방식 사용
    const authUrl = new URL(OAUTH_AUTH_ENDPOINT);
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'token'); // code 대신 token 사용
    authUrl.searchParams.set('scope', scopes.join(' '));
    // access_type=offline은 Implicit Flow에서 사용할 수 없음
    authUrl.searchParams.set('prompt', 'consent');

    console.log('Auth URL:', authUrl.toString());
    console.log('Redirect URI:', redirectUri);

    const redirectResponse = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true
    });

    console.log('Redirect response:', redirectResponse);

    // URL에서 access_token 추출
    const tokens = this.extractTokensFromUrl(redirectResponse ?? "");
    
    await this.saveTokens(tokens);
    return tokens;
  }

  static async signOut(): Promise<void> {
    await chrome.storage.local.remove(OAUTH_STORAGE_KEY);
  }

  static async getValidAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    if (!tokens) return null;
    if (Date.now() < tokens.expiresAt - 30_000) {
      return tokens.accessToken;
    }
    const refreshed = await this.tryRefresh(tokens);
    return refreshed?.accessToken ?? null;
  }

  private static async tryRefresh(tokens: OAuthTokens): Promise<OAuthTokens | null> {
    if (!tokens.refreshToken) return null;
    const resp = await fetch(OAUTH_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken
      }).toString()
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    const updated: OAuthTokens = {
      accessToken: json.access_token,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + (json.expires_in || 3600) * 1000
    };
    await this.saveTokens(updated);
    return updated;
  }

  private static extractTokensFromUrl(redirectUrl: string): OAuthTokens {
    const url = new URL(redirectUrl);
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');
    const expiresIn = url.searchParams.get('expires_in');
    
    if (!accessToken) {
      throw new Error('Access token not found in redirect URL');
    }
    
    const expiresAt = Date.now() + (parseInt(expiresIn || '3600') * 1000);
    
    return {
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt
    };
  }

  private static async saveTokens(tokens: OAuthTokens): Promise<void> {
    await chrome.storage.local.set({ [OAUTH_STORAGE_KEY]: tokens });
  }

  static async getTokens(): Promise<OAuthTokens | null> {
    const res = await chrome.storage.local.get(OAUTH_STORAGE_KEY);
    return (res[OAUTH_STORAGE_KEY] as OAuthTokens) || null;
  }

}


