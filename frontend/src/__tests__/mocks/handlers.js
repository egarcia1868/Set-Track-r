import { rest } from 'msw';

const API_URL = 'http://localhost:4000/api';

export const handlers = [
  // Concert endpoints
  rest.get(`${API_URL}/concerts/user/saved`, (req, res, ctx) => {
    return res(
      ctx.json([
        {
          _id: '1',
          artistId: 'artist-1',
          artistName: 'Test Artist',
          concerts: [
            {
              concertId: 'concert-1',
              venue: { name: 'Test Venue' },
              eventDate: '2024-01-15',
              sets: [],
            },
          ],
        },
      ])
    );
  }),

  rest.post(`${API_URL}/concerts`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'Concert saved successfully',
        user: req.body.user,
      })
    );
  }),

  rest.delete(`${API_URL}/concerts/:artistId/:concertId`, (req, res, ctx) => {
    return res(
      ctx.json({
        message: 'Concert deleted successfully',
      })
    );
  }),

  // User search endpoints
  rest.get(`${API_URL}/users/search`, (req, res, ctx) => {
    const query = req.url.searchParams.get('q');

    if (!query) {
      return res(ctx.json({ users: [] }));
    }

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
  }),

  rest.get(`${API_URL}/users/featured`, (req, res, ctx) => {
    return res(
      ctx.json({
        users: [
          {
            displayName: 'Featured User',
            bio: 'Music enthusiast',
            concertCount: 3,
          },
        ],
      })
    );
  }),

  // User profile endpoint
  rest.get(`${API_URL}/users/profile`, (req, res, ctx) => {
    return res(
      ctx.json({
        profile: {
          displayName: 'Test User',
          bio: 'Test bio',
          isPublic: true,
        },
      })
    );
  }),

  // Concert search endpoint
  rest.get(`${API_URL}/concerts`, (req, res, ctx) => {
    const artistName = req.url.searchParams.get('artistName');
    const date = req.url.searchParams.get('date');
    const cityName = req.url.searchParams.get('cityName');
    const venueName = req.url.searchParams.get('venueName');
    const year = req.url.searchParams.get('year');
    const page = req.url.searchParams.get('p') || '1';

    // Return empty setlist for pagination check
    if (parseInt(page) > 1) {
      return res(ctx.status(404), ctx.json({ error: 'No more results' }));
    }

    return res(
      ctx.json({
        setlist: [
          {
            id: 'concert-1',
            artist: { mbid: 'artist-1', name: artistName || 'Test Artist' },
            venue: {
              name: venueName || 'Test Venue',
              city: {
                name: cityName || 'Test City',
                state: 'TS',
                country: { name: 'Test Country' },
              },
            },
            eventDate: date || '15-01-2024',
            sets: { set: [] },
          },
        ],
      })
    );
  }),

  // Message endpoints
  rest.get(`${API_URL}/messages/conversations`, (req, res, ctx) => {
    return res(ctx.json([]));
  }),

  rest.get(`${API_URL}/messages/:conversationId`, (req, res, ctx) => {
    return res(ctx.json([]));
  }),

  rest.post(`${API_URL}/messages/:conversationId`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        _id: 'msg-1',
        text: req.body.text,
        sender: { profile: { displayName: 'Test User' } },
        createdAt: new Date().toISOString(),
      })
    );
  }),
];
