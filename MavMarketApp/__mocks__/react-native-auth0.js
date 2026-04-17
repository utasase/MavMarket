export const useAuth0 = jest.fn(() => ({
  authorize: jest.fn(),
  clearSession: jest.fn(),
  user: null,
  isLoading: false,
  getCredentials: jest.fn(),
}));

export const Auth0Provider = ({ children }) => children;
