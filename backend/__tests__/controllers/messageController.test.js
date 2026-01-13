import User from '../../models/UserModel.js';
import Message from '../../models/MessageModel.js';
import Conversation from '../../models/ConversationModel.js';
import '../setup.js';

describe('Message Model Tests', () => {
  let sender, recipient, conversation;

  beforeEach(async () => {
    // Create test users
    sender = await User.create({
      auth0Id: 'sender-123',
      profile: {
        displayName: 'Sender User',
        isPublic: true,
      },
      artistsSeenLive: [],
    });

    recipient = await User.create({
      auth0Id: 'recipient-456',
      profile: {
        displayName: 'Recipient User',
        isPublic: true,
      },
      artistsSeenLive: [],
    });

    // Create conversation
    conversation = await Conversation.create({
      participants: [
        { userId: sender._id, displayName: 'Sender User' },
        { userId: recipient._id, displayName: 'Recipient User' },
      ],
    });
  });

  describe('Message Creation', () => {
    it('should create a message successfully', async () => {
      const message = await Message.create({
        conversationId: conversation._id,
        sender: sender._id,
        text: 'Hello, this is a test message!',
        readBy: [{ userId: sender._id }],
      });

      expect(message.text).toBe('Hello, this is a test message!');
      expect(message.sender).toEqual(sender._id);
      expect(message.conversationId).toEqual(conversation._id);
    });

    it('should require message text', async () => {
      await expect(
        Message.create({
          conversationId: conversation._id,
          sender: sender._id,
          readBy: [{ userId: sender._id }],
        })
      ).rejects.toThrow();
    });
  });

  describe('Message Retrieval', () => {
    beforeEach(async () => {
      // Create test messages
      await Message.create([
        {
          conversationId: conversation._id,
          sender: sender._id,
          text: 'Message 1',
          readBy: [{ userId: sender._id }],
        },
        {
          conversationId: conversation._id,
          sender: recipient._id,
          text: 'Message 2',
          readBy: [{ userId: recipient._id }],
        },
      ]);
    });

    it('should retrieve messages for a conversation', async () => {
      const messages = await Message.find({
        conversationId: conversation._id,
      });

      expect(messages).toHaveLength(2);
      expect(messages[0].text).toBe('Message 1');
      expect(messages[1].text).toBe('Message 2');
    });
  });

  describe('Conversation Model', () => {
    it('should check if user is participant', () => {
      expect(conversation.hasParticipant(sender._id)).toBe(true);
      expect(conversation.hasParticipant(recipient._id)).toBe(true);
    });

    it('should require displayName for participants', async () => {
      await expect(
        Conversation.create({
          participants: [
            { userId: sender._id }, // Missing displayName
            { userId: recipient._id, displayName: 'Test' },
          ],
        })
      ).rejects.toThrow();
    });
  });
});
