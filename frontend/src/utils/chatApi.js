import { BASE_URL } from "./config";

/**
 * Chat API Service Layer
 * Handles all chat-related API calls to the backend
 */

// ==================== CONVERSATION ENDPOINTS ====================

/**
 * Get all conversations for the current user
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Array>} List of conversations
 */
export const getConversations = async (getAccessTokenSilently) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(`${BASE_URL}/api/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch conversations");
  }

  return response.json();
};

/**
 * Create or get existing conversation with another user
 * @param {string} recipientId - User ID to start conversation with
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Conversation object
 */
export const createOrGetConversation = async (
  recipientId,
  getAccessTokenSilently,
) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(`${BASE_URL}/api/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ recipientId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create conversation");
  }

  return response.json();
};

/**
 * Get a specific conversation by ID
 * @param {string} conversationId - Conversation ID
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Conversation object
 */
export const getConversationById = async (
  conversationId,
  getAccessTokenSilently,
) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(
    `${BASE_URL}/api/conversations/${conversationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch conversation");
  }

  return response.json();
};

/**
 * Archive a conversation (hide it without deleting)
 * @param {string} conversationId - Conversation ID to archive
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Success message
 */
export const archiveConversation = async (
  conversationId,
  getAccessTokenSilently,
) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(
    `${BASE_URL}/api/conversations/${conversationId}/archive`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to archive conversation");
  }

  return response.json();
};

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID to delete
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Success message
 */
export const deleteConversation = async (
  conversationId,
  getAccessTokenSilently,
) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(
    `${BASE_URL}/api/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete conversation");
  }

  return response.json();
};

// ==================== MESSAGE ENDPOINTS ====================

/**
 * Get messages in a conversation with pagination
 * @param {string} conversationId - Conversation ID
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @param {Object} options - Pagination options { limit, before }
 * @returns {Promise<Array>} List of messages
 */
export const getMessages = async (
  conversationId,
  getAccessTokenSilently,
  options = {},
) => {
  const { limit = 50, before } = options;
  const token = await getAccessTokenSilently();

  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (before) params.append("before", before);

  const response = await fetch(
    `${BASE_URL}/api/messages/${conversationId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch messages");
  }

  return response.json();
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} text - Message text
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Created message
 */
export const sendMessage = async (
  conversationId,
  text,
  getAccessTokenSilently,
) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(`${BASE_URL}/api/messages/${conversationId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send message");
  }

  return response.json();
};

/**
 * Mark all messages in a conversation as read
 * @param {string} conversationId - Conversation ID
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Success message with count
 */
export const markMessagesAsRead = async (
  conversationId,
  getAccessTokenSilently,
) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(
    `${BASE_URL}/api/messages/${conversationId}/read`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to mark messages as read");
  }

  return response.json();
};

/**
 * Delete a message
 * @param {string} messageId - Message ID to delete
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Success message
 */
export const deleteMessage = async (messageId, getAccessTokenSilently) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(`${BASE_URL}/api/messages/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete message");
  }

  return response.json();
};

// ==================== BLOCK ENDPOINTS ====================

/**
 * Get all blocked users for current user
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Array>} List of blocked users
 */
export const getBlockedUsers = async (getAccessTokenSilently) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(`${BASE_URL}/api/blocks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch blocked users");
  }

  return response.json();
};

/**
 * Block a user
 * @param {string} userId - User ID to block
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Success message with blocked user info
 */
export const blockUser = async (userId, getAccessTokenSilently) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(`${BASE_URL}/api/blocks/${userId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to block user");
  }

  return response.json();
};

/**
 * Unblock a user
 * @param {string} userId - User ID to unblock
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Success message
 */
export const unblockUser = async (userId, getAccessTokenSilently) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(`${BASE_URL}/api/blocks/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to unblock user");
  }

  return response.json();
};

/**
 * Check block status with another user
 * @param {string} userId - User ID to check
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @returns {Promise<Object>} Block status { hasBlockedOther, isBlockedByOther, canMessage }
 */
export const checkBlockStatus = async (userId, getAccessTokenSilently) => {
  const token = await getAccessTokenSilently();
  const response = await fetch(`${BASE_URL}/api/blocks/check/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to check block status");
  }

  return response.json();
};
