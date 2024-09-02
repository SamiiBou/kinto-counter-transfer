const API_URL = 'http://localhost:5000/api'; // Make sure this matches your server URL

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  hasWallet?: boolean; 
}

export interface AuthResponse {
  token: string;
  user: User;
}

const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    return response.json();
  },

  
  register: async (firstName: string, lastName: string, email: string, password: string, publicKey: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstName, lastName, email, password, publicKey }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  },

  getCurrentUser: async (token: string): Promise<User> => {
    const response = await fetch(`${API_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return response.json();
  },
  
  associateWallet: async (publicKey: string): Promise<void> => {
    const response = await fetch(`${API_URL}/associate-wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ publicKey })
    });
  
    if (!response.ok) {
      throw new Error('Failed to associate wallet');
    }
  },
};

export default authService;