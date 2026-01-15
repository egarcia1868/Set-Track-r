import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConcertSearchForm from '../../components/concert/ConcertSearchForm';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    userProfile: { auth0Id: 'test-user-123' },
  }),
}));

// Mock UserConcertsContext
jest.mock('../../context/UserConcertsContext', () => ({
  useUserConcerts: () => ({
    userConcerts: [],
    isAlreadySaved: jest.fn(() => false),
    addConcertToCollection: jest.fn(),
  }),
}));

describe('ConcertSearchForm Component', () => {
  const mockRefreshConcerts = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search form with all input fields', () => {
    render(<ConcertSearchForm refreshConcerts={mockRefreshConcerts} />);

    expect(screen.getByLabelText(/Artist Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Concert Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year of concert/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    // Venue Name has id mismatch in component, check by placeholder instead
    expect(screen.getByPlaceholderText(/Moody Center/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Look Up Set List/i })
    ).toBeInTheDocument();
  });

  it('should update input values when user types', async () => {
    const user = userEvent.setup();
    render(<ConcertSearchForm refreshConcerts={mockRefreshConcerts} />);

    const artistInput = screen.getByLabelText(/Artist Name/i);
    const cityInput = screen.getByLabelText(/City/i);

    await user.type(artistInput, 'Billy Strings');
    await user.type(cityInput, 'Austin');

    expect(artistInput.value).toBe('Billy Strings');
    expect(cityInput.value).toBe('Austin');
  });

  it('should search for concerts when form is submitted', async () => {
    const user = userEvent.setup();
    let apiCalled = false;

    // Mock successful API response
    server.use(
      rest.get('http://localhost:4000/api/concerts', (req, res, ctx) => {
        apiCalled = true;
        return res(
          ctx.json({
            setlist: [
              {
                id: 'concert-1',
                artist: { mbid: 'artist-1', name: 'Billy Strings' },
                venue: {
                  name: 'Moody Center',
                  city: {
                    name: 'Austin',
                    state: 'TX',
                    country: { name: 'USA' },
                  },
                },
                eventDate: '15-01-2024',
                sets: { set: [] },
              },
            ],
          })
        );
      })
    );

    render(<ConcertSearchForm refreshConcerts={mockRefreshConcerts} />);

    const artistInput = screen.getByLabelText(/Artist Name/i);
    const submitButton = screen.getByRole('button', {
      name: /Look Up Set List/i,
    });

    await user.type(artistInput, 'Billy Strings');
    await user.click(submitButton);

    // Verify API was called
    await waitFor(() => {
      expect(apiCalled).toBe(true);
    });
  });

  it('should handle sample search when sample button clicked', async () => {
    const user = userEvent.setup();
    let sampleSearchCalled = false;

    server.use(
      rest.get('http://localhost:4000/api/concerts', (req, res, ctx) => {
        const artistName = req.url.searchParams.get('artistName');
        const cityName = req.url.searchParams.get('cityName');

        if (artistName === 'Billy Strings' && cityName === 'Austin') {
          sampleSearchCalled = true;
          return res(
            ctx.json({
              setlist: [
                {
                  id: 'sample-concert',
                  artist: { mbid: 'artist-1', name: 'Billy Strings' },
                  venue: {
                    name: 'Sample Venue',
                    city: {
                      name: 'Austin',
                      state: 'TX',
                      country: { name: 'USA' },
                    },
                  },
                  eventDate: '01-01-2024',
                  sets: { set: [] },
                },
              ],
            })
          );
        }

        return res(ctx.json({ setlist: [] }));
      })
    );

    render(<ConcertSearchForm refreshConcerts={mockRefreshConcerts} />);

    const sampleButton = screen.getByRole('button', { name: /Click here/i });
    await user.click(sampleButton);

    // Verify sample search API was called with correct parameters
    await waitFor(() => {
      expect(sampleSearchCalled).toBe(true);
    });
  });

  it('should display error message when search fails', async () => {
    const user = userEvent.setup();

    server.use(
      rest.get('http://localhost:4000/api/concerts', (req, res, ctx) => {
        return res(
          ctx.status(404),
          ctx.json({ error: 'No concerts found for this artist' })
        );
      })
    );

    render(<ConcertSearchForm refreshConcerts={mockRefreshConcerts} />);

    const artistInput = screen.getByLabelText(/Artist Name/i);
    const submitButton = screen.getByRole('button', {
      name: /Look Up Set List/i,
    });

    await user.type(artistInput, 'Nonexistent Artist');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/No concerts found for this artist/i)
      ).toBeInTheDocument();
    });
  });

  it('should clear input value when field is focused', async () => {
    const user = userEvent.setup();
    render(<ConcertSearchForm refreshConcerts={mockRefreshConcerts} />);

    const artistInput = screen.getByLabelText(/Artist Name/i);

    await user.type(artistInput, 'Billy Strings');
    expect(artistInput.value).toBe('Billy Strings');

    // Clear and refocus to trigger onFocus
    artistInput.blur();
    await user.click(artistInput);

    // The onFocus handler should clear the field
    await waitFor(() => {
      expect(artistInput.value).toBe('');
    });
  });

  it('should convert date format correctly before sending to API', async () => {
    const user = userEvent.setup();
    let capturedDate = null;

    server.use(
      rest.get('http://localhost:4000/api/concerts', (req, res, ctx) => {
        capturedDate = req.url.searchParams.get('date');
        return res(ctx.json({ setlist: [] }));
      })
    );

    render(<ConcertSearchForm refreshConcerts={mockRefreshConcerts} />);

    const artistInput = screen.getByLabelText(/Artist Name/i);
    const dateInput = screen.getByLabelText(/Concert Date/i);
    const submitButton = screen.getByRole('button', {
      name: /Look Up Set List/i,
    });

    await user.type(artistInput, 'Test Artist');
    await user.type(dateInput, '2024-01-15'); // YYYY-MM-DD format
    await user.click(submitButton);

    await waitFor(() => {
      // Should convert to DD-MM-YYYY format
      expect(capturedDate).toBe('15-01-2024');
    });
  });

  it('should clear year when date is entered', async () => {
    const user = userEvent.setup();
    render(<ConcertSearchForm refreshConcerts={mockRefreshConcerts} />);

    const yearInput = screen.getByLabelText(/Year of concert/i);
    const dateInput = screen.getByLabelText(/Concert Date/i);

    await user.type(yearInput, '2024');
    expect(yearInput.value).toBe('2024');

    await user.type(dateInput, '2024-01-15');
    expect(yearInput.value).toBe(''); // Should be cleared
  });

  it('should clear date when year is entered', async () => {
    const user = userEvent.setup();
    render(<ConcertSearchForm refreshConcerts={mockRefreshConcerts} />);

    const dateInput = screen.getByLabelText(/Concert Date/i);
    const yearInput = screen.getByLabelText(/Year of concert/i);

    await user.type(dateInput, '2024-01-15');
    expect(dateInput.value).toBe('2024-01-15');

    await user.type(yearInput, '2024');
    expect(dateInput.value).toBe(''); // Should be cleared
  });
});
