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
