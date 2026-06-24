'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Inbox, SendHorizontal, MessageSquare, ChevronLeft, Reply } from 'lucide-react';
import { toast } from 'sonner';
import { useMessages } from '@/lib/hooks/useMessages';
import type { SchoolMessage } from '@/types/school';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';

type Tab = 'inbox' | 'sent' | 'compose';

function MessageCard({ msg, onClick, isSent }: { msg: SchoolMessage; onClick: () => void; isSent?: boolean }) {
  const other = isSent ? msg.recipient : msg.sender;
  const name = other?.firstName ? `${other.firstName} ${other.lastName || ''}` : other?.username || 'Unknown';
  const initials = name[0]?.toUpperCase() || '?';
  const isUnread = !isSent && !msg.isReadByRecipient;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
        isUnread ? 'border-primary bg-blue-50/50 hover:bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${isUnread ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate ${isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
              {name}
            </p>
            <span className="text-[10px] text-slate-400 shrink-0">
              {new Date(msg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <p className={`text-xs mt-0.5 truncate ${isUnread ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
            {msg.subject}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{msg.body}</p>
        </div>
        {isUnread && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
      </div>
    </motion.div>
  );
}

export default function ParentMessagesPage() {
  const { inbox, sent, unreadCount, loading, sendMessage, replyToMessage, markAsRead } = useMessages();
  const [tab, setTab] = useState<Tab>('inbox');
  const [selectedMsg, setSelectedMsg] = useState<SchoolMessage | null>(null);
  const [composeTo, setComposeTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [recipients, setRecipients] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'compose') {
      const fetchRecipients = async () => {
        try {
          const res = await api.get('/users');
          const list = res.data.filter((u: any) =>
            u.schoolRole === 'ADMIN' ||
            u.schoolRole === 'TEACHER' ||
            u.schoolRole === 'ACCOUNTANT' ||
            u.schoolRole === 'ACCOUNTLEAD'
          );
          setRecipients(list);
        } catch (err) {
          console.error('Failed to load recipients list', err);
        }
      };
      fetchRecipients();
    }
  }, [tab]);

  const handleSend = async () => {
    if (!composeTo || !subject || !body) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    try {
      await sendMessage({ recipientId: Number(composeTo), subject, body });
      toast.success('Message sent successfully');
      setTab('sent');
      setComposeTo(''); setSubject(''); setBody('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedMsg || !replyBody) return;
    setSending(true);
    try {
      await replyToMessage(selectedMsg.id, replyBody);
      toast.success('Reply sent');
      setReplyBody('');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const openMessage = async (msg: SchoolMessage) => {
    setSelectedMsg(msg);
    if (!msg.isReadByRecipient && tab === 'inbox') {
      await markAsRead(msg.id);
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'inbox', label: 'Inbox', count: unreadCount },
    { id: 'sent', label: 'Sent' },
    { id: 'compose', label: 'New Message' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Communication</p>
        <h1 className="text-3xl font-black text-slate-900 mt-1">Messages</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelectedMsg(null); }}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              tab === t.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.id === 'inbox' && <Inbox className="w-4 h-4" />}
            {t.id === 'sent' && <SendHorizontal className="w-4 h-4" />}
            {t.id === 'compose' && <Send className="w-4 h-4" />}
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Message Thread View */}
      {selectedMsg ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-slate-100">
            <button onClick={() => setSelectedMsg(null)} className="p-2 rounded-xl hover:bg-slate-100">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <div className="flex-1">
              <h2 className="font-black text-slate-900">{selectedMsg.subject}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {tab === 'inbox' ? `From: ${selectedMsg.sender?.firstName || selectedMsg.sender?.username}` : `To: ${selectedMsg.recipient?.firstName || selectedMsg.recipient?.username}`}
                {' · '}
                {new Date(selectedMsg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedMsg.body}</p>
          </div>
          {tab === 'inbox' && (
            <div className="border-t border-slate-100 p-5">
              <div className="flex items-start gap-3">
                <Reply className="w-4 h-4 text-slate-400 mt-3 shrink-0" />
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  className="flex-1 resize-none border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleReply}
                  disabled={!replyBody || sending}
                  className="flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors mt-1 shrink-0"
                >
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
            </div>
          )}
        </div>
      ) : tab === 'compose' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 max-w-2xl">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">New Message</h2>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Recipient</label>
            <Select onValueChange={setComposeTo} value={composeTo}>
              <SelectTrigger className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-11 bg-white">
                <SelectValue placeholder="Select a recipient..." />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((r) => {
                  const name = r.firstName && r.lastName
                    ? `${r.firstName} ${r.lastName}`
                    : r.username;
                  return (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {name} ({r.schoolRole} - {r.email || r.username})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Message subject..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={6}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!composeTo || !subject || !body || sending}
            className="flex items-center gap-2 bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-primary" />
            </div>
          ) : (tab === 'inbox' ? inbox : sent).length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-400 gap-3">
              <MessageSquare className="w-12 h-12 opacity-30" />
              <p className="font-semibold">{tab === 'inbox' ? 'Inbox is empty' : 'No sent messages'}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {(tab === 'inbox' ? inbox : sent).map((msg: SchoolMessage) => (
                <MessageCard key={msg.id} msg={msg} isSent={tab === 'sent'} onClick={() => openMessage(msg)} />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
