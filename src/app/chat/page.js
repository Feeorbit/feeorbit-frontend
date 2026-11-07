'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useGym } from '../../context/GymContext';
import {
  MessageSquare,
  Users,
  User,
  Plus,
  Search,
  Send,
  Smile,
  Reply,
  MoreHorizontal,
  ShieldBan,
  ShieldCheck,
  Pin,
  Trash2,
  CheckCheck,
  ChevronLeft,
  X,
  Sparkles,
  Flame,
  Dumbbell,
  Clock,
  UserPlus,
  Circle,
  AlertCircle,
  Info,
  Check,
  Ban,
  CheckSquare,
} from 'lucide-react';

const QUICK_GYM_CHIPS = [
  { label: 'Hit today’s PR! 💪', text: 'Just crushed today’s PR on the gym floor! 💪🔥', type: 'workout_pr' },
  { label: 'Spot me on bench 🏋️', text: 'Anyone near the free weights? Need a quick spot on bench press! 🏋️', type: 'text' },
  { label: 'Form check? 👀', text: 'Hey, could someone take a quick look at my squat form? 👀', type: 'text' },
  { label: 'Great workout! 🔥', text: 'Awesome workout today! The energy in the gym is insane. 🔥⚡', type: 'cheer' },
  { label: 'See you tomorrow ⚡', text: 'Wrapping up for today. See you all on the floor tomorrow! ⚡', type: 'text' },
];

const EMOJI_REACTIONS = ['👍', '❤️', '🔥', '💪', '👏', '😂', '🎉', '🏋️'];

// Safe helper for strict message deduplication
const mergeMessage = (list, newMsg) => {
  if (!newMsg) return list;
  const newId = (newMsg._id || newMsg.id)?.toString();
  if (!newId) return list;
  const exists = list.some((m) => (m._id || m.id)?.toString() === newId);
  if (exists) {
    return list.map((m) => ((m._id || m.id)?.toString() === newId ? { ...m, ...newMsg } : m));
  }
  return [...list, newMsg];
};

