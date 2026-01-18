import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
// For development on Android emulator, use 10.0.2.2
// For iOS simulator, use localhost
// For physical device, use your computer's IP address
export const API_BASE_URL = 'http://10.0.2.2:3000';

const TOKEN_KEY = 'auth_token';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export type DocumentType = 'BELASTING' | 'BOETE' | 'VERZEKERING' | 'ABONNEMENT' | 'OVERIG';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
export type ActionStatus = 'OPEN' | 'DONE';

export type DocumentDTO = {
  id: string;
  originalFilename: string;
  type: DocumentType | null;
  sender: string | null;
  amount: string | null;
  deadline: string | null;
  summary: string | null;
  confidence: number | null;
  createdAt: string;
  job: { status: JobStatus; error: string | null } | null;
  actionItems: ActionItemDTO[];
};

export type ActionItemDTO = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: ActionStatus;
  notes: string | null;
  updatedAt: string;
};

class ApiClient {
  private baseUrl: string;
  private sessionCookie: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setSessionCookie(cookie: string | null) {
    this.sessionCookie = cookie;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Extract and store session cookie from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.sessionCookie = setCookie.split(';')[0];
      await setToken(this.sessionCookie);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async login(email: string, password: string): Promise<{ user: { id: string; email: string } }> {
    // Use credentials provider through NextAuth CSRF flow
    // First, get CSRF token
    const csrfRes = await fetch(`${this.baseUrl}/api/auth/csrf`, {
      credentials: 'include',
    });
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;

    // Store any cookies from CSRF request
    const csrfCookie = csrfRes.headers.get('set-cookie');
    if (csrfCookie) {
      this.sessionCookie = csrfCookie.split(';')[0];
    }

    // Then sign in
    const formData = new URLSearchParams();
    formData.append('csrfToken', csrfToken);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('json', 'true');

    const signInRes = await fetch(`${this.baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(this.sessionCookie ? { Cookie: this.sessionCookie } : {}),
      },
      body: formData.toString(),
      credentials: 'include',
      redirect: 'manual',
    });

    // Check for session cookie in response
    const signInCookie = signInRes.headers.get('set-cookie');
    if (signInCookie) {
      // NextAuth uses session token
      const sessionMatch = signInCookie.match(/next-auth\.session-token=([^;]+)/);
      if (sessionMatch) {
        this.sessionCookie = `next-auth.session-token=${sessionMatch[1]}`;
        await setToken(this.sessionCookie);
      }
    }

    // Verify session
    const sessionRes = await fetch(`${this.baseUrl}/api/auth/session`, {
      headers: this.sessionCookie ? { Cookie: this.sessionCookie } : {},
      credentials: 'include',
    });
    const session = await sessionRes.json();

    if (!session?.user) {
      throw new Error('E-mail of wachtwoord onjuist.');
    }

    return { user: session.user };
  }

  async register(email: string, password: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registratie mislukt');
    }

    return { ok: true };
  }

  async getSession(): Promise<{ user: { id: string; email: string } } | null> {
    try {
      const savedCookie = await getToken();
      if (savedCookie) {
        this.sessionCookie = savedCookie;
      }

      if (!this.sessionCookie) {
        return null;
      }

      const res = await fetch(`${this.baseUrl}/api/auth/session`, {
        headers: { Cookie: this.sessionCookie },
        credentials: 'include',
      });

      const session = await res.json();
      return session?.user ? { user: session.user } : null;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    this.sessionCookie = null;
    await removeToken();
  }

  async getDocuments(params: {
    status?: 'all' | 'open' | 'done';
    type?: string;
    q?: string;
  } = {}): Promise<DocumentDTO[]> {
    const sp = new URLSearchParams();
    if (params.status) sp.set('status', params.status);
    if (params.type) sp.set('type', params.type);
    if (params.q) sp.set('q', params.q);

    const res = await fetch(`${this.baseUrl}/api/documents?${sp.toString()}`, {
      headers: this.sessionCookie ? { Cookie: this.sessionCookie } : {},
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Kon documenten niet laden.');
    }

    const data = await res.json();
    return data.documents;
  }

  async getDocument(id: string): Promise<DocumentDTO> {
    const res = await fetch(`${this.baseUrl}/api/documents/${id}`, {
      headers: this.sessionCookie ? { Cookie: this.sessionCookie } : {},
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Document niet gevonden.');
    }

    return res.json();
  }

  async uploadDocument(uri: string, filename: string, mimeType: string): Promise<{ documentId: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    const res = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        ...(this.sessionCookie ? { Cookie: this.sessionCookie } : {}),
      },
      body: formData,
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Upload mislukt.');
    }

    return data;
  }

  async markActionDone(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/action-items/${id}/done`, {
      method: 'POST',
      headers: this.sessionCookie ? { Cookie: this.sessionCookie } : {},
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Kon niet afronden.');
    }
  }

  async updateAction(
    id: string,
    data: { title?: string; deadline?: string | null; notes?: string | null }
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/action-items/${id}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionCookie ? { Cookie: this.sessionCookie } : {}),
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!res.ok) {
      const resData = await res.json();
      throw new Error(resData.error || 'Opslaan mislukt.');
    }
  }

  async retryDocument(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/documents/${id}/retry`, {
      method: 'POST',
      headers: this.sessionCookie ? { Cookie: this.sessionCookie } : {},
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Retry mislukt.');
    }
  }
}

export const api = new ApiClient(API_BASE_URL);

