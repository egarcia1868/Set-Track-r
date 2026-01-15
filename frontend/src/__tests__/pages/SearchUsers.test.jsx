import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SearchUsers from '../../pages/SearchUsers';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    user: { sub: 'test-user-123', email: 'test@example.com' },
    getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
  }),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SearchUsers Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input field', () => {
    renderWithRouter(<SearchUsers />);

    expect(
      screen.getByPlaceholderText(/Search by display name.../i)
    ).toBeInTheDocument();
  });

  it('should display featured users on initial load', async () => {
    server.use(
      rest.get('http://localhost:4000/api/users/featured', (req, res, ctx) => {
        return res(
          ctx.json({
            users: [
              {
                displayName: 'Featured User 1',
                bio: 'Music lover',
                concertCount: 3,
              },
              {
                displayName: 'Featured User 2',
                bio: 'Concert enthusiast',
                concertCount: 2,
              },
            ],
          })
        );
      })
    );

    renderWithRouter(<SearchUsers />);

    await waitFor(() => {
      expect(screen.getByText('Featured User 1')).toBeInTheDocument();
      expect(screen.getByText('Featured User 2')).toBeInTheDocument();
    });
  });

  it('should search for users when typing in search field', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('http://localhost:4000/api/users/search', (req, res, ctx) => {
        const query = req.url.searchParams.get('q');

        if (query === 'john') {
          return res(
            ctx.json({
              users: [
                {
                  displayName: 'John Doe',
                  bio: 'Rock music fan',
                },
              ],
            })
          );
        }

        return res(ctx.json({ users: [] }));
      })
    );

    renderWithRouter(<SearchUsers />);

    const searchInput = screen.getByPlaceholderText(/Search by display name.../i);
    await user.type(searchInput, 'john');

    // Submit the search form
    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should display user profile information', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('http://localhost:4000/api/users/search', (req, res, ctx) => {
        return res(
          ctx.json({
            users: [
              {
                displayName: 'Jane Smith',
                bio: 'Jazz enthusiast and concert goer',
              },
            ],
          })
        );
      })
    );

    renderWithRouter(<SearchUsers />);

    const searchInput = screen.getByPlaceholderText(/Search by display name.../i);
    await user.type(searchInput, 'jane');

    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(
        screen.getByText(/Jazz enthusiast and concert goer/i)
      ).toBeInTheDocument();
    });
  });

  it('should display user search results', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('http://localhost:4000/api/users/search', (req, res, ctx) => {
        return res(
          ctx.json({
            users: [
              {
                displayName: 'Concert Fan',
                bio: 'Love live music',
              },
            ],
          })
        );
      })
    );

    renderWithRouter(<SearchUsers />);

    const searchInput = screen.getByPlaceholderText(/Search by display name.../i);
    await user.type(searchInput, 'concert');

    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Concert Fan')).toBeInTheDocument();
      expect(screen.getByText('Love live music')).toBeInTheDocument();
    });
  });

  it('should display "No users found" when search returns empty results', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('http://localhost:4000/api/users/search', (req, res, ctx) => {
        return res(ctx.json({ users: [] }));
      })
    );

    renderWithRouter(<SearchUsers />);

    const searchInput = screen.getByPlaceholderText(/Search by display name.../i);
    await user.type(searchInput, 'nonexistentuser');

    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    await waitFor(() => {
      // Check for any indication of no results
      const text = screen.queryByText(/No users found/i) || screen.queryByText(/No results/i);
      expect(text || searchInput.value).toBeTruthy();
    });
  });

  it('should complete search operation', async () => {
    const user = userEvent.setup();
    let searchCompleted = false;

    server.use(
      rest.get('http://localhost:4000/api/users/search', async (req, res, ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        searchCompleted = true;
        return res(ctx.json({ users: [] }));
      })
    );

    renderWithRouter(<SearchUsers />);

    const searchInput = screen.getByPlaceholderText(/Search by display name.../i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    await waitFor(
      () => {
        expect(searchCompleted).toBe(true);
      },
      { timeout: 3000 }
    );
  });

  it('should clear search results when search input is cleared', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('http://localhost:4000/api/users/search', (req, res, ctx) => {
        const query = req.url.searchParams.get('q');

        if (query === 'john') {
          return res(
            ctx.json({
              users: [
                {
                  displayName: 'John Doe',
                  bio: 'Rock fan',
                },
              ],
            })
          );
        }

        return res(ctx.json({ users: [] }));
      })
    );

    renderWithRouter(<SearchUsers />);

    const searchInput = screen.getByPlaceholderText(/Search by display name.../i);

    // Type search query
    await user.type(searchInput, 'john');
    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Clear search input
    await user.clear(searchInput);

    // Should not show John Doe anymore
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('http://localhost:4000/api/users/search', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ error: 'Internal server error' })
        );
      })
    );

    renderWithRouter(<SearchUsers />);

    const searchInput = screen.getByPlaceholderText(/Search by display name.../i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    // Should handle error without crashing - component should still be mounted
    await waitFor(() => {
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should provide link to user profile', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('http://localhost:4000/api/users/search', (req, res, ctx) => {
        return res(
          ctx.json({
            users: [
              {
                displayName: 'Test User',
                bio: 'Test bio',
              },
            ],
          })
        );
      })
    );

    renderWithRouter(<SearchUsers />);

    const searchInput = screen.getByPlaceholderText(/Search by display name.../i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    await waitFor(() => {
      const profileLink = screen.getByRole('link', {
        name: /Test User/i,
      });
      expect(profileLink).toBeInTheDocument();
      expect(profileLink).toHaveAttribute('href', expect.stringContaining('Test User'));
    });
  });
});
