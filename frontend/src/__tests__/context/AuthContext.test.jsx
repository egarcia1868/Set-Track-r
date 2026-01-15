import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Mock Auth0
const mockGetAccessTokenSilently = jest.fn();
const mockUseAuth0 = jest.fn();

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessTokenSilently.mockResolvedValue('mock-token');
  });

  describe('Provider Setup', () => {
    it('should provide authentication context', () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'auth0|123', email: 'test@example.com' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        sub: 'auth0|123',
        email: 'test@example.com',
      });
    });

    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Authentication State', () => {
    it('should indicate when user is authenticated', () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'test-user' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should indicate when user is not authenticated', () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: false,
        user: null,
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should expose loading state', () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: false,
        user: null,
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: true,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('User Profile Fetching', () => {
    it('should fetch user profile when authenticated', async () => {
      server.use(
        rest.get('http://localhost:4000/api/users/profile', (req, res, ctx) => {
          return res(
            ctx.json({
              profile: {
                displayName: 'Test User',
                bio: 'Test bio',
                isPublic: true,
              },
            })
          );
        })
      );

      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'auth0|123', email: 'test@example.com' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.userProfile).not.toBeNull();
          expect(result.current.userProfile?.displayName).toBe('Test User');
        },
        { timeout: 3000 }
      );

      expect(result.current.userProfile.bio).toBe('Test bio');
    });

    it('should not fetch profile when not authenticated', async () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: false,
        user: null,
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.userProfile).toBeNull();
      expect(mockGetAccessTokenSilently).not.toHaveBeenCalled();
    });

    it('should handle profile fetch errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        rest.get('http://localhost:4000/api/users/profile', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'auth0|123' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userProfile).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should use access token when fetching profile', async () => {
      let capturedToken = null;

      server.use(
        rest.get('http://localhost:4000/api/users/profile', (req, res, ctx) => {
          capturedToken = req.headers.get('Authorization');
          return res(
            ctx.json({
              profile: {
                displayName: 'Test User',
              },
            })
          );
        })
      );

      mockGetAccessTokenSilently.mockResolvedValue('test-access-token-123');
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'auth0|123' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(capturedToken).toBe('Bearer test-access-token-123');
      });
    });
  });

  describe('Profile Refresh', () => {
    it('should provide fetchUserProfile function', () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'test-user' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.fetchUserProfile).toBe('function');
    });

    it('should allow manual profile refresh', async () => {
      let fetchCount = 0;
      let responseDisplayName = 'Initial User';

      server.use(
        rest.get('http://localhost:4000/api/users/profile', (req, res, ctx) => {
          fetchCount++;
          return res(
            ctx.json({
              profile: {
                displayName: responseDisplayName,
              },
            })
          );
        })
      );

      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'auth0|123' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial fetch
      await waitFor(
        () => {
          expect(result.current.userProfile).not.toBeNull();
          expect(result.current.userProfile?.displayName).toBe('Initial User');
        },
        { timeout: 3000 }
      );

      const initialFetchCount = fetchCount;

      // Change the response for manual refresh
      responseDisplayName = 'Refreshed User';

      // Manual refresh
      await act(async () => {
        await result.current.fetchUserProfile();
      });

      await waitFor(
        () => {
          expect(result.current.userProfile?.displayName).toBe('Refreshed User');
          expect(fetchCount).toBeGreaterThan(initialFetchCount);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Logout Behavior', () => {
    it('should clear user profile on logout', async () => {
      server.use(
        rest.get('http://localhost:4000/api/users/profile', (req, res, ctx) => {
          return res(
            ctx.json({
              profile: {
                displayName: 'Test User',
              },
            })
          );
        })
      );

      // Start authenticated
      const initialAuth = {
        isAuthenticated: true,
        user: { sub: 'auth0|123' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      };

      mockUseAuth0.mockReturnValue(initialAuth);

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      // Wait for profile to load
      await waitFor(() => {
        expect(result.current.userProfile).not.toBeNull();
        expect(result.current.userProfile?.displayName).toBe('Test User');
      });

      // Simulate logout
      mockUseAuth0.mockReturnValue({
        isAuthenticated: false,
        user: null,
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      rerender();

      // Profile should be cleared
      await waitFor(() => {
        expect(result.current.userProfile).toBeNull();
      });
    });
  });

  describe('Token Management', () => {
    it('should expose getAccessTokenSilently function', () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'test-user' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.getAccessTokenSilently).toBe(
        mockGetAccessTokenSilently
      );
    });

    it('should handle token fetch failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockGetAccessTokenSilently.mockRejectedValue(
        new Error('Failed to get token')
      );

      server.use(
        rest.get('http://localhost:4000/api/users/profile', (req, res, ctx) => {
          return res(ctx.status(401));
        })
      );

      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'auth0|123' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle error gracefully
      expect(result.current.userProfile).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('User Object', () => {
    it('should expose user object from Auth0', () => {
      const mockUser = {
        sub: 'auth0|user-123',
        email: 'user@example.com',
        email_verified: true,
        name: 'John Doe',
        picture: 'https://example.com/photo.jpg',
      };

      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle user object with minimal claims', () => {
      const minimalUser = {
        sub: 'auth0|minimal',
      };

      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: minimalUser,
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user.sub).toBe('auth0|minimal');
    });
  });

  describe('Loading States', () => {
    it('should combine Auth0 loading and profile loading states', async () => {
      // Start with Auth0 loading
      mockUseAuth0.mockReturnValue({
        isAuthenticated: false,
        user: null,
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: true,
      });

      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      // Auth0 finishes loading, now authenticated
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        user: { sub: 'auth0|123' },
        getAccessTokenSilently: mockGetAccessTokenSilently,
        isLoading: false,
      });

      server.use(
        rest.get('http://localhost:4000/api/users/profile', async (req, res, ctx) => {
          // Simulate slow profile fetch
          await new Promise((resolve) => setTimeout(resolve, 100));
          return res(
            ctx.json({
              profile: { displayName: 'Test User' },
            })
          );
        })
      );

      rerender();

      // Should still be loading while profile fetches
      expect(result.current.isLoading).toBe(true);

      // Wait for profile to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
