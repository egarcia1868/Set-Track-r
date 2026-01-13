import request from 'supertest';
import express from 'express';
import User from '../../models/UserModel.js';
import Artist from '../../models/ArtistModel.js';
import { saveConcerts, deleteConcert, getSavedConcerts } from '../../controllers/concertController.js';
import '../setup.js';

// Create a simple Express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.auth = { payload: { sub: 'test-user-123' } };
  next();
};

// Set up test routes
app.post('/api/concerts', saveConcerts);
app.get('/api/concerts/user/saved', mockAuth, getSavedConcerts);
app.delete('/api/concerts/:artistId/:concertId', mockAuth, deleteConcert);

describe('Concert Controller - Add/Remove Operations', () => {
  let testUser;
  let testArtist;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      auth0Id: 'test-user-123',
      artistsSeenLive: [],
      profile: {
        displayName: 'Test User',
        isPublic: false,
      },
    });

    // Create test artist
    testArtist = await Artist.create({
      artistId: 'artist-123',
      artistName: 'Test Artist',
      concerts: [
        {
          concertId: 'concert-123',
          venue: { name: 'Test Venue' },
          eventDate: '2024-01-15',
          sets: [],
        },
      ],
    });
  });

  describe('POST /api/concerts - Save Concert', () => {
    it('should save a concert for a user', async () => {
      const concertData = [
        {
          id: 'concert-123',
          eventDate: '2024-01-15',
          artist: {
            mbid: 'artist-123',
            name: 'Test Artist',
          },
          venue: { name: 'Test Venue' },
          sets: { set: [] },
          url: 'http://example.com',
        },
      ];

      const payload = {
        concertData,
        user: {
          sub: 'test-user-123',
        },
      };

      const response = await request(app)
        .post('/api/concerts')
        .send(payload)
        .expect(201);

      expect(response.body.message).toContain('successfully');
      expect(response.body.user).toBeDefined();

      // Verify in database
      const updatedUser = await User.findOne({ auth0Id: 'test-user-123' });
      expect(updatedUser.artistsSeenLive).toHaveLength(1);
      expect(updatedUser.artistsSeenLive[0].artistId).toBe('artist-123');
      expect(updatedUser.artistsSeenLive[0].concerts).toContain('concert-123');
    });
  });

  describe('GET /api/concerts/user/saved - Get Saved Concerts', () => {
    beforeEach(async () => {
      // Add concert to user's collection
      testUser.artistsSeenLive.push({
        artistId: 'artist-123',
        artistName: 'Test Artist',
        concerts: ['concert-123'],
      });
      await testUser.save();
    });

    it('should retrieve all saved concerts for authenticated user', async () => {
      const response = await request(app)
        .get('/api/concerts/user/saved')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].artistId).toBe('artist-123');
    });
  });

  describe('DELETE /api/concerts/:artistId/:concertId - Remove Concert', () => {
    beforeEach(async () => {
      // Add concert to user's collection
      testUser.artistsSeenLive.push({
        artistId: 'artist-123',
        artistName: 'Test Artist',
        concerts: ['concert-123'],
      });
      await testUser.save();
    });

    it('should remove a concert from user collection', async () => {
      const response = await request(app)
        .delete('/api/concerts/artist-123/concert-123')
        .expect(200);

      expect(response.body.message).toContain('successfully');

      // Verify in database
      const updatedUser = await User.findOne({ auth0Id: 'test-user-123' });
      const artistEntry = updatedUser.artistsSeenLive.find(
        (entry) => entry.artistId === 'artist-123'
      );

      // Artist entry should be removed entirely since no concerts remain
      expect(artistEntry).toBeUndefined();
    });

    it('should return 404 for non-existent artist', async () => {
      const response = await request(app)
        .delete('/api/concerts/non-existent/concert-123')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });
});
