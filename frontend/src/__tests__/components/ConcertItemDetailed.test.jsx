import { render, screen, fireEvent } from '@testing-library/react';
import ConcertItemDetailed from '../../components/concert/ConcertItemDetailed';

// Mock Auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

// Mock UserConcerts context
jest.mock('../../context/UserConcertsContext', () => ({
  useUserConcerts: () => ({
    isAlreadySaved: jest.fn(() => false),
    addConcertToCollection: jest.fn(),
  }),
}));

describe('ConcertItemDetailed Component', () => {
  const mockConcert = {
    concertId: 'test-123',
    artist: { mbid: 'artist-1', name: 'Test Artist' },
    venue: {
      name: 'Test Venue',
      city: {
        name: 'Test City',
        state: 'TS',
        country: { name: 'Test Country' },
      },
    },
    eventDate: '2024-01-15',
    sets: [
      {
        name: 'Set 1',
        song: [{ name: 'Song 1' }, { name: 'Song 2' }],
      },
      {
        encore: 1,
        song: [{ name: 'Encore Song' }],
      },
    ],
  };

  const mockProps = {
    concert: mockConcert,
    expandedSetlists: new Set(),
    toggleSetlist: jest.fn(),
    handleShowOtherArtists: jest.fn(),
    otherArtistsData: {},
    loadingOtherArtists: {},
    handleRemoveFromMySets: jest.fn(),
    currentArtistName: 'Test Artist',
  };

  it('should render concert information correctly', () => {
    render(<ConcertItemDetailed {...mockProps} />);

    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText(/Test City, TS, Test Country/)).toBeInTheDocument();
  });

  it('should display setlist with correct song count', () => {
    render(<ConcertItemDetailed {...mockProps} />);

    expect(screen.getByText(/Setlist \(3 songs\)/)).toBeInTheDocument();
  });

  it('should call toggleSetlist when toggle button clicked', () => {
    render(<ConcertItemDetailed {...mockProps} />);

    const toggleButton = screen.getByText(/Setlist \(3 songs\)/);
    fireEvent.click(toggleButton);

    expect(mockProps.toggleSetlist).toHaveBeenCalledWith('test-123');
  });

  it('should display set names when expanded', () => {
    const expandedProps = {
      ...mockProps,
      expandedSetlists: new Set(['test-123']),
    };

    render(<ConcertItemDetailed {...expandedProps} />);

    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText(/Encore 1:/)).toBeInTheDocument();
  });

  it('should display songs when setlist expanded', () => {
    const expandedProps = {
      ...mockProps,
      expandedSetlists: new Set(['test-123']),
    };

    render(<ConcertItemDetailed {...expandedProps} />);

    expect(screen.getByText('Song 1')).toBeInTheDocument();
    expect(screen.getByText('Song 2')).toBeInTheDocument();
    expect(screen.getByText('Encore Song')).toBeInTheDocument();
  });

  it('should handle concerts with no setlist', () => {
    const noSetlistProps = {
      ...mockProps,
      concert: { ...mockConcert, sets: [] },
    };

    render(<ConcertItemDetailed {...noSetlistProps} />);

    expect(screen.getByText('Setlist unavailable')).toBeInTheDocument();
  });
});
