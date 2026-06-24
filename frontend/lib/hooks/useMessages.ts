'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { SchoolMessage } from '@/types/school';

export function useMessages(pollInterval = 30000) {
  const [inbox, setInbox] = useState<SchoolMessage[]>([]);
  const [sent, setSent] = useState<SchoolMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const [inboxRes, sentRes, countRes] = await Promise.all([
        api.get('/messages/inbox'),
        api.get('/messages/sent'),
        api.get('/messages/unread-count'),
      ]);
      setInbox(inboxRes.data?.messages || inboxRes.data || []);
      setSent(sentRes.data?.messages || sentRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (data: {
    recipientId: number;
    subject: string;
    body: string;
    attachmentUrl?: string;
  }) => {
    const res = await api.post('/messages', data);
    await fetchMessages();
    return res.data;
  }, [fetchMessages]);

  const replyToMessage = useCallback(async (messageId: number, body: string) => {
    const res = await api.post(`/messages/${messageId}/reply`, { body });
    await fetchMessages();
    return res.data;
  }, [fetchMessages]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.patch(`/messages/${id}/read`);
      setInbox(prev => prev.map(m => m.id === id ? { ...m, isReadByRecipient: true } : m));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, []);

  const deleteMessage = useCallback(async (id: number) => {
    await api.delete(`/messages/${id}`);
    await fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, pollInterval);
    return () => clearInterval(interval);
  }, [fetchMessages, pollInterval]);

  return { inbox, sent, unreadCount, loading, sendMessage, replyToMessage, markAsRead, deleteMessage, refresh: fetchMessages };
}
