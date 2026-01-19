import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversationsList from '../../components/chat/ConversationsList';

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    user: { sub: 'auth0|123', email: 'test@example.com' },
    getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
    isLoading: false,
  }),
}));

// Mock contexts
const mockFetchConversations = jest.fn();
const mockSelectConversation = jest.fn();
const mockArchiveConversation = jest.fn();

const mockConversations = [
  {
    _id: 'conv-1',
    participants: [
      { userId: 'user-123', displayName: 'Test User' },
      { userId: 'recipient-1', displayName: 'Alice Smith' },
    ],
    lastMessage: {
      text: 'Hey, how are you?',
      sender: 'recipient-1',
      sentAt: new Date().toISOString(),
    },
    unreadCount: 2,
  },
  {
    _id: 'conv-2',
    participants: [
      { userId: 'user-123', displayName: 'Test User' },
      { userId: 'recipient-2', displayName: 'Bob Johnson' },
    ],
    lastMessage: {
      text: 'See you at the concert!',
      sender: 'user-123',
      sentAt: new Date(Date.now() - 3600000).toISOString(),
    },
    unreadCount: 0,
  },
];

jest.mock('../../context/ChatContext', () => ({
  useChat: () => ({
    conversations: mockConversations,
    activeConversation: null,
    fetchConversations: mockFetchConversations,
    selectConversation: mockSelectConversation,
    archiveConversation: mockArchiveConversation,
    loading: false,
  }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    userProfile: {
      _id: 'user-123',
      displayName: 'Test User',
    },
  }),
}));

