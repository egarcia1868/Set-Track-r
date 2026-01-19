import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatWindow from '../../components/chat/ChatWindow';
import { ChatProvider } from '../../context/ChatContext';
import { AuthProvider } from '../../context/AuthContext';
import { SocketProvider } from '../../context/SocketContext';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Mock Auth0
const mockGetAccessTokenSilently = jest.fn();
const mockUseAuth0 = jest.fn();

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockUseAuth0(),
}));

// Mock SocketContext
jest.mock('../../context/SocketContext', () => ({
  ...jest.requireActual('../../context/SocketContext'),
  useSocket: () => ({
    joinConversation: jest.fn(),
    leaveConversation: jest.fn(),
    onTypingUpdate: jest.fn(() => () => {}),
    emitTyping: jest.fn(),
    sendMessage: jest.fn(),
    isConnected: true,
  }),
  SocketProvider: ({ children }) => <div>{children}</div>,
}));

const mockConversation = {
  _id: 'conversation-123',
  participants: [
    {
      userId: 'user-123',
      displayName: 'Test User',
    },
    {
      userId: 'recipient-456',
      displayName: 'Recipient User',
    },
  ],
  lastMessage: {
    text: 'Last message',
    sender: 'user-123',
    sentAt: new Date(),
  },
  unreadCount: 0,
};

const mockMessages = [
  {
    _id: 'msg-1',
    conversationId: 'conversation-123',
    sender: {
      _id: 'user-123',
      profile: { displayName: 'Test User' },
    },
    text: 'Hello, how are you?',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    readBy: [{ userId: 'user-123' }],
  },
  {
    _id: 'msg-2',
    conversationId: 'conversation-123',
    sender: {
      _id: 'recipient-456',
      profile: { displayName: 'Recipient User' },
    },
    text: 'I am doing well, thanks!',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    readBy: [{ userId: 'recipient-456' }],
  },
  {
    _id: 'msg-3',
    conversationId: 'conversation-123',
    sender: {
      _id: 'user-123',
      profile: { displayName: 'Test User' },
    },
    text: 'That\'s great to hear!',
    createdAt: new Date().toISOString(),
    readBy: [{ userId: 'user-123' }],
  },
];

// Mock ChatContext
const mockFetchMessages = jest.fn();
const mockMarkAsRead = jest.fn();
const mockSendMessage = jest.fn();

jest.mock('../../context/ChatContext', () => ({
  ...jest.requireActual('../../context/ChatContext'),
  useChat: () => ({
    activeConversation: mockConversation,
    messages: {
      'conversation-123': mockMessages,
    },
    fetchMessages: mockFetchMessages,
    markAsRead: mockMarkAsRead,
    sendMessage: mockSendMessage,
    error: null,
  }),
  ChatProvider: ({ children }) => <div>{children}</div>,
}));