export default function GymChatPage() {
  const { user, token } = useAuth();
  const { currentGym } = useGym();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'community' | 'direct' | 'group'

  // Socket & Realtime
  const socketRef = useRef(null);
  const activeConvIdRef = useRef(activeConvId);
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // convId -> { id, name }

  // Modals & Panels
  const [showNewDirectModal, setShowNewDirectModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // { message, canDeleteForEveryone: boolean }
  const [isDeleting, setIsDeleting] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // Multi-select conversations state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedConvIds, setSelectedConvIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Message Action Dropdown & Hover Popover
  const [activeActionMenuMsgId, setActiveActionMenuMsgId] = useState(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  // Sending state and lock to prevent double sending
  const isSendingRef = useRef(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);

  // Gym Members directory
  const [gymMembers, setGymMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Group creation form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Blocked users list
  const [blockedList, setBlockedList] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Close message action popover on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveActionMenuMsgId(null);
    };
    if (activeActionMenuMsgId) {
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [activeActionMenuMsgId]);

  // Keep activeConvIdRef in sync with state for socket callbacks
  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c._id === activeConvId) || null;
  }, [conversations, activeConvId]);

  // Auth header helper
  const getAuthHeader = () => {
    const rawToken = token || (typeof window !== 'undefined' ? localStorage.getItem('feeorbit_token') : '') || 'demo_token';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawToken}`,
    };
  };

  // 1. Establish Socket Connection ONCE
  useEffect(() => {
    const rawToken = token || (typeof window !== 'undefined' ? localStorage.getItem('feeorbit_token') : '') || 'demo_token';
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(socketUrl, {
      auth: { token: rawToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      // Join active conversation room if one is already selected
      if (activeConvIdRef.current) {
        socket.emit('join_conversation', { conversationId: activeConvIdRef.current });
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('initial_online_users', (userIds) => {
      if (Array.isArray(userIds)) setOnlineUserIds(new Set(userIds));
    });

    socket.on('user_status_changed', ({ userId, online }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on('new_message', ({ conversationId, message }) => {
      if (!message) return;

      // If viewing this conversation, append message safely with strict deduplication
      if (activeConvIdRef.current === conversationId) {
        setMessages((prev) => mergeMessage(prev, message));
      }

      // Update conversation in list preview & unread counter
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId) {
            const isCurrentlyViewing = activeConvIdRef.current === conversationId;
            return {
              ...c,
              lastMessage: {
                text: message.text,
                senderName: message.senderName,
                createdAt: message.createdAt,
                mediaUrl: message.mediaUrl,
                messageType: message.messageType,
              },
              lastActivity: message.createdAt,
              unreadCount: isCurrentlyViewing ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );

      window.dispatchEvent(new CustomEvent('gympulse-chat-updated'));
    });

    socket.on('conversation_updated', ({ conversationId, lastMessage }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId) {
            return {
              ...c,
              lastMessage,
              lastActivity: lastMessage.createdAt,
              unreadCount: activeConvIdRef.current === conversationId ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
      window.dispatchEvent(new CustomEvent('gympulse-chat-updated'));
    });

    socket.on('reaction_updated', ({ conversationId, messageId, reactions }) => {
      if (activeConvIdRef.current === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
        );
      }
    });

    socket.on('message_deleted', ({ conversationId, messageId, forEveryone, deletedBy }) => {
      if (activeConvIdRef.current === conversationId) {
        if (forEveryone) {
          setMessages((prev) =>
            prev.map((m) =>
              (m._id || m.id) === messageId
                ? {
                    ...m,
                    isDeletedForEveryone: true,
                    text: 'This message was deleted',
                    mediaUrl: '',
                    reactions: [],
                  }
                : m
            )
          );
        } else if (deletedBy === user?._id?.toString()) {
          setMessages((prev) => prev.filter((m) => (m._id || m.id) !== messageId));
        }
      }

      if (forEveryone) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c._id === conversationId && c.lastMessage) {
              return {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  text: 'This message was deleted',
                  mediaUrl: '',
                },
              };
            }
            return c;
          })
        );
      }
    });

    socket.on('user_typing', ({ conversationId, user: typingUser }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(conversationId, typingUser);
        return next;
      });
    });

    socket.on('user_stop_typing', ({ conversationId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(conversationId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, currentGym?._id]);

  // 2. Fetch Conversations from backend
  const fetchConversations = async () => {
    try {
      setLoadingConv(true);
      const res = await fetch('/api/chat/conversations', {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConversations(data.data);
        // Default select first conversation if none selected
        if (!activeConvIdRef.current && data.data.length > 0) {
          setActiveConvId(data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('fetchConversations error:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [currentGym?._id]);

  // 3. Room Switching & Fetch Messages on Active Conversation Change
  useEffect(() => {
    if (!activeConvId) return;

    if (socketRef.current && socketConnected) {
      socketRef.current.emit('join_conversation', { conversationId: activeConvId });
    }

    const fetchMessages = async () => {
      try {
        setLoadingMsgs(true);
        const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
          headers: getAuthHeader(),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setMessages(data.data);

          // Clear local unread count for this conversation
          setConversations((prev) =>
            prev.map((c) => (c._id === activeConvId ? { ...c, unreadCount: 0 } : c))
          );
          window.dispatchEvent(new CustomEvent('gympulse-chat-updated'));
        }
      } catch (err) {
        console.error('fetchMessages error:', err);
      } finally {
        setLoadingMsgs(false);
      }
    };

    fetchMessages();

    return () => {
      if (socketRef.current && socketConnected) {
        socketRef.current.emit('leave_conversation', { conversationId: activeConvId });
      }
    };
  }, [activeConvId, socketConnected]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle typing with debounce
  const handleTypingChange = (e) => {
    setInputText(e.target.value);

    if (!socketRef.current || !activeConvId) return;

    socketRef.current.emit('typing', { conversationId: activeConvId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && activeConvId) {
        socketRef.current.emit('stop_typing', { conversationId: activeConvId });
      }
    }, 1500);
  };

  // 4. Send Message (with strict concurrency lock & deduplication)
  const handleSendMessage = async (customText = null, customType = null) => {
    const textToSend = customText !== null ? customText : inputText;
    const msgType = customType || 'text';

    if (!textToSend.trim() && msgType === 'text') return;
    if (!activeConvId) return;
    if (isSendingRef.current) return;

    isSendingRef.current = true;
    setIsSending(true);

    const payload = {
      text: textToSend.trim(),
      messageType: msgType,
      replyTo: replyToMessage
        ? {
            messageId: replyToMessage._id,
            senderName: replyToMessage.senderName,
            text: replyToMessage.text,
          }
        : null,
    };

    setInputText('');
    setReplyToMessage(null);

    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { conversationId: activeConvId });
    }

    try {
      const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.data) {
        // Render message in feed safely without duplicates
        setMessages((prev) => mergeMessage(prev, data.data));

        // Immediately update preview in conversation list
        setConversations((prev) =>
          prev.map((c) => {
            if (c._id === activeConvId) {
              return {
                ...c,
                lastMessage: {
                  text: data.data.text,
                  senderName: data.data.senderName,
                  createdAt: data.data.createdAt,
                  mediaUrl: data.data.mediaUrl,
                  messageType: data.data.messageType,
                },
                lastActivity: data.data.createdAt,
              };
            }
            return c;
          })
        );
      } else {
        alert(data.message || 'Could not send message. Please check permissions.');
      }
    } catch (err) {
      console.error('handleSendMessage error:', err);
      alert('Network error sending message.');
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  // 6. Toggle Reaction
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: data.data } : m))
        );
      }
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  // 7. Toggle Block / Unblock
  const handleToggleBlock = async (targetUserId, currentlyBlocked) => {
    if (!targetUserId) return;
    const endpoint = currentlyBlocked ? '/api/chat/unblock' : '/api/chat/block';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchConversations();
        if (showBlockedModal) fetchBlockedUsers();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      alert('Network error updating block status');
    }
  };

  // 8. Gym Member Directory
  const fetchGymMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await fetch('/api/chat/gym-members', {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setGymMembers(data.data);
      }
    } catch (err) {
      console.error('fetchGymMembers error:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const openNewDirectModal = () => {
    setShowNewDirectModal(true);
    fetchGymMembers();
  };

  const openNewGroupModal = () => {
    setShowNewGroupModal(true);
    fetchGymMembers();
  };

  // 9. Start Direct Chat
  const startDirectChat = async (targetUserId) => {
    try {
      const res = await fetch('/api/chat/conversations/direct', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setShowNewDirectModal(false);
        await fetchConversations();
        setActiveConvId(data.data._id);
        setFilterTab('all');
      } else {
        alert(data.message || 'Could not start conversation');
      }
    } catch (err) {
      alert('Error initiating chat');
    }
  };

  // 10. Create Group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    setCreatingGroup(true);
    try {
      const res = await fetch('/api/chat/conversations/group', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          participantIds: selectedGroupMembers,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setShowNewGroupModal(false);
        setNewGroupName('');
        setNewGroupDesc('');
        setSelectedGroupMembers([]);
        await fetchConversations();
        setActiveConvId(data.data._id);
        setFilterTab('all');
      } else {
        alert(data.message || 'Could not create group');
      }
    } catch (err) {
      alert('Error creating group');
    } finally {
      setCreatingGroup(false);
    }
  };

  // 11. Blocked Users
  const fetchBlockedUsers = async () => {
    try {
      setLoadingBlocked(true);
      const res = await fetch('/api/chat/blocked-users', {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setBlockedList(data.data);
      }
    } catch (err) {
      console.error('fetchBlockedUsers error:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const openBlockedModal = () => {
    setShowBlockedModal(true);
    fetchBlockedUsers();
  };

  // 12. Toggle Pin
  const handleTogglePin = async (targetConvId) => {
    const id = targetConvId || activeConvId;
    if (!id) return;
    try {
      const res = await fetch(`/api/chat/conversations/${id}/pin`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success) {
        setConversations((prev) =>
          prev.map((c) => (c._id === id ? { ...c, isPinned: data.isPinned } : c))
        );
      }
    } catch (err) {
      console.error('handleTogglePin error:', err);
    }
  };

  // 13. Clear History
  const handleClearHistory = async (targetConvId) => {
    const id = targetConvId || activeConvId;
    if (!id) return;
    setIsDeletingChat(true);
    try {
      const res = await fetch(`/api/chat/conversations/${id}/clear`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success) {
        if (activeConvId === id) setMessages([]);
        setConversationToDelete(null);
      } else {
        alert(data.message || 'Could not clear history');
      }
    } catch (err) {
      alert('Error clearing history');
    } finally {
      setIsDeletingChat(false);
    }
  };

  // 13b. Delete Entire Conversation
  const handleDeleteConversation = async (targetConvId) => {
    const id = targetConvId || activeConvId;
    if (!id) return;
    setIsDeletingChat(true);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success) {
        setConversationToDelete(null);
        setConversations((prev) => {
          const remaining = prev.filter((c) => c._id !== id);
          if (activeConvId === id) {
            setActiveConvId(remaining.length > 0 ? remaining[0]._id : null);
            setMessages([]);
          }
          return remaining;
        });
      } else {
        alert(data.message || 'Could not delete conversation');
      }
    } catch (err) {
      alert('Error deleting conversation');
    } finally {
      setIsDeletingChat(false);
    }
  };

  // 13c. Multi-Select Handlers
  const handleToggleSelectConv = (convId) => {
    setSelectedConvIds((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedConvIds.length === selectableConversations.length) {
      setSelectedConvIds([]);
    } else {
      setSelectedConvIds(selectableConversations.map((c) => c._id));
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedConvIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/chat/conversations/bulk-delete', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ conversationIds: selectedConvIds }),
      });
      const data = await res.json();
      if (data.success) {
        const deletedSet = new Set(selectedConvIds);
        setShowBulkDeleteModal(false);
        setIsSelectMode(false);
        setSelectedConvIds([]);

        setConversations((prev) => {
          const remaining = prev.filter((c) => !deletedSet.has(c._id));
          if (deletedSet.has(activeConvId)) {
            setActiveConvId(remaining.length > 0 ? remaining[0]._id : null);
            setMessages([]);
          }
          return remaining;
        });
      } else {
        alert(data.message || 'Could not delete selected conversations');
      }
    } catch (err) {
      console.error('handleConfirmBulkDelete error:', err);
      alert('Error deleting conversations');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // 14. Delete Message (For self or for everyone)
  const handleDeleteMessage = async (msgId, forEveryone = false) => {
    if (!msgId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chat/messages/${msgId}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
        body: JSON.stringify({ forEveryone }),
      });
      const data = await res.json();
      if (data.success) {
        if (forEveryone) {
          setMessages((prev) =>
            prev.map((m) =>
              (m._id || m.id) === msgId
                ? {
                    ...m,
                    isDeletedForEveryone: true,
                    text: 'This message was deleted',
                    mediaUrl: '',
                    reactions: [],
                  }
                : m
            )
          );
        } else {
          setMessages((prev) => prev.filter((m) => (m._id || m.id) !== msgId));
        }
        setDeleteConfirmModal(null);
        setActiveActionMenuMsgId(null);
      } else {
        alert(data.message || 'Could not delete message');
      }
    } catch (err) {
      alert('Error deleting message');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort conversations: Pinned always at top, then latest activity
  const filteredConversations = useMemo(() => {
    const list = conversations.filter((conv) => {
      // Tab filter
      if (filterTab === 'community') return conv.isCommunity;
      if (filterTab === 'direct') return conv.type === 'direct' && !conv.isCommunity;
      if (filterTab === 'group') return conv.type === 'group'; // Includes both custom groups and community

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (conv.name || '').toLowerCase().includes(q);
        const lastMsgMatch = (conv.lastMessage?.text || '').toLowerCase().includes(q);
        return nameMatch || lastMsgMatch;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const aPinned = !!a.isPinned;
      const bPinned = !!b.isPinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const aTime = new Date(a.lastActivity || a.updatedAt || 0).getTime();
      const bTime = new Date(b.lastActivity || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [conversations, filterTab, searchQuery]);

  // Non-community conversations eligible for bulk selection
  const selectableConversations = useMemo(() => {
    return filteredConversations.filter((c) => !c.isCommunity);
  }, [filteredConversations]);

  // Direct chat info
  const otherParticipant = activeConversation?.otherParticipant;
  const isDirectChat = activeConversation?.type === 'direct';
  const isBlockedByMe = otherParticipant?.isBlockedByMe;
  const hasBlockedMe = otherParticipant?.hasBlockedMe;
  const isBlockedState = isBlockedByMe || hasBlockedMe;

  // Active chat title
  const activeChatTitle = useMemo(() => {
    if (!activeConversation) return 'Select a conversation';
    if (activeConversation.isCommunity) return activeConversation.name || `${currentGym?.name || 'Gym'} Community`;
    if (activeConversation.type === 'direct') return otherParticipant?.name || activeConversation.name || 'Gym Member';
    return activeConversation.name || 'Gym Group';
  }, [activeConversation, otherParticipant, currentGym]);

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 72px)',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ========================================================
          LEFT PANE: CONVERSATION LIST (SIDEBAR)
      ======================================================== */}
      <div
        style={{
          width: '380px',
          minWidth: '320px',
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Gym Chat
                </h1>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '100px',
                    background: socketConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: socketConnected ? '#10b981' : '#ef4444',
                    border: `1px solid ${socketConnected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: socketConnected ? '#10b981' : '#ef4444',
                    }}
                  />
                  {socketConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {currentGym?.name || 'Your Gym'} Community Hub
              </p>
            </div>

            {/* Top Action Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={openNewDirectModal}
                title="Direct 1-on-1 Chat with Member/Trainer"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--brand-primary, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <UserPlus size={18} />
              </button>
              <button
                onClick={openNewGroupModal}
                title="Create New Gym Group"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#06b6d4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Users size={18} />
              </button>
              <button
                onClick={openBlockedModal}
                title="Blocked Members"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ShieldBan size={18} />
              </button>
              {/* Multi-Select Toggle Button */}
              <button
                onClick={() => {
                  const next = !isSelectMode;
                  setIsSelectMode(next);
                  if (!next) setSelectedConvIds([]);
                }}
                title={isSelectMode ? 'Exit Selection Mode' : 'Select Multiple Chats to Delete'}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isSelectMode ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)',
                  border: `1px solid ${isSelectMode ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
                  color: isSelectMode ? '#ef4444' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <CheckSquare size={17} />
              </button>
            </div>
          </div>

          {/* Multi-Select Floating Action Bar */}
          {isSelectMode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                marginBottom: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="selectAllCheckbox"
                  checked={
                    selectableConversations.length > 0 &&
                    selectedConvIds.length === selectableConversations.length
                  }
                  onChange={handleToggleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ef4444' }}
                />
                <label
                  htmlFor="selectAllCheckbox"
                  style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {selectedConvIds.length > 0 ? `${selectedConvIds.length} Selected` : 'Select All'}
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {selectedConvIds.length > 0 && (
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete ({selectedConvIds.length})</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedConvIds([]);
                  }}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search conversations & chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'all', label: 'All Chats' },
              { id: 'community', label: 'Community' },
              { id: 'direct', label: 'Direct Messages' },
              { id: 'group', label: 'Groups & Crews' },
            ].map((tab) => {
              const isSelected = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '100px',
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 800 : 600,
                    background: isSelected ? 'var(--brand-primary, #6366f1)' : 'var(--bg-input)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid transparent' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          {loadingConv ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '0.85rem' }}>Loading gym chats...</div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--brand-primary, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <MessageSquare size={26} />
              </div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                {filterTab === 'direct' ? 'No Direct Chats Yet' : 'No Chats in this Tab'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                {filterTab === 'direct'
                  ? 'Connect 1-on-1 with any trainer or gym member.'
                  : 'Start chatting with gym members or switch to All Chats!'}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={openNewDirectModal}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Find Members
                </button>
                <button
                  onClick={() => setFilterTab('all')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View All
                </button>
              </div>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConvIds.includes(conv._id);
              const isActive = conv._id === activeConvId && !isSelectMode;
              const isOtherOnline = conv.type === 'direct' && conv.otherParticipant?.isOnline;
              const isBlocked = conv.type === 'direct' && conv.otherParticipant?.isBlockedByMe;
              const convTitle = conv.name || (conv.type === 'direct' ? conv.otherParticipant?.name : 'Gym Group') || 'Chat';

              return (
                <div
                  key={conv._id}
                  onClick={() => {
                    if (isSelectMode) {
                      if (!conv.isCommunity) handleToggleSelectConv(conv._id);
                    } else {
                      setActiveConvId(conv._id);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isSelectMode ? '10px' : '12px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(239, 68, 68, 0.12)'
                      : isActive
                      ? 'var(--brand-primary-light, rgba(99, 102, 241, 0.15))'
                      : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : isActive
                      ? '1px solid var(--border-focus, #6366f1)'
                      : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isSelected) e.currentTarget.style.background = 'var(--bg-card-hover, rgba(0, 0, 0, 0.04))';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Multi-Select Checkbox */}
                  {isSelectMode && (
                    <div
                      style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!conv.isCommunity) handleToggleSelectConv(conv._id);
                      }}
                    >
                      {conv.isCommunity ? (
                        <span title="Community Lounge (Protected)" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                          🔒
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#ef4444',
                            display: 'block',
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Avatar with Online Dot */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: conv.isCommunity ? '14px' : '50%',
                        background: conv.isCommunity
                          ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                          : conv.type === 'group'
                          ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                          : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        boxShadow: isActive ? '0 0 16px rgba(99, 102, 241, 0.3)' : 'none',
                      }}
                    >
                      {conv.isCommunity ? (
                        <Flame size={22} />
                      ) : conv.type === 'group' ? (
                        <Users size={20} />
                      ) : (
                        (convTitle || 'M').charAt(0).toUpperCase()
                      )}
                    </div>
                    {isOtherOnline && (
                      <span
                        title="Online"
                        style={{
                          position: 'absolute',
                          bottom: '0px',
                          right: '0px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#10b981',
                          border: '2px solid var(--bg-card)',
                          boxShadow: '0 0 8px #10b981',
                        }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {convTitle}
                        </span>
                        {conv.isPinned && <Pin size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                      </div>

                      {/* Time & Quick Actions */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(conv._id);
                          }}
                          title={conv.isPinned ? 'Unpin' : 'Pin to top'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                            color: conv.isPinned ? '#f59e0b' : 'var(--text-muted)',
                            opacity: conv.isPinned ? 1 : 0.45,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = conv.isPinned ? '1' : '0.45';
                            e.currentTarget.style.background = 'none';
                          }}
                        >
                          <Pin size={12} />
                        </button>

                        {!conv.isCommunity && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversationToDelete(conv);
                            }}
                            title="Delete Conversation"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '3px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                              color: 'var(--text-muted)',
                              opacity: 0.45,
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0.45';
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'none';
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}

                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {conv.lastActivity
                            ? new Date(conv.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                    </div>

                    {/* Preview + Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.78rem',
                          color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontWeight: conv.unreadCount > 0 ? 700 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '190px',
                        }}
                      >
                        {isBlocked ? (
                          <span style={{ color: '#ef4444' }}>🚫 Member Blocked</span>
                        ) : conv.lastMessage?.text ? (
                          conv.lastMessage.text
                        ) : (
                          'No messages yet'
                        )}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* Role tag for 1-on-1 */}
                        {conv.roleBadge && conv.roleBadge !== 'member' && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: conv.roleBadge === 'admin' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(6, 182, 212, 0.18)',
                              color: conv.roleBadge === 'admin' ? '#9333ea' : '#0284c7',
                            }}
                          >
                            {conv.roleBadge}
                          </span>
                        )}

                        {/* Unread Counter */}
                        {conv.unreadCount > 0 && (
                          <span
                            style={{
                              background: '#ef4444',
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '100px',
                              minWidth: '18px',
                              textAlign: 'center',
                              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                            }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          RIGHT PANE: ACTIVE CHAT WINDOW
      ======================================================== */}
      {activeConversation ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-main)',
            position: 'relative',
          }}
        >
          {/* Chat Window Header */}
          <div
            style={{
              padding: '14px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: activeConversation.isCommunity ? '12px' : '50%',
                    background: activeConversation.isCommunity
                      ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                      : activeConversation.type === 'group'
                      ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                  }}
                >
                  {activeConversation.isCommunity ? (
                    <Flame size={22} />
                  ) : activeConversation.type === 'group' ? (
                    <Users size={20} />
                  ) : (
                    activeChatTitle.charAt(0).toUpperCase()
                  )}
                </div>
                {otherParticipant?.isOnline && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0px',
                      right: '0px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '2px solid var(--bg-card)',
                    }}
                  />
                )}
              </div>

              {/* Title & Status */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      margin: 0,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {activeChatTitle}
                  </h2>
                  {activeConversation.isCommunity && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      OFFICIAL GYM LOUNGE
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeConversation.isCommunity ? (
                    <span>All gym members & trainers • Open chat lounge</span>
                  ) : activeConversation.type === 'group' ? (
                    <span>
                      {activeConversation.participants?.length || 0} gym members
                      {activeConversation.onlineCount > 0 && ` • ${activeConversation.onlineCount} online`}
                    </span>
                  ) : (
                    <span>
                      {otherParticipant?.role ? `${otherParticipant.role.toUpperCase()} • ` : ''}
                      {otherParticipant?.isOnline ? (
                        <span style={{ color: '#10b981', fontWeight: 700 }}>Active now</span>
                      ) : (
                        'Offline'
                      )}
                      {isBlockedByMe && <span style={{ color: '#ef4444', marginLeft: '6px', fontWeight: 700 }}>(Blocked by you)</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Pin Chat */}
              <button
                onClick={handleTogglePin}
                title={activeConversation.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                style={{
                  padding: '8px 12px',
                  borderRadius: '9px',
                  background: activeConversation.isPinned ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)',
                  border: `1px solid ${activeConversation.isPinned ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-subtle)'}`,
                  color: activeConversation.isPinned ? '#d97706' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <Pin size={14} />
                <span>{activeConversation.isPinned ? 'Pinned' : 'Pin'}</span>
              </button>

              {/* Group Info Modal Button */}
              {activeConversation.type === 'group' && !activeConversation.isCommunity && (
                <button
                  onClick={() => setShowGroupInfoModal(true)}
                  title="Group Info & Members"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '9px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <Users size={14} />
                  <span>Members</span>
                </button>
              )}

              {/* Block / Unblock Button (for 1-on-1 chats) */}
              {isDirectChat && otherParticipant?._id && (
                <button
                  onClick={() => handleToggleBlock(otherParticipant._id, isBlockedByMe)}
                  title={isBlockedByMe ? 'Unblock Member' : 'Block Member'}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '9px',
                    background: isBlockedByMe ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)',
                    border: `1px solid ${isBlockedByMe ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)'}`,
                    color: isBlockedByMe ? '#ef4444' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  <ShieldBan size={14} />
                  <span>{isBlockedByMe ? 'Unblock' : 'Block'}</span>
                </button>
              )}

              {/* Clear / Delete Conversation */}
              {!activeConversation?.isCommunity && (
                <button
                  onClick={() => setConversationToDelete(activeConversation)}
                  title="Delete or Clear Conversation"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '9px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'var(--bg-input)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {loadingMsgs ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '0.85rem' }}>Loading conversation history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div
                style={{
                  margin: 'auto',
                  textAlign: 'center',
                  maxWidth: '440px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '20px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--brand-primary, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Dumbbell size={28} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  Start The Conversation!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 18px' }}>
                  Say hello, arrange a spotter on the bench, share fitness tips or celebrate your workout PR!
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {QUICK_GYM_CHIPS.slice(0, 3).map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.text, chip.type)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '100px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--brand-primary, #6366f1)';
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.background = 'var(--bg-input)';
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwn =
                  msg.sender?._id?.toString() === user?._id?.toString() ||
                  msg.sender?.toString() === user?._id?.toString();
                const isSystem = msg.messageType === 'system' || msg.messageType === 'announcement';

                if (isSystem) {
                  return (
                    <div
                      key={msg._id || index}
                      style={{
                        margin: '12px auto',
                        padding: '6px 18px',
                        borderRadius: '100px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        maxWidth: '85%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      📢 {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg._id || index}
                    onMouseEnter={() => setHoveredMsgId(msg._id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      position: 'relative',
                    }}
                  >
                    {/* Sender Name in Group */}
                    {!isOwn && activeConversation.type === 'group' && (
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{msg.senderName}</span>
                        {msg.senderRole && msg.senderRole !== 'member' && (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: msg.senderRole === 'admin' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(6, 182, 212, 0.18)',
                              color: msg.senderRole === 'admin' ? '#9333ea' : '#0284c7',
                            }}
                          >
                            {msg.senderRole}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bubble + Floating Action Pill Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexDirection: isOwn ? 'row-reverse' : 'row',
                        maxWidth: '85%',
                        position: 'relative',
                      }}
                    >
                      {/* Message Bubble */}
                      <div
                        style={{
                          maxWidth: '100%',
                          padding: msg.messageType === 'image' ? '6px' : '11px 16px',
                          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isOwn
                            ? msg.messageType === 'workout_pr'
                              ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                              : 'linear-gradient(135deg, #6366f1, #4f46e5)'
                            : 'var(--bg-card)',
                          color: isOwn ? '#ffffff' : 'var(--text-primary)',
                          border: isOwn ? 'none' : '1px solid var(--border-subtle)',
                          boxShadow: isOwn
                            ? '0 4px 14px rgba(99, 102, 241, 0.3)'
                            : 'var(--shadow-card, 0 2px 8px rgba(0, 0, 0, 0.06))',
                          position: 'relative',
                        }}
                      >
                        {/* Quoted Reply Preview inside bubble at top */}
                        {msg.replyTo && msg.replyTo.text && (
                          <div
                            style={{
                              fontSize: '0.74rem',
                              padding: '5px 9px',
                              borderRadius: '8px',
                              background: isOwn ? 'rgba(0, 0, 0, 0.22)' : 'var(--bg-input)',
                              borderLeft: `3px solid ${isOwn ? '#ffffff' : 'var(--brand-primary, #6366f1)'}`,
                              marginBottom: '8px',
                              color: isOwn ? 'rgba(255, 255, 255, 0.92)' : 'var(--text-secondary)',
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: '0.7rem', color: isOwn ? '#ffffff' : 'var(--brand-primary, #6366f1)' }}>
                              {msg.replyTo.senderName}
                            </div>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                              {msg.replyTo.text}
                            </div>
                          </div>
                        )}

                        {/* Workout PR Tag */}
                        {msg.messageType === 'workout_pr' && !msg.isDeletedForEveryone && (
                          <div
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              background: 'rgba(0, 0, 0, 0.3)',
                              color: '#ffffff',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              marginBottom: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Flame size={12} /> PERSONAL RECORD
                          </div>
                        )}

                        {/* Image Message */}
                        {msg.mediaUrl && !msg.isDeletedForEveryone && (
                          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: msg.text ? '8px' : '0' }}>
                            <img
                              src={msg.mediaUrl}
                              alt="Attachment"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '320px',
                                display: 'block',
                                borderRadius: '12px',
                                objectFit: 'cover',
                              }}
                            />
                          </div>
                        )}

                        {/* Deleted Message Placeholder or Real Text */}
                        {msg.isDeletedForEveryone ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontStyle: 'italic',
                              color: isOwn ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-muted)',
                              fontSize: '0.86rem',
                              padding: '2px 0',
                            }}
                          >
                            <Ban size={14} style={{ opacity: 0.8 }} />
                            <span>This message was deleted</span>
                          </div>
                        ) : (
                          msg.text && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.92rem',
                                lineHeight: 1.5,
                                wordBreak: 'break-word',
                              }}
                            >
                              {msg.text}
                            </p>
                          )
                        )}

                        {/* Time & Read Tick */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                            marginTop: '4px',
                            fontSize: '0.66rem',
                            color: isOwn ? 'rgba(255, 255, 255, 0.85)' : 'var(--text-muted)',
                          }}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOwn && <CheckCheck size={12} style={{ color: '#38bdf8' }} />}
                        </div>
                      </div>

                      {/* Sleek Floating Action Trigger Pill (React, Reply & Delete) */}
                      {!msg.isDeletedForEveryone && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '100px',
                            padding: '3px 6px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                            opacity: hoveredMsgId === msg._id || activeActionMenuMsgId === msg._id ? 1 : 0,
                            pointerEvents: hoveredMsgId === msg._id || activeActionMenuMsgId === msg._id ? 'auto' : 'none',
                            transition: 'opacity 0.15s ease, transform 0.15s ease',
                            transform: hoveredMsgId === msg._id || activeActionMenuMsgId === msg._id ? 'scale(1)' : 'scale(0.85)',
                            position: 'relative',
                          }}
                        >
                          {/* Emoji React Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenuMsgId((prev) => (prev === msg._id ? null : msg._id));
                            }}
                            title="React with Emoji"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                              padding: '3px 4px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#f59e0b')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                          >
                            <Smile size={15} />
                          </button>

                          {/* Quick Reply Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyToMessage(msg);
                              setActiveActionMenuMsgId(null);
                              setTimeout(() => textareaRef.current?.focus(), 50);
                            }}
                            title="Reply to message"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                              padding: '3px 4px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-primary, #6366f1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                          >
                            <Reply size={15} />
                          </button>

                          {/* Quick Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isSender = (msg.sender?._id || msg.sender)?.toString() === user?._id?.toString();
                              const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
                              setDeleteConfirmModal({
                                message: msg,
                                canDeleteForEveryone: isSender || isAdmin,
                              });
                              setActiveActionMenuMsgId(null);
                            }}
                            title="Delete Message"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                              padding: '3px 4px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* Popover / Dropdown Menu when active */}
                          {activeActionMenuMsgId === msg._id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                position: 'absolute',
                                bottom: 'calc(100% + 8px)',
                                [isOwn ? 'right' : 'left']: 0,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '16px',
                                padding: '8px 10px',
                                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
                                zIndex: 60,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                minWidth: '270px',
                                backdropFilter: 'blur(16px)',
                              }}
                            >
                              {/* Emoji Row */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                                {EMOJI_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      handleToggleReaction(msg._id, emoji);
                                      setActiveActionMenuMsgId(null);
                                    }}
                                    style={{
                                      fontSize: '1.25rem',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '3px 4px',
                                      borderRadius: '8px',
                                      transition: 'transform 0.12s ease',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.35)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>

                              <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

                              {/* Dropdown Options */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <button
                                  onClick={() => {
                                    setReplyToMessage(msg);
                                    setActiveActionMenuMsgId(null);
                                    setTimeout(() => textareaRef.current?.focus(), 50);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '7px 10px',
                                    borderRadius: '8px',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <Reply size={14} style={{ color: 'var(--brand-primary, #6366f1)' }} />
                                  <span>Reply to message</span>
                                </button>

                                {msg.text && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard?.writeText(msg.text);
                                      setCopiedMsgId(msg._id);
                                      setTimeout(() => setCopiedMsgId(null), 2000);
                                      setActiveActionMenuMsgId(null);
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '7px 10px',
                                      borderRadius: '8px',
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--text-primary)',
                                      fontSize: '0.82rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                  >
                                    <Check size={14} style={{ color: '#10b981' }} />
                                    <span>{copiedMsgId === msg._id ? 'Copied to clipboard!' : 'Copy message text'}</span>
                                  </button>
                                )}

                                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 0' }} />

                                <button
                                  onClick={() => {
                                    const isSender = (msg.sender?._id || msg.sender)?.toString() === user?._id?.toString();
                                    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
                                    setDeleteConfirmModal({
                                      message: msg,
                                      canDeleteForEveryone: isSender || isAdmin,
                                    });
                                    setActiveActionMenuMsgId(null);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '7px 10px',
                                    borderRadius: '8px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.15s',
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                  <Trash2 size={14} style={{ color: '#ef4444' }} />
                                  <span>Delete message</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reactions Bar Below Bubble - ONLY displayed if reactions exist */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '4px',
                          marginTop: '4px',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        {msg.reactions.map((r, rIdx) => {
                          const hasReacted = r.users?.some(
                            (u) => u.toString() === user?._id?.toString()
                          );
                          return (
                            <button
                              key={rIdx}
                              onClick={() => handleToggleReaction(msg._id, r.emoji)}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '100px',
                                background: hasReacted ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-input)',
                                border: `1px solid ${hasReacted ? 'var(--brand-primary, #6366f1)' : 'var(--border-subtle)'}`,
                                color: 'var(--text-primary)',
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                              }}
                            >
                              <span>{r.emoji}</span>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{r.users?.length || 1}</span>
                            </button>
                          );
                        })}

                        {/* Add reaction trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenuMsgId((prev) => (prev === msg._id ? null : msg._id));
                          }}
                          title="Add reaction"
                          style={{
                            padding: '2px 7px',
                            borderRadius: '100px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {typingUsers.has(activeConvId) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--brand-primary, #6366f1)',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  width: 'fit-content',
                }}
              >
                <span>💬 {typingUsers.get(activeConvId)?.name} is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Workout Chips Bar */}
          <div
            style={{
              padding: '8px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              background: 'var(--bg-card)',
            }}
          >
            {QUICK_GYM_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.text, chip.type)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
                  e.currentTarget.style.borderColor = 'var(--brand-primary, #6366f1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-input)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Blocked State Notice OR Input Box */}
          {isBlockedState ? (
            <div
              style={{
                padding: '18px 24px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderTop: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldBan size={22} style={{ color: '#ef4444' }} />
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ef4444' }}>
                    {isBlockedByMe ? 'You have blocked this member' : 'You cannot reply to this conversation'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {isBlockedByMe
                      ? 'Unblock them to send or receive messages again.'
                      : 'This member has blocked you from direct messages.'}
                  </div>
                </div>
              </div>

              {isBlockedByMe && (
                <button
                  onClick={() => handleToggleBlock(otherParticipant?._id, true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Unblock Member
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
              }}
            >
              {/* Replying-to Preview */}
              {replyToMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    borderLeft: '3px solid var(--brand-primary, #6366f1)',
                    marginBottom: '8px',
                    fontSize: '0.78rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--brand-primary, #6366f1)', fontWeight: 700 }}>
                      Replying to {replyToMessage.senderName}:{' '}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{replyToMessage.text}</span>
                  </div>
                  <button
                    onClick={() => setReplyToMessage(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Input Form */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Textarea */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Type your message, workout update or question... (Enter to send)"
                    value={inputText}
                    onChange={handleTypingChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isSending && inputText.trim()) {
                          handleSendMessage();
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      maxHeight: '120px',
                    }}
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={() => {
                    if (!isSending && inputText.trim()) {
                      handleSendMessage();
                    }
                  }}
                  disabled={!inputText.trim() || isSending}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: inputText.trim() && !isSending
                      ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                      : 'var(--bg-input)',
                    color: inputText.trim() && !isSending ? '#ffffff' : 'var(--text-muted)',
                    border: inputText.trim() && !isSending ? 'none' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputText.trim() && !isSending ? 'pointer' : 'default',
                    boxShadow: inputText.trim() && !isSending ? '0 4px 14px rgba(99, 102, 241, 0.35)' : 'none',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty Right Pane when no conversation selected */
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '24px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--brand-primary, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <MessageSquare size={38} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            GymPulse Member & Trainer Chat
          </h2>
          <p style={{ maxWidth: '420px', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
            Select an existing conversation from the list or start a direct message with any member or coach in your gym.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={openNewDirectModal}
              style={{
                padding: '11px 22px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Direct Message Member
            </button>
            <button
              onClick={openNewGroupModal}
              style={{
                padding: '11px 20px',
                borderRadius: '10px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Create Group Crew
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: NEW DIRECT CHAT (SEARCH GYM MEMBERS)
      ======================================================== */}
      {showNewDirectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '24px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-card, 0 20px 50px rgba(0, 0, 0, 0.2))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Start Direct Chat
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Members, trainers, and staff of {currentGym?.name || 'your gym'}
                </p>
              </div>
              <button
                onClick={() => setShowNewDirectModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Member Search input */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search member or trainer by name, role or phone..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Member List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingMembers ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading gym members...
                </div>
              ) : (
                gymMembers
                  .filter((m) => {
                    if (!memberSearchQuery.trim()) return true;
                    const q = memberSearchQuery.toLowerCase();
                    return (
                      m.name?.toLowerCase().includes(q) ||
                      m.role?.toLowerCase().includes(q) ||
                      m.phone?.includes(q)
                    );
                  })
                  .map((mem) => (
                    <div
                      key={mem._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: mem.role === 'admin' ? '#8b5cf6' : mem.role === 'staff' ? '#06b6d4' : '#6366f1',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            position: 'relative',
                          }}
                        >
                          {mem.name.charAt(0).toUpperCase()}
                          {mem.isOnline && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '0px',
                                right: '0px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#10b981',
                                border: '2px solid var(--bg-card)',
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {mem.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: mem.role === 'admin' ? 'rgba(168, 85, 247, 0.18)' : mem.role === 'staff' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                                color: mem.role === 'admin' ? '#9333ea' : mem.role === 'staff' ? '#0284c7' : '#059669',
                              }}
                            >
                              {mem.role === 'staff' ? 'Trainer' : mem.role}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {mem.phone ? `+91 ${mem.phone}` : mem.email}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => startDirectChat(mem._id)}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Chat
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CREATE GYM GROUP CREW
      ======================================================== */}
      {showNewGroupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '24px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Create Gym Group
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Build workout crews, batch groups or trainer circles
                </p>
              </div>
              <button
                onClick={() => setShowNewGroupModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Group Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Morning Heavy Lifters, 6AM Cardio Crew"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Group Description
              </label>
              <input
                type="text"
                placeholder="Workout targets, timing, rules..."
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Select Members to Add ({selectedGroupMembers.length} selected)
            </div>

            {/* Members Checklist */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {gymMembers.map((mem) => {
                const isSelected = selectedGroupMembers.includes(mem._id);
                return (
                  <div
                    key={mem._id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGroupMembers(selectedGroupMembers.filter((id) => id !== mem._id));
                      } else {
                        setSelectedGroupMembers([...selectedGroupMembers, mem._id]);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input)',
                      border: `1px solid ${isSelected ? 'var(--brand-primary, #6366f1)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{mem.name}</span>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>({mem.role})</span>
                    </div>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: isSelected ? 'var(--brand-primary, #6366f1)' : 'transparent',
                        border: `1.5px solid ${isSelected ? 'var(--brand-primary, #6366f1)' : 'var(--border-subtle)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={creatingGroup || !newGroupName.trim()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: creatingGroup || !newGroupName.trim() ? 'default' : 'pointer',
              }}
            >
              {creatingGroup ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: BLOCKED MEMBERS MANAGEMENT
      ======================================================== */}
      {showBlockedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '24px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldBan size={22} style={{ color: '#ef4444' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Blocked Members
                </h3>
              </div>
              <button
                onClick={() => setShowBlockedModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Members you have blocked in this gym. They cannot send you direct messages.
            </p>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingBlocked ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading blocked list...
                </div>
              ) : blockedList.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={36} style={{ color: '#10b981', margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>No members blocked</p>
                  <p style={{ fontSize: '0.78rem', margin: '4px 0 0' }}>Your chat is open to all gym members.</p>
                </div>
              ) : (
                blockedList.map((entry) => (
                  <div
                    key={entry._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {entry.blocked?.name || 'Gym Member'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {entry.blocked?.phone ? `+91 ${entry.blocked.phone}` : entry.blocked?.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleBlock(entry.blocked?._id, true)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: GROUP INFO & PARTICIPANTS
      ======================================================== */}
      {showGroupInfoModal && activeConversation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '24px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {activeConversation.name}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {activeConversation.description || 'Gym Group Crew'}
                </p>
              </div>
              <button
                onClick={() => setShowGroupInfoModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Group Participants ({activeConversation.participants?.length || 0})
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeConversation.participants?.map((p) => (
                <div
                  key={p._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--brand-primary, #6366f1)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ========================================================
          MODAL 5: DELETE MESSAGE CONFIRMATION
      ======================================================== */}
      {deleteConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !isDeleting && setDeleteConfirmModal(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-card, 0 20px 50px rgba(0, 0, 0, 0.25))',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Delete Message?
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Choose how you want to delete this message
                </p>
              </div>
            </div>

            {/* Message snippet preview */}
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '18px',
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                maxHeight: '75px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontStyle: 'italic',
              }}
            >
              {deleteConfirmModal.message?.mediaUrl
                ? '📷 [Photo attachment]'
                : deleteConfirmModal.message?.text || 'Selected message'}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {deleteConfirmModal.canDeleteForEveryone && (
                <button
                  onClick={() => handleDeleteMessage(deleteConfirmModal.message._id, true)}
                  disabled={isDeleting}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete for Everyone'}
                </button>
              )}

              <button
                onClick={() => handleDeleteMessage(deleteConfirmModal.message._id, false)}
                disabled={isDeleting}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Delete for Me
              </button>

              <button
                onClick={() => setDeleteConfirmModal(null)}
                disabled={isDeleting}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: DELETE OR CLEAR CONVERSATION CONFIRMATION
      ======================================================== */}
      {conversationToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !isDeletingChat && setConversationToDelete(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-card, 0 20px 50px rgba(0, 0, 0, 0.25))',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Delete Conversation?
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {conversationToDelete.name || conversationToDelete.otherParticipant?.name || 'Chat'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
              Are you sure you want to delete this chat with <strong>{conversationToDelete.name || conversationToDelete.otherParticipant?.name || 'this member'}</strong>? It will be removed from your conversations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <button
                onClick={() => handleDeleteConversation(conversationToDelete._id)}
                disabled={isDeletingChat}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: isDeletingChat ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={16} />
                <span>{isDeletingChat ? 'Deleting...' : 'Delete Entire Conversation'}</span>
              </button>

              <button
                onClick={() => handleClearHistory(conversationToDelete._id)}
                disabled={isDeletingChat}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: isDeletingChat ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isDeletingChat ? 'Clearing...' : 'Clear Messages Only'}
              </button>

              <button
                onClick={() => setConversationToDelete(null)}
                disabled={isDeletingChat}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 7: BULK DELETE CONVERSATIONS CONFIRMATION
      ======================================================== */}
      {showBulkDeleteModal && selectedConvIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !isBulkDeleting && setShowBulkDeleteModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: 'var(--shadow-card, 0 20px 50px rgba(0, 0, 0, 0.25))',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Delete {selectedConvIds.length} Conversations?
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete the <strong>{selectedConvIds.length} selected conversation{selectedConvIds.length > 1 ? 's' : ''}</strong> and all their message history?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={isBulkDeleting}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: isBulkDeleting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={16} />
                <span>
                  {isBulkDeleting
                    ? 'Deleting...'
                    : `Delete ${selectedConvIds.length} Conversation${selectedConvIds.length > 1 ? 's' : ''}`}
                </span>
              </button>

              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