describe('ConversationsList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockFetchConversations.mockResolvedValue();
    mockArchiveConversation.mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should fetch conversations on mount', async () => {
      render(<ConversationsList />);

      await waitFor(() => {
        expect(mockFetchConversations).toHaveBeenCalled();
      });
    });

    it('should display the Messages header', async () => {
      render(<ConversationsList />);

      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    it('should display all conversations', async () => {
      render(<ConversationsList />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Display', () => {
    it('should show other participant name (not current user)', async () => {
      render(<ConversationsList />);

      await waitFor(() => {
        // Should show other participant, not Test User
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('should display last message preview', async () => {
      render(<ConversationsList />);

      await waitFor(() => {
        expect(screen.getByText('Hey, how are you?')).toBeInTheDocument();
        expect(screen.getByText('See you at the concert!')).toBeInTheDocument();
      });
    });

    it('should display avatar with first letter of display name', async () => {
      render(<ConversationsList />);

      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument(); // Alice
        expect(screen.getByText('B')).toBeInTheDocument(); // Bob
      });
    });

    it('should show unread badge when there are unread messages', async () => {
      render(<ConversationsList />);

      await waitFor(() => {
        const unreadBadge = screen.getByText('2');
        expect(unreadBadge).toBeInTheDocument();
        expect(unreadBadge.className).toContain('unread-badge');
      });
    });

    it('should not show unread badge when count is 0', async () => {
      render(<ConversationsList />);

      await waitFor(() => {
        const badges = document.querySelectorAll('.unread-badge');
        // Only one badge for conv-1 with 2 unread
        expect(badges).toHaveLength(1);
      });
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format recent messages as "Just now"', async () => {
      jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        conversations: [
          {
            _id: 'conv-now',
            participants: [
              { userId: 'user-123', displayName: 'Test User' },
              { userId: 'recipient-1', displayName: 'Recent User' },
            ],
            lastMessage: {
              text: 'Just sent!',
              sender: 'recipient-1',
              sentAt: new Date().toISOString(),
            },
            unreadCount: 0,
          },
        ],
        activeConversation: null,
        fetchConversations: mockFetchConversations,
        selectConversation: mockSelectConversation,
        archiveConversation: mockArchiveConversation,
        loading: false,
      });

      render(<ConversationsList />);

      await waitFor(() => {
        expect(screen.getByText('Just now')).toBeInTheDocument();
      });
    });

    it('should format messages from hours ago', async () => {
      jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        conversations: [
          {
            _id: 'conv-hours',
            participants: [
              { userId: 'user-123', displayName: 'Test User' },
              { userId: 'recipient-1', displayName: 'Hours Ago User' },
            ],
            lastMessage: {
              text: 'Earlier today',
              sender: 'recipient-1',
              sentAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            },
            unreadCount: 0,
          },
        ],
        activeConversation: null,
        fetchConversations: mockFetchConversations,
        selectConversation: mockSelectConversation,
        archiveConversation: mockArchiveConversation,
        loading: false,
      });

      render(<ConversationsList />);

      await waitFor(() => {
        expect(screen.getByText('2h ago')).toBeInTheDocument();
      });
    });
  });

  describe('Conversation Selection', () => {
    it('should call selectConversation when clicking a conversation', async () => {
      const user = userEvent.setup();
      render(<ConversationsList />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      const conversationItem = screen.getByText('Alice Smith').closest('.conversation-item');
      await user.click(conversationItem);

      expect(mockSelectConversation).toHaveBeenCalledWith(mockConversations[0]);
    });

    it('should highlight active conversation', async () => {
      jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        conversations: mockConversations,
        activeConversation: mockConversations[0],
        fetchConversations: mockFetchConversations,
        selectConversation: mockSelectConversation,
        archiveConversation: mockArchiveConversation,
        loading: false,
      });

      render(<ConversationsList />);

      await waitFor(() => {
        const activeItem = screen.getByText('Alice Smith').closest('.conversation-item');
        expect(activeItem.className).toContain('active');
      });
    });
  });

  describe('Archive Conversation', () => {
    it('should call archiveConversation when clicking archive button', async () => {
      const user = userEvent.setup();
      render(<ConversationsList />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      const archiveButtons = screen.getAllByTitle('Archive conversation');
      await user.click(archiveButtons[0]);

      expect(mockArchiveConversation).toHaveBeenCalledWith('conv-1');
    });

    it('should not select conversation when clicking archive button', async () => {
      const user = userEvent.setup();
      render(<ConversationsList />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      const archiveButtons = screen.getAllByTitle('Archive conversation');
      await user.click(archiveButtons[0]);

      // Should archive but not select
      expect(mockArchiveConversation).toHaveBeenCalled();
      expect(mockSelectConversation).not.toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no conversations', async () => {
      jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        conversations: [],
        activeConversation: null,
        fetchConversations: mockFetchConversations,
        selectConversation: mockSelectConversation,
        archiveConversation: mockArchiveConversation,
        loading: false,
      });

      render(<ConversationsList />);

      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
      expect(
        screen.getByText('Start a conversation with someone from their profile!')
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching conversations', async () => {
      jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        conversations: [],
        activeConversation: null,
        fetchConversations: mockFetchConversations,
        selectConversation: mockSelectConversation,
        archiveConversation: mockArchiveConversation,
        loading: true,
      });

      render(<ConversationsList />);

      expect(screen.getByText('Loading conversations...')).toBeInTheDocument();
    });

    it('should not show loading state if conversations exist', async () => {
      jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        conversations: mockConversations,
        activeConversation: null,
        fetchConversations: mockFetchConversations,
        selectConversation: mockSelectConversation,
        archiveConversation: mockArchiveConversation,
        loading: true, // Still loading but has data
      });

      render(<ConversationsList />);

      expect(screen.queryByText('Loading conversations...')).not.toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
  });

  describe('No Last Message', () => {
    it('should show "No messages yet" when conversation has no last message', async () => {
      jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        conversations: [
          {
            _id: 'conv-empty',
            participants: [
              { userId: 'user-123', displayName: 'Test User' },
              { userId: 'recipient-1', displayName: 'New Contact' },
            ],
            lastMessage: null,
            unreadCount: 0,
          },
        ],
        activeConversation: null,
        fetchConversations: mockFetchConversations,
        selectConversation: mockSelectConversation,
        archiveConversation: mockArchiveConversation,
        loading: false,
      });

      render(<ConversationsList />);

      await waitFor(() => {
        expect(screen.getByText('No messages yet')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    describe('Display Name Edge Cases', () => {
      it('should handle very long display names with truncation', async () => {
        const longName = 'A'.repeat(100);
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-long',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: longName },
              ],
              lastMessage: { text: 'Hello', sender: 'recipient-1', sentAt: new Date().toISOString() },
              unreadCount: 0,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          expect(screen.getByText(longName)).toBeInTheDocument();
        });
      });

      it('should handle special characters in display names', async () => {
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-special',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: '🎸 Rock & Roll <Fan>' },
              ],
              lastMessage: { text: 'Hello', sender: 'recipient-1', sentAt: new Date().toISOString() },
              unreadCount: 0,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          expect(screen.getByText('🎸 Rock & Roll <Fan>')).toBeInTheDocument();
        });
      });

      it('should show "Unknown User" for missing display name', async () => {
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-unknown',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1' }, // No displayName
              ],
              lastMessage: { text: 'Hello', sender: 'recipient-1', sentAt: new Date().toISOString() },
              unreadCount: 0,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          expect(screen.getByText('Unknown User')).toBeInTheDocument();
        });
      });

      it('should show "?" avatar for missing display name', async () => {
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-no-avatar',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: '' }, // Empty displayName
              ],
              lastMessage: { text: 'Hello', sender: 'recipient-1', sentAt: new Date().toISOString() },
              unreadCount: 0,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          expect(screen.getByText('?')).toBeInTheDocument();
        });
      });
    });

    describe('Message Preview Edge Cases', () => {
      it('should handle very long message previews', async () => {
        const longMessage = 'This is a very long message '.repeat(20);
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-long-msg',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: 'Alice' },
              ],
              lastMessage: { text: longMessage, sender: 'recipient-1', sentAt: new Date().toISOString() },
              unreadCount: 0,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        // Verify conversation renders with long message (message may be truncated in UI)
        await waitFor(() => {
          expect(screen.getByText('Alice')).toBeInTheDocument();
          // Check that the message preview element exists and contains part of the message
          const preview = document.querySelector('.last-message');
          expect(preview).toBeInTheDocument();
          expect(preview.textContent).toContain('This is a very long message');
        });
      });

      it('should handle messages with emojis in preview', async () => {
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-emoji',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: 'Alice' },
              ],
              lastMessage: { text: '🎸🎵 Great show! 🤘', sender: 'recipient-1', sentAt: new Date().toISOString() },
              unreadCount: 0,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          expect(screen.getByText('🎸🎵 Great show! 🤘')).toBeInTheDocument();
        });
      });

      it('should handle messages with HTML-like content safely', async () => {
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-html',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: 'Alice' },
              ],
              lastMessage: { text: '<script>alert("xss")</script>', sender: 'recipient-1', sentAt: new Date().toISOString() },
              unreadCount: 0,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          // Should display as text, not execute
          expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
        });
      });
    });

    describe('Unread Count Edge Cases', () => {
      it('should handle very high unread count', async () => {
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-many-unread',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: 'Alice' },
              ],
              lastMessage: { text: 'Hello', sender: 'recipient-1', sentAt: new Date().toISOString() },
              unreadCount: 999,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          expect(screen.getByText('999')).toBeInTheDocument();
        });
      });

      it('should not show badge for negative unread count', async () => {
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-negative',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: 'Alice' },
              ],
              lastMessage: { text: 'Hello', sender: 'recipient-1', sentAt: new Date().toISOString() },
              unreadCount: -1,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          const badges = document.querySelectorAll('.unread-badge');
          expect(badges).toHaveLength(0);
        });
      });
    });

    describe('Timestamp Edge Cases', () => {
      it('should handle very old timestamps', async () => {
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-old',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: 'Alice' },
              ],
              lastMessage: {
                text: 'Old message',
                sender: 'recipient-1',
                sentAt: new Date('2020-01-01').toISOString(), // Years ago
              },
              unreadCount: 0,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          // Should show a date format for very old messages
          const timeElement = document.querySelector('.conversation-time');
          expect(timeElement).toBeInTheDocument();
          expect(timeElement.textContent).toMatch(/\d/); // Contains some date/number
        });
      });

      it('should handle invalid timestamp gracefully', async () => {
        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: [
            {
              _id: 'conv-invalid-time',
              participants: [
                { userId: 'user-123', displayName: 'Test User' },
                { userId: 'recipient-1', displayName: 'Alice' },
              ],
              lastMessage: {
                text: 'Message',
                sender: 'recipient-1',
                sentAt: 'invalid-date',
              },
              unreadCount: 0,
            },
          ],
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        // Should render without crashing
        await waitFor(() => {
          expect(screen.getByText('Alice')).toBeInTheDocument();
        });
      });
    });

    describe('Multiple Conversations', () => {
      it('should handle many conversations (scroll scenario)', async () => {
        const manyConversations = Array(50).fill(null).map((_, i) => ({
          _id: `conv-${i}`,
          participants: [
            { userId: 'user-123', displayName: 'Test User' },
            { userId: `recipient-${i}`, displayName: `User ${i}` },
          ],
          lastMessage: {
            text: `Message ${i}`,
            sender: `recipient-${i}`,
            sentAt: new Date(Date.now() - i * 60000).toISOString(),
          },
          unreadCount: i % 2 === 0 ? 1 : 0,
        }));

        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: manyConversations,
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        render(<ConversationsList />);

        await waitFor(() => {
          expect(screen.getByText('User 0')).toBeInTheDocument();
          expect(screen.getByText('User 49')).toBeInTheDocument();
        });
      });
    });

    describe('Archive Error Handling', () => {
      it('should handle archive failure gracefully', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockArchiveConversation.mockRejectedValueOnce(new Error('Network error'));

        jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
          conversations: mockConversations,
          activeConversation: null,
          fetchConversations: mockFetchConversations,
          selectConversation: mockSelectConversation,
          archiveConversation: mockArchiveConversation,
          loading: false,
        });

        const user = userEvent.setup();
        render(<ConversationsList />);

        await waitFor(() => {
          expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        const archiveButtons = screen.getAllByTitle('Archive conversation');
        await user.click(archiveButtons[0]);

        await waitFor(() => {
          expect(consoleError).toHaveBeenCalledWith('Failed to archive conversation:', expect.any(Error));
        });

        consoleError.mockRestore();
      });
    });
  });
});
