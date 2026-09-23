/**
 * SkillSwap Campus — API Client
 * Handles all communication with the Node.js/Express backend
 */

const API_BASE = `${window.location.origin}/api/v1`;
let refreshInFlight = null;

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('ssc-access-token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { error: await response.text() || `Server error: ${response.status}` };

      if (!response.ok) {
        // Never attempt to refresh a failed refresh request; doing so causes
        // recursive retries and makes an otherwise recoverable session look
        // like a forced logout.
        if (response.status === 401 && endpoint !== '/auth/refresh' && localStorage.getItem('ssc-refresh-token')) {
          const refreshed = await this.refreshTokens();
          if (refreshed) {
            return this.request(endpoint, options);
          }
        }
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      return data;
    } catch (err) {
      if (err instanceof TypeError && /failed to fetch/i.test(err.message)) {
        throw new Error('Cannot connect to server. Make sure your backend is running on http://localhost:4000');
      }
      throw err;
    }
  },

  // --- Auth ---
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async verifyEmail(token) {
    const data = await this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    localStorage.setItem('ssc-access-token', data.accessToken);
    localStorage.setItem('ssc-refresh-token', data.refreshToken);
    const user = await this.getMe();
    localStorage.setItem('ssc-user', JSON.stringify(user));
    return data;
  },

  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    localStorage.setItem('ssc-access-token', data.accessToken);
    localStorage.setItem('ssc-refresh-token', data.refreshToken);
    localStorage.setItem('ssc-user', JSON.stringify(data.user));
    return data;
  },

  async refreshTokens() {
    // Several protected requests can finish at once while a page changes.
    // Share one rotation so a second request cannot revoke the token the first
    // request has just refreshed.
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      try {
        const refreshToken = localStorage.getItem('ssc-refresh-token');
        if (!refreshToken) return false;

        const data = await this.request('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
        localStorage.setItem('ssc-access-token', data.accessToken);
        localStorage.setItem('ssc-refresh-token', data.refreshToken);
        return true;
      } catch (err) {
        const message = String(err?.message || '');
        // Only clear a session when the server explicitly rejects its refresh
        // token. Network/database failures should keep the user signed in.
        if (/invalid refresh token|revoked or expired|refresh token required/i.test(message)) {
          this.logout();
          return false;
        }
        throw err;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  },

  logout() {
    localStorage.removeItem('ssc-access-token');
    localStorage.removeItem('ssc-refresh-token');
    localStorage.removeItem('ssc-user');
    window.location.hash = '#/login';
  },

  // --- Users & Skills ---
  async getMe() {
    return this.request('/users/me');
  },

  async getUser(id) {
    return this.request(`/users/${id}`);
  },

  async getMatches() {
    return this.request('/matches');
  },

  async updateProfile(data) {
    const user = await this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    localStorage.setItem('ssc-user', JSON.stringify(user));
    return user;
  },

  // --- Swaps & Sessions ---
  async createSwap(swapData) {
    return this.request('/swaps', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  },

  async getMySwaps() {
    return this.request('/swaps');
  },

  async updateSwapStatus(id, status) {
    return this.request(`/swaps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getSessions() {
    return this.request('/sessions');
  },

  async updateSessionStatus(id, status) {
    return this.request(`/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getMessages(swapId) {
    return this.request(`/messages/swaps/${swapId}/messages`);
  },

  async sendMessage(swapId, content) {
    return this.request(`/messages/swaps/${swapId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async getCourses(query) {
    return this.request(`/courses?q=${encodeURIComponent(query)}`);
  },
};

window.api = api;