const AllProviders = ({ children }) => {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>{children}</ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

describe('ChatWindow Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Mock scrollIntoView since jsdom doesn't support it
    Element.prototype.scrollIntoView = jest.fn();

    mockGetAccessTokenSilently.mockResolvedValue('mock-token');
    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      user: { sub: 'auth0|123', email: 'test@example.com' },
      getAccessTokenSilently: mockGetAccessTokenSilently,
      isLoading: false,
    });

    mockFetchMessages.mockResolvedValue();
    mockMarkAsRead.mockResolvedValue();
    mockSendMessage.mockResolvedValue({
      _id: 'new-msg',
      text: 'New message',
      sender: { _id: 'user-123' },
    });

    // Mock userProfile in Auth context
    server.use(
      rest.get('http://localhost:4000/api/users/profile', (req, res, ctx) => {
        return res(
          ctx.json({
            profile: {
              _id: 'user-123',
              displayName: 'Test User',
              bio: 'Test bio',
              isPublic: true,
            },
          })
        );
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('No Conversation Selected', () => {
    it('should show "Select a conversation" when no active conversation', () => {
      // Mock ChatContext with no active conversation
      const spy = jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        activeConversation: null,
        messages: {},
        fetchMessages: mockFetchMessages,
        markAsRead: mockMarkAsRead,
        sendMessage: mockSendMessage,
        error: null,
      });

      render(<ChatWindow />, { wrapper: AllProviders });

      expect(screen.getByText('Select a conversation')).toBeInTheDocument();
      expect(
        screen.getByText('Choose a conversation from the list to start messaging')
      ).toBeInTheDocument();

      spy.mockRestore();
    });
  });

  describe('Conversation Header', () => {
    it('should display other participant name in header', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(screen.getByText('Recipient User')).toBeInTheDocument();
      });
    });

    it('should display other participant avatar', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        // Find the header avatar specifically (has class 'chat-avatar')
        const avatars = screen.getAllByText('R');
        const headerAvatar = avatars.find(el => el.className.includes('chat-avatar'));
        expect(headerAvatar).toBeInTheDocument();
      });
    });
  });

  describe('Messages Display', () => {
    it('should display all messages in conversation', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
        expect(screen.getByText('I am doing well, thanks!')).toBeInTheDocument();
        expect(screen.getByText("That's great to hear!")).toBeInTheDocument();
      });
    });

    it('should fetch messages when conversation loads', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(mockFetchMessages).toHaveBeenCalledWith('conversation-123');
      });
    });

    it('should mark messages as read when conversation opens', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalledWith('conversation-123');
      });
    });

    it('should show loading state while fetching messages', async () => {
      // Make fetchMessages slow
      mockFetchMessages.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ChatWindow />, { wrapper: AllProviders });

      expect(screen.getByText('Loading messages...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading messages...')).not.toBeInTheDocument();
      });
    });

    it('should show "No messages yet" when conversation is empty', async () => {
      // Mock empty messages
      const spy = jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        activeConversation: mockConversation,
        messages: {
          'conversation-123': [],
        },
        fetchMessages: mockFetchMessages,
        markAsRead: mockMarkAsRead,
        sendMessage: mockSendMessage,
        error: null,
      });

      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(
          screen.getByText('No messages yet. Start the conversation!')
        ).toBeInTheDocument();
      });

      spy.mockRestore();
    });
  });

  describe('Message Styling', () => {
    it('should apply different styling for own messages vs other messages', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        const ownMessages = screen.getAllByText(/Hello, how are you\?|That's great to hear!/);
        const otherMessages = screen.getAllByText('I am doing well, thanks!');

        ownMessages.forEach((msg) => {
          expect(msg.closest('.message-wrapper')).toHaveClass('own-message');
        });

        otherMessages.forEach((msg) => {
          expect(msg.closest('.message-wrapper')).toHaveClass('other-message');
        });
      });
    });

    it('should display message timestamps', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        const timeElements = document.querySelectorAll('.message-time');
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Message Input', () => {
    it('should render message input field', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Type a message...');
        expect(input).toBeInTheDocument();
      });
    });

    it('should render send button', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /Send/i });
        expect(sendButton).toBeInTheDocument();
      });
    });

    it('should allow typing in message input', async () => {
      const user = userEvent.setup();
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello world');

      expect(input.value).toBe('Hello world');
    });

    it('should clear input after sending message', async () => {
      const user = userEvent.setup();
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should disable send button when input is empty', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /Send/i });
        expect(sendButton).toBeDisabled();
      });
    });

    it('should enable send button when input has text', async () => {
      const user = userEvent.setup();
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test');

      await waitFor(() => {
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('Typing Indicator', () => {
    it('should not display typing indicator by default', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      });

      expect(screen.queryByText(/is typing.../)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when sending fails', async () => {
      // Mock ChatContext with error
      const spy = jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        activeConversation: mockConversation,
        messages: {
          'conversation-123': mockMessages,
        },
        fetchMessages: mockFetchMessages,
        markAsRead: mockMarkAsRead,
        sendMessage: mockSendMessage,
        error: 'Failed to send message',
      });

      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        expect(screen.getByText('Failed to send message')).toBeInTheDocument();
      });

      spy.mockRestore();
    });
  });

  describe('User Profile Integration', () => {
    it('should correctly identify own messages using user profile', async () => {
      render(<ChatWindow />, { wrapper: AllProviders });

      await waitFor(() => {
        const ownMessages = screen.getAllByText(/Hello, how are you\?|That's great to hear!/);

        ownMessages.forEach((msg) => {
          const wrapper = msg.closest('.message-wrapper');
          expect(wrapper).toHaveClass('own-message');
        });
      });
    });
  });
});
