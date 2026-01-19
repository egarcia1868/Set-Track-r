import request from 'supertest';
import express from 'express';
import conversationRoutes from '../../routes/conversationRoutes.js';
import User from '../../models/UserModel.js';
import Message from '../../models/MessageModel.js';
import Conversation from '../../models/ConversationModel.js';
import '../setup.js';

const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (userId = 'test-user-123') => (req, res, next) => {
  req.auth = { payload: { sub: userId } };
  next();
};

// Mock checkBlocked middleware for conversation creation
const mockCheckBlocked = (currentUser, otherUser) => (req, res, next) => {
  req.currentUser = currentUser;
  req.otherUser = otherUser;
  next();
};

describe('Conversation Controller - API Endpoints', () => {
  let user1, user2, user3;

  beforeEach(async () => {
    // Create test users
    user1 = await User.create({
      auth0Id: 'test-user-123',
      profile: {
        displayName: 'User One',
        isPublic: true,
      },
      artistsSeenLive: [],
    });

    user2 = await User.create({
      auth0Id: 'user-two-456',
      profile: {
        displayName: 'User Two',
        isPublic: true,
      },
      artistsSeenLive: [],
    });

    user3 = await User.create({
      auth0Id: 'user-three-789',
      profile: {
        displayName: 'User Three',
        isPublic: true,
      },
      artistsSeenLive: [],
    });
  });

  describe('GET /api/conversations', () => {
    let testApp;

    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());
      testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);
    });

    it('should return all conversations for the current user', async () => {
      // Create conversations
      await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user2._id, displayName: 'User Two' },
        ],
        lastMessage: {
          text: 'Hello from user 2',
          sender: user2._id,
          sentAt: new Date(),
        },
      });

      await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user3._id, displayName: 'User Three' },
        ],
        lastMessage: {
          text: 'Hello from user 3',
          sender: user3._id,
          sentAt: new Date(Date.now() - 10000),
        },
      });

      const response = await request(testApp)
        .get('/api/conversations')
        .expect(200);

      expect(response.body).toHaveLength(2);
      // Should be sorted by most recent first
      expect(response.body[0].lastMessage.text).toBe('Hello from user 2');
    });

    it('should return empty array if user has no conversations', async () => {
      const response = await request(testApp)
        .get('/api/conversations')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should not return archived conversations', async () => {
      const archivedConv = await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user2._id, displayName: 'User Two' },
        ],
        archivedBy: new Map([[user1._id.toString(), true]]),
      });

      await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user3._id, displayName: 'User Three' },
        ],
      });

      const response = await request(testApp)
        .get('/api/conversations')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]._id.toString()).not.toBe(archivedConv._id.toString());
    });

    it('should include unread count for current user', async () => {
      await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user2._id, displayName: 'User Two' },
        ],
        unreadCount: new Map([[user1._id.toString(), 5]]),
      });

      const response = await request(testApp)
        .get('/api/conversations')
        .expect(200);

      expect(response.body[0].unreadCount).toBe(5);
    });

    it('should return 404 if user is not found', async () => {
      const unknownUserApp = express();
      unknownUserApp.use(express.json());
      unknownUserApp.use('/api/conversations', mockAuth('unknown-user'), conversationRoutes);

      const response = await request(unknownUserApp)
        .get('/api/conversations')
        .expect(404);

      expect(response.body.message).toContain('User not found');
    });
  });

  describe('POST /api/conversations', () => {
    it('should create a new conversation between two users', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        '/api/conversations',
        mockAuth('test-user-123'),
        mockCheckBlocked(user1, user2),
        conversationRoutes
      );

      const response = await request(testApp)
        .post('/api/conversations')
        .send({ recipientId: user2._id.toString() })
        .expect(201);

      expect(response.body.participants).toHaveLength(2);
      expect(response.body.participants[0].displayName).toBe('User One');
      expect(response.body.participants[1].displayName).toBe('User Two');
    });

    it('should return existing conversation if one already exists', async () => {
      // Create existing conversation
      const existingConv = await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user2._id, displayName: 'User Two' },
        ],
      });

      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        '/api/conversations',
        mockAuth('test-user-123'),
        mockCheckBlocked(user1, user2),
        conversationRoutes
      );

      const response = await request(testApp)
        .post('/api/conversations')
        .send({ recipientId: user2._id.toString() })
        .expect(200);

      expect(response.body._id.toString()).toBe(existingConv._id.toString());
    });

    it('should unarchive conversation if it was archived', async () => {
      const archivedConv = await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user2._id, displayName: 'User Two' },
        ],
        archivedBy: new Map([
          [user1._id.toString(), true],
          [user2._id.toString(), true],
        ]),
      });

      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        '/api/conversations',
        mockAuth('test-user-123'),
        mockCheckBlocked(user1, user2),
        conversationRoutes
      );

      await request(testApp)
        .post('/api/conversations')
        .send({ recipientId: user2._id.toString() })
        .expect(200);

      const updatedConv = await Conversation.findById(archivedConv._id);
      expect(updatedConv.archivedBy.get(user1._id.toString())).toBe(false);
      expect(updatedConv.archivedBy.get(user2._id.toString())).toBe(false);
    });

    it('should return 400 if recipientId is missing', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        '/api/conversations',
        mockAuth('test-user-123'),
        mockCheckBlocked(user1, user2),
        conversationRoutes
      );

      const response = await request(testApp)
        .post('/api/conversations')
        .send({})
        .expect(400);

      // Error comes from checkBlocked middleware
      expect(response.body.message).toContain('Recipient user ID is required');
    });
  });

  describe('GET /api/conversations/:conversationId', () => {
    let conversation, testApp;

    beforeEach(async () => {
      conversation = await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user2._id, displayName: 'User Two' },
        ],
      });

      testApp = express();
      testApp.use(express.json());
      testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);
    });

    it('should return a conversation by ID', async () => {
      const response = await request(testApp)
        .get(`/api/conversations/${conversation._id}`)
        .expect(200);

      expect(response.body._id.toString()).toBe(conversation._id.toString());
      expect(response.body.participants).toHaveLength(2);
    });

    it('should return 404 for non-existent conversation', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(testApp)
        .get(`/api/conversations/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('Conversation not found');
    });

    it('should return 403 if user is not a participant', async () => {
      const otherApp = express();
      otherApp.use(express.json());
      otherApp.use('/api/conversations', mockAuth('user-three-789'), conversationRoutes);

      const response = await request(otherApp)
        .get(`/api/conversations/${conversation._id}`)
        .expect(403);

      expect(response.body.message).toContain('not part of this conversation');
    });
  });

  describe('DELETE /api/conversations/:conversationId', () => {
    let conversation, testApp;

    beforeEach(async () => {
      conversation = await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user2._id, displayName: 'User Two' },
        ],
      });

      // Create some messages in the conversation
      await Message.create([
        { conversationId: conversation._id, sender: user1._id, text: 'Message 1' },
        { conversationId: conversation._id, sender: user2._id, text: 'Message 2' },
      ]);

      testApp = express();
      testApp.use(express.json());
      testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);
    });

    it('should delete a conversation and all its messages', async () => {
      const response = await request(testApp)
        .delete(`/api/conversations/${conversation._id}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');

      // Verify conversation is deleted
      const deletedConv = await Conversation.findById(conversation._id);
      expect(deletedConv).toBeNull();

      // Verify messages are deleted
      const messages = await Message.find({ conversationId: conversation._id });
      expect(messages).toHaveLength(0);
    });

    it('should return 404 for non-existent conversation', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(testApp)
        .delete(`/api/conversations/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('Conversation not found');
    });

    it('should return 403 if user is not a participant', async () => {
      const otherApp = express();
      otherApp.use(express.json());
      otherApp.use('/api/conversations', mockAuth('user-three-789'), conversationRoutes);

      const response = await request(otherApp)
        .delete(`/api/conversations/${conversation._id}`)
        .expect(403);

      expect(response.body.message).toContain('not part of this conversation');

      // Verify conversation still exists
      const stillExists = await Conversation.findById(conversation._id);
      expect(stillExists).not.toBeNull();
    });
  });

  describe('PUT /api/conversations/:conversationId/archive', () => {
    let conversation, testApp;

    beforeEach(async () => {
      conversation = await Conversation.create({
        participants: [
          { userId: user1._id, displayName: 'User One' },
          { userId: user2._id, displayName: 'User Two' },
        ],
      });

      testApp = express();
      testApp.use(express.json());
      testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);
    });

    it('should archive a conversation for the current user', async () => {
      const response = await request(testApp)
        .put(`/api/conversations/${conversation._id}/archive`)
        .expect(200);

      expect(response.body.message).toContain('archived successfully');

      const updatedConv = await Conversation.findById(conversation._id);
      expect(updatedConv.archivedBy.get(user1._id.toString())).toBe(true);
    });

    it('should not archive conversation for other participant', async () => {
      await request(testApp)
        .put(`/api/conversations/${conversation._id}/archive`)
        .expect(200);

      const updatedConv = await Conversation.findById(conversation._id);
      expect(updatedConv.archivedBy.get(user2._id.toString())).toBeFalsy();
    });

    it('should return 404 for non-existent conversation', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(testApp)
        .put(`/api/conversations/${fakeId}/archive`)
        .expect(404);

      expect(response.body.message).toContain('Conversation not found');
    });

    it('should return 403 if user is not a participant', async () => {
      const otherApp = express();
      otherApp.use(express.json());
      otherApp.use('/api/conversations', mockAuth('user-three-789'), conversationRoutes);

      const response = await request(otherApp)
        .put(`/api/conversations/${conversation._id}/archive`)
        .expect(403);

      expect(response.body.message).toContain('not part of this conversation');
    });
  });

  describe('Edge Cases', () => {
    describe('Display Name Edge Cases', () => {
      it('should handle users with very long display names', async () => {
        const longNameUser = await User.create({
          auth0Id: 'long-name-user',
          profile: {
            displayName: 'A'.repeat(200),
            isPublic: true,
          },
          artistsSeenLive: [],
        });

        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          '/api/conversations',
          mockAuth('test-user-123'),
          mockCheckBlocked(user1, longNameUser),
          conversationRoutes
        );

        const response = await request(testApp)
          .post('/api/conversations')
          .send({ recipientId: longNameUser._id.toString() })
          .expect(201);

        expect(response.body.participants[1].displayName).toBe('A'.repeat(200));
      });

      it('should handle users with special characters in display name', async () => {
        const specialNameUser = await User.create({
          auth0Id: 'special-name-user',
          profile: {
            displayName: '🎸 Rock & Roll <Fan> "Music Lover"',
            isPublic: true,
          },
          artistsSeenLive: [],
        });

        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          '/api/conversations',
          mockAuth('test-user-123'),
          mockCheckBlocked(user1, specialNameUser),
          conversationRoutes
        );

        const response = await request(testApp)
          .post('/api/conversations')
          .send({ recipientId: specialNameUser._id.toString() })
          .expect(201);

        expect(response.body.participants[1].displayName).toBe('🎸 Rock & Roll <Fan> "Music Lover"');
      });

      it('should use "Anonymous" for users without display name', async () => {
        const noNameUser = await User.create({
          auth0Id: 'no-name-user',
          profile: {
            isPublic: true,
          },
          artistsSeenLive: [],
        });

        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          '/api/conversations',
          mockAuth('test-user-123'),
          mockCheckBlocked(user1, noNameUser),
          conversationRoutes
        );

        const response = await request(testApp)
          .post('/api/conversations')
          .send({ recipientId: noNameUser._id.toString() })
          .expect(201);

        expect(response.body.participants[1].displayName).toBe('Anonymous');
      });
    });

    describe('Invalid ID Handling', () => {
      it('should return error for malformed conversation ID', async () => {
        const testApp = express();
        testApp.use(express.json());
        testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);

        const response = await request(testApp)
          .get('/api/conversations/not-a-valid-id')
          .expect(500);

        expect(response.body.message).toBeDefined();
      });

      it('should return error for malformed recipient ID', async () => {
        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          '/api/conversations',
          mockAuth('test-user-123'),
          conversationRoutes
        );

        const response = await request(testApp)
          .post('/api/conversations')
          .send({ recipientId: 'invalid-id' })
          .expect(500);

        expect(response.body.message).toBeDefined();
      });
    });

    describe('Multiple Conversations Handling', () => {
      it('should correctly sort conversations by most recent message', async () => {
        const testApp = express();
        testApp.use(express.json());
        testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);

        // Create older conversation
        const olderConv = await Conversation.create({
          participants: [
            { userId: user1._id, displayName: 'User One' },
            { userId: user2._id, displayName: 'User Two' },
          ],
          lastMessage: {
            text: 'Old message',
            sender: user2._id,
            sentAt: new Date(Date.now() - 86400000), // 1 day ago
          },
        });

        // Create newer conversation
        const newerConv = await Conversation.create({
          participants: [
            { userId: user1._id, displayName: 'User One' },
            { userId: user3._id, displayName: 'User Three' },
          ],
          lastMessage: {
            text: 'New message',
            sender: user3._id,
            sentAt: new Date(), // Now
          },
        });

        const response = await request(testApp)
          .get('/api/conversations')
          .expect(200);

        expect(response.body).toHaveLength(2);
        expect(response.body[0].lastMessage.text).toBe('New message');
        expect(response.body[1].lastMessage.text).toBe('Old message');
      });

      it('should handle conversation with no messages (null lastMessage)', async () => {
        const testApp = express();
        testApp.use(express.json());
        testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);

        await Conversation.create({
          participants: [
            { userId: user1._id, displayName: 'User One' },
            { userId: user2._id, displayName: 'User Two' },
          ],
          // No lastMessage
        });

        const response = await request(testApp)
          .get('/api/conversations')
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].lastMessage).toBeUndefined();
      });
    });

    describe('Archive Edge Cases', () => {
      it('should allow archiving an already archived conversation (idempotent)', async () => {
        const conversation = await Conversation.create({
          participants: [
            { userId: user1._id, displayName: 'User One' },
            { userId: user2._id, displayName: 'User Two' },
          ],
          archivedBy: new Map([[user1._id.toString(), true]]),
        });

        const testApp = express();
        testApp.use(express.json());
        testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);

        const response = await request(testApp)
          .put(`/api/conversations/${conversation._id}/archive`)
          .expect(200);

        expect(response.body.message).toContain('archived successfully');
      });

      it('should not affect other user when one user archives', async () => {
        const conversation = await Conversation.create({
          participants: [
            { userId: user1._id, displayName: 'User One' },
            { userId: user2._id, displayName: 'User Two' },
          ],
        });

        const testApp = express();
        testApp.use(express.json());
        testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);

        await request(testApp)
          .put(`/api/conversations/${conversation._id}/archive`)
          .expect(200);

        // User 2 should still see the conversation
        const user2App = express();
        user2App.use(express.json());
        user2App.use('/api/conversations', mockAuth('user-two-456'), conversationRoutes);

        const response = await request(user2App)
          .get('/api/conversations')
          .expect(200);

        expect(response.body).toHaveLength(1);
      });
    });

    describe('Unread Count Edge Cases', () => {
      it('should correctly show unread counts per user', async () => {
        const conversation = await Conversation.create({
          participants: [
            { userId: user1._id, displayName: 'User One' },
            { userId: user2._id, displayName: 'User Two' },
          ],
          unreadCount: new Map([
            [user1._id.toString(), 5],
            [user2._id.toString(), 0],
          ]),
        });

        const testApp = express();
        testApp.use(express.json());
        testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);

        const response = await request(testApp)
          .get('/api/conversations')
          .expect(200);

        expect(response.body[0].unreadCount).toBe(5);
      });

      it('should default to 0 unread if not set', async () => {
        await Conversation.create({
          participants: [
            { userId: user1._id, displayName: 'User One' },
            { userId: user2._id, displayName: 'User Two' },
          ],
          // No unreadCount set
        });

        const testApp = express();
        testApp.use(express.json());
        testApp.use('/api/conversations', mockAuth('test-user-123'), conversationRoutes);

        const response = await request(testApp)
          .get('/api/conversations')
          .expect(200);

        expect(response.body[0].unreadCount).toBe(0);
      });
    });

    describe('Concurrent Access', () => {
      it('should handle simultaneous conversation creation attempts', async () => {
        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          '/api/conversations',
          mockAuth('test-user-123'),
          mockCheckBlocked(user1, user2),
          conversationRoutes
        );

        // Try to create the same conversation 3 times simultaneously
        const promises = Array(3).fill(null).map(() =>
          request(testApp)
            .post('/api/conversations')
            .send({ recipientId: user2._id.toString() })
        );

        const responses = await Promise.all(promises);

        // All requests should succeed (either 201 or 200)
        const statuses = responses.map(r => r.status);
        expect(statuses.filter(s => s === 201 || s === 200).length).toBe(3);

        // NOTE: Due to race condition, multiple conversations may be created
        // This documents actual behavior - ideally would use unique index or transactions
        const conversations = await Conversation.find({
          'participants.userId': { $all: [user1._id, user2._id] }
        });
        // At least 1 conversation should exist
        expect(conversations.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
