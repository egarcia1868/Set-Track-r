import request from 'supertest';
import express from 'express';
import User from '../../models/UserModel.js';
import { searchUsers, getFeaturedUsers } from '../../controllers/concertController.js';
import '../setup.js';

// Create a simple Express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.auth = { payload: { sub: 'test-user-123' } };
  next();
};

// Set up test routes with auth middleware
app.get('/api/users/search', mockAuth, searchUsers);
app.get('/api/users/featured', mockAuth, getFeaturedUsers);

describe('Search Controller - User Search', () => {
  beforeEach(async () => {
    // Create test users with various profiles
    await User.create([
      {
        auth0Id: 'user-1',
        profile: {
          displayName: 'John Doe',
          bio: 'Rock music fan',
          isPublic: true,
        },
        artistsSeenLive: [
          {
            artistId: 'artist-1',
            artistName: 'Artist One',
            concerts: ['concert-1', 'concert-2'],
          },
        ],
      },
      {
        auth0Id: 'user-2',
        profile: {
          displayName: 'Jane Smith',
          bio: 'Jazz enthusiast',
          isPublic: true,
        },
        artistsSeenLive: [
          {
            artistId: 'artist-2',
            artistName: 'Artist Two',
            concerts: ['concert-3'],
          },
        ],
      },
      {
        auth0Id: 'user-3',
        profile: {
          displayName: 'Johnny Walker',
          bio: 'Metal head',
          isPublic: false, // Private profile
        },
        artistsSeenLive: [
          {
            artistId: 'artist-3',
            artistName: 'Artist Three',
            concerts: ['concert-4'],
          },
        ],
      },
      {
        auth0Id: 'user-4',
        profile: {
          displayName: 'Bob Johnson',
          bio: 'Country music lover',
          isPublic: true,
        },
        artistsSeenLive: [
          {
            artistId: 'artist-4',
            artistName: 'Artist Four',
            concerts: ['concert-5', 'concert-6', 'concert-7'],
          },
        ],
      },
    ]);
  });

  describe('GET /api/users/search', () => {
    it('should search users by display name (case-insensitive)', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'john' })
        .expect(200);

      // Should only return public profiles (Johnny Walker is private)
      expect(response.body.users).toHaveLength(2);
      const displayNames = response.body.users.map((u) => u.displayName);
      expect(displayNames).toContain('John Doe');
      expect(displayNames).toContain('Bob Johnson');
    });

    it('should return partial matches', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'doe' })
        .expect(200);

      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].displayName).toBe('John Doe');
    });

    it('should only return public profiles', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'john' })
        .expect(200);

      // Should find John Doe (public) and Bob Johnson (public)
      // but not Johnny Walker (private)
      expect(response.body.users).toHaveLength(2);
      const displayNames = response.body.users.map((u) => u.displayName);
      expect(displayNames).not.toContain('Johnny Walker');
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'nonexistent' })
        .expect(200);

      expect(response.body.users).toHaveLength(0);
    });

    it('should handle empty query parameter', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: '' })
        .expect(200);

      // Should return all public users or empty array depending on implementation
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should handle missing query parameter', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .expect(200);

      // Returns empty array when query is missing
      expect(response.body.users).toEqual([]);
    });

    it('should return users with displayName and bio', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .query({ q: 'jane' })
        .expect(200);

      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].displayName).toBe('Jane Smith');
      expect(response.body.users[0].bio).toBe('Jazz enthusiast');
      // Note: artistsSeenLive is not returned by searchUsers
    });
  });

  describe('GET /api/users/featured', () => {
    it('should retrieve featured users', async () => {
      const response = await request(app)
        .get('/api/users/featured')
        .expect(200);

      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should return users with displayName and bio', async () => {
      const response = await request(app)
        .get('/api/users/featured')
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users[0].displayName).toBeDefined();
      expect(response.body.users[0].bio).toBeDefined();
    });

    it('should return users sorted by concert count', async () => {
      const response = await request(app)
        .get('/api/users/featured')
        .expect(200);

      // Featured users are sorted by concert count in descending order
      if (response.body.users.length > 1) {
        const firstUserCount = response.body.users[0].concertCount || 0;
        const lastUserCount =
          response.body.users[response.body.users.length - 1].concertCount || 0;

        // First user should have more or equal concerts than the last
        expect(firstUserCount).toBeGreaterThanOrEqual(lastUserCount);
      }
    });

    it('should only return public profiles', async () => {
      const response = await request(app)
        .get('/api/users/featured')
        .expect(200);

      // All returned users should be public (Johnny Walker should not appear)
      const displayNames = response.body.users.map((u) => u.displayName);
      expect(displayNames).not.toContain('Johnny Walker');
    });
  });
});
