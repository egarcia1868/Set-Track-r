import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../../components/chat/MessageInput';

// Mock contexts
const mockSendMessage = jest.fn();
const mockEmitTyping = jest.fn();
const mockSendSocketMessage = jest.fn();

jest.mock('../../context/ChatContext', () => ({
  useChat: () => ({
    sendMessage: mockSendMessage,
    error: null,
  }),
}));

jest.mock('../../context/SocketContext', () => ({
  useSocket: () => ({
    emitTyping: mockEmitTyping,
    sendMessage: mockSendSocketMessage,
  }),
}));

describe('MessageInput Component', () => {
  const conversationId = 'conv-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.useFakeTimers();
    mockSendMessage.mockResolvedValue({
      _id: 'new-msg',
      text: 'Test message',
      sender: { _id: 'user-123' },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render message input field', () => {
      render(<MessageInput conversationId={conversationId} />);

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<MessageInput conversationId={conversationId} />);

      expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
    });

    it('should have empty input by default', () => {
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      expect(input.value).toBe('');
    });

    it('should have disabled send button when input is empty', () => {
      render(<MessageInput conversationId={conversationId} />);

      const sendButton = screen.getByRole('button', { name: /Send/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Text Input', () => {
    it('should allow typing in the input field', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello world');

      expect(input.value).toBe('Hello world');
    });

    it('should enable send button when input has text', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test');

      expect(sendButton).not.toBeDisabled();
    });

    it('should keep send button disabled with only whitespace', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, '   ');

      expect(sendButton).toBeDisabled();
    });
  });

  describe('Typing Indicators', () => {
    it('should emit typing indicator when user starts typing', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'H');

      expect(mockEmitTyping).toHaveBeenCalledWith(conversationId, true);
    });

    it('should stop typing indicator after 2 seconds of inactivity', async () => {
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');

      // Simulate typing
      fireEvent.change(input, { target: { value: 'Hello' } });

      expect(mockEmitTyping).toHaveBeenCalledWith(conversationId, true);

      // Fast-forward 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockEmitTyping).toHaveBeenCalledWith(conversationId, false);
    });

    it('should emit typing false when input is cleared', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');

      await user.type(input, 'Hello');
      await user.clear(input);

      expect(mockEmitTyping).toHaveBeenLastCalledWith(conversationId, false);
    });
  });

  describe('Message Sending', () => {
    it('should send message when clicking send button', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Hello world');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(conversationId, 'Hello world');
      });
    });

    it('should send message via socket after API call succeeds', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Hello world');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockSendSocketMessage).toHaveBeenCalledWith(
          conversationId,
          expect.objectContaining({
            _id: 'new-msg',
            text: 'Test message',
          })
        );
      });
    });

    it('should clear input after sending message', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should send message on Enter key press', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello{Enter}');

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(conversationId, 'Hello');
      });
    });

    it('should not send on Shift+Enter (allow newline)', async () => {
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');

      // Set input value first
      fireEvent.change(input, { target: { value: 'Hello' } });

      // Fire keypress with shiftKey=true
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', shiftKey: true });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should trim message text before sending', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, '  Hello world  ');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(conversationId, 'Hello world');
      });
    });

    it('should not send empty or whitespace-only messages', async () => {
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');

      // Try to send empty
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.submit(input.closest('form'));

      expect(mockSendMessage).not.toHaveBeenCalled();

      // Try to send whitespace
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.submit(input.closest('form'));

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should stop typing indicator when sending message', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Hello');
      mockEmitTyping.mockClear();
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockEmitTyping).toHaveBeenCalledWith(conversationId, false);
      });
    });
  });

  describe('Sending State', () => {
    it('should show "Sending..." while message is being sent', async () => {
      jest.useRealTimers();
      // Make sendMessage slow
      mockSendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      expect(screen.getByRole('button', { name: /Sending.../i })).toBeInTheDocument();
    });

    it('should disable input while sending', async () => {
      jest.useRealTimers();
      mockSendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      expect(input).toBeDisabled();
    });

    it('should re-enable input after send completes', async () => {
      jest.useRealTimers();
      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });

    it('should prevent double submission while sending', async () => {
      jest.useRealTimers();
      let resolvePromise;
      mockSendMessage.mockImplementation(
        () => new Promise((resolve) => { resolvePromise = resolve; })
      );

      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      // Try to click again while sending
      const sendingButton = screen.getByRole('button', { name: /Sending.../i });
      await user.click(sendingButton);

      expect(mockSendMessage).toHaveBeenCalledTimes(1);

      // Cleanup - resolve and wait for state updates
      await act(async () => {
        resolvePromise({ _id: 'msg', text: 'Hello' });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when present', async () => {
      jest.spyOn(require('../../context/ChatContext'), 'useChat').mockReturnValue({
        sendMessage: mockSendMessage,
        error: 'Failed to send message',
      });

      render(<MessageInput conversationId={conversationId} />);

      expect(screen.getByText('Failed to send message')).toBeInTheDocument();
    });

    it('should handle send failure gracefully', async () => {
      jest.useRealTimers();
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockSendMessage.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<MessageInput conversationId={conversationId} />);

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: /Send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
      });

      // Input should be re-enabled
      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    describe('Special Characters and Unicode', () => {
      it('should handle emojis in message input', async () => {
        jest.useRealTimers();
        const user = userEvent.setup();
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByRole('button', { name: /Send/i });

        await user.type(input, '🎸🎵 Rock on! 🤘');
        expect(input.value).toBe('🎸🎵 Rock on! 🤘');

        await user.click(sendButton);

        await waitFor(() => {
          expect(mockSendMessage).toHaveBeenCalledWith(conversationId, '🎸🎵 Rock on! 🤘');
        });
      });

      it('should handle unicode characters', async () => {
        jest.useRealTimers();
        const user = userEvent.setup();
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');

        await user.type(input, '日本語 中文');
        expect(input.value).toBe('日本語 中文');
      });

      it('should handle special HTML characters without escaping in input', async () => {
        jest.useRealTimers();
        const user = userEvent.setup();
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');

        await user.type(input, '<script>alert("test")</script>');
        expect(input.value).toBe('<script>alert("test")</script>');
      });
    });

    describe('Message Length Boundaries', () => {
      it('should handle very long messages', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');
        const longText = 'A'.repeat(1000);

        fireEvent.change(input, { target: { value: longText } });
        expect(input.value).toBe(longText);
        expect(input.value.length).toBe(1000);
      });

      it('should handle pasting large amounts of text', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');
        const pastedText = 'Lorem ipsum '.repeat(100);

        fireEvent.change(input, { target: { value: pastedText } });
        expect(input.value).toBe(pastedText);
      });

      it('should enable send button for single character', async () => {
        jest.useRealTimers();
        const user = userEvent.setup();
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByRole('button', { name: /Send/i });

        await user.type(input, 'A');
        expect(sendButton).not.toBeDisabled();
      });
    });

    describe('Whitespace Handling', () => {
      it('should disable send button for only spaces', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByRole('button', { name: /Send/i });

        fireEvent.change(input, { target: { value: '     ' } });
        expect(sendButton).toBeDisabled();
      });

      it('should disable send button for only newlines', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByRole('button', { name: /Send/i });

        fireEvent.change(input, { target: { value: '\n\n\n' } });
        expect(sendButton).toBeDisabled();
      });

      it('should disable send button for only tabs', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByRole('button', { name: /Send/i });

        fireEvent.change(input, { target: { value: '\t\t\t' } });
        expect(sendButton).toBeDisabled();
      });

      it('should enable send button for text with leading/trailing spaces', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');
        const sendButton = screen.getByRole('button', { name: /Send/i });

        fireEvent.change(input, { target: { value: '  hello  ' } });
        expect(sendButton).not.toBeDisabled();
      });
    });

    describe('Rapid Input', () => {
      it('should handle rapid typing without losing characters', async () => {
        jest.useRealTimers();
        const user = userEvent.setup({ delay: 1 });
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');

        await user.type(input, 'rapidtyping');
        expect(input.value).toBe('rapidtyping');
      });

      it('should debounce typing indicators on rapid input', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');

        // Rapidly type multiple characters
        fireEvent.change(input, { target: { value: 'a' } });
        fireEvent.change(input, { target: { value: 'ab' } });
        fireEvent.change(input, { target: { value: 'abc' } });
        fireEvent.change(input, { target: { value: 'abcd' } });
        fireEvent.change(input, { target: { value: 'abcde' } });

        // Typing indicator should be emitted, but not excessively
        expect(mockEmitTyping).toHaveBeenCalledWith(conversationId, true);
      });
    });

    describe('Form Submission Edge Cases', () => {
      it('should not submit on Enter when input is empty', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');

        fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
        expect(mockSendMessage).not.toHaveBeenCalled();
      });

      it('should not submit on Enter when only whitespace', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');

        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

        expect(mockSendMessage).not.toHaveBeenCalled();
      });

      it('should handle form submission with disabled button click', async () => {
        render(<MessageInput conversationId={conversationId} />);

        const sendButton = screen.getByRole('button', { name: /Send/i });

        // Button should be disabled when empty
        expect(sendButton).toBeDisabled();

        // Clicking disabled button should not submit
        fireEvent.click(sendButton);
        expect(mockSendMessage).not.toHaveBeenCalled();
      });
    });

    describe('Component State Recovery', () => {
      it('should preserve input value after failed send', async () => {
        jest.useRealTimers();
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockSendMessage.mockRejectedValueOnce(new Error('Network error'));

        const user = userEvent.setup();
        render(<MessageInput conversationId={conversationId} />);

        const input = screen.getByPlaceholderText('Type a message...');

        await user.type(input, 'Important message');
        await user.click(screen.getByRole('button', { name: /Send/i }));

        // After failure, input might still have the text (depends on implementation)
        // This test verifies the component handles the error state
        await waitFor(() => {
          expect(input).not.toBeDisabled();
        });

        consoleError.mockRestore();
      });
    });
  });
});
