import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MoreHorizontal, ChevronDown } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import { messagingApi } from '../../api/messaging';
import { useAuthStore } from '../../store/auth.store';
import { Conversation, Message } from '../../types';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import styles from './MessagesPage.module.css';

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [activeId, setActiveId] = useState<string | undefined>(conversationId);
  const [input, setInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMsgCount = useRef(0);

  // Conversation list — poll every 8s
  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingApi.getConversations().then(r => r.data),
    refetchInterval: 8_000,
  });
  const conversations: Conversation[] = (convsData as any)?.results || (convsData as any) || [];

  // Messages — poll every 4s when conversation open
  const { data: messagesData } = useQuery({
    queryKey: ['messages', activeId],
    queryFn: () => messagingApi.getMessages(activeId!).then(r => r.data),
    enabled: !!activeId,
    refetchInterval: 4_000,
  });
  const messages: Message[] = (messagesData as any)?.results || [];

  // Detect new incoming messages
  useEffect(() => {
    if (!messages.length) return;
    const count = messages.length;
    if (prevMsgCount.current && count > prevMsgCount.current) {
      const lastNew = messages[messages.length - 1];
      if (lastNew.sender.id !== user?.id) {
        if (showScrollBtn) setNewMsgCount(n => n + (count - prevMsgCount.current));
        else scrollToBottom('smooth');
      } else {
        scrollToBottom('smooth');
      }
    }
    if (!prevMsgCount.current) scrollToBottom('instant');
    prevMsgCount.current = count;
  }, [messages.length]);

  // Mark read using IntersectionObserver on the last message
  useEffect(() => {
    if (!activeId || !messages.length) return;
    const lastMsg = document.getElementById(`msg-${messages[messages.length - 1]?.id}`);
    if (!lastMsg) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          messagingApi.markRead(activeId).catch(() => {});
          qc.invalidateQueries({ queryKey: ['conversations'] });
        }
      },
      { threshold: 1.0 }
    );
    observer.observe(lastMsg);
    return () => observer.disconnect();
  }, [activeId, messages.length]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = messageContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!nearBottom);
    if (nearBottom) setNewMsgCount(0);
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollBtn(false);
    setNewMsgCount(0);
  };

  // Typing indicator — fires on each keystroke
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!activeId) return;
    messagingApi.sendTyping(activeId).catch(() => {});
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  const sendMutation = useMutation({
    mutationFn: () => messagingApi.sendMessage(activeId!, input.trim()),
    onSuccess: () => {
      setInput('');
      qc.invalidateQueries({ queryKey: ['messages', activeId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSend = () => {
    if (!input.trim() || !activeId || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    prevMsgCount.current = 0;
    setNewMsgCount(0);
    navigate(`/messages/${id}`, { replace: true });
  };

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find(p => p.id !== user?.id);

  // Date separator helper
  const getDayLabel = (date: Date): string => {
    if (isToday(date)) return 'TODAY';
    if (isYesterday(date)) return 'YESTERDAY';
    return format(date, 'MMMM d, yyyy').toUpperCase();
  };

  // Group messages with date separators
  const groupedMessages: Array<
    { type: 'separator'; label: string } | { type: 'message'; msg: Message }
  > = [];
  messages.forEach((msg, i) => {
    const msgDate = new Date(msg.created_at);
    const prevMsg = messages[i - 1];
    if (!prevMsg || !isSameDay(new Date(prevMsg.created_at), msgDate)) {
      groupedMessages.push({ type: 'separator', label: getDayLabel(msgDate) });
    }
    groupedMessages.push({ type: 'message', msg });
  });

  const activeConv = conversations.find(c => c.id === activeId);
  const otherParticipant = activeConv ? getOtherParticipant(activeConv) : null;
  const otherInitials = `${otherParticipant?.first_name?.[0] || ''}${otherParticipant?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className={styles.wrapper}>
      <TopBar searchVisible={false} />
      <div className={styles.layout}>

        {/* ── Conversation List ─────────────────────────────── */}
        <aside className={`card ${styles.sidebar}`}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Messages</h2>
          </div>
          <div className={styles.convList}>
            {conversations.length === 0 && (
              <div className={styles.emptyConv}>
                <p style={{ fontWeight: 600 }}>No conversations yet.</p>
                <p style={{ fontSize: 12, marginTop: 6, color: 'var(--color-text-muted)' }}>
                  Visit a provider's profile and tap Message to start one.
                </p>
              </div>
            )}
            {conversations.map(conv => {
              const other = getOtherParticipant(conv);
              const initials = `${other?.first_name?.[0] || ''}${other?.last_name?.[0] || ''}`.toUpperCase();
              const isActive = conv.id === activeId;
              const meta = conv as any;
              const unread = meta.unread_count || 0;

              return (
                <div
                  key={conv.id}
                  className={`${styles.convItem} ${isActive ? styles.convActive : ''}`}
                  onClick={() => selectConversation(conv.id)}
                >
                  <div className={styles.convAvatar}>{initials}</div>
                  <div className={styles.convBody}>
                    <p className={styles.convName}>{other?.first_name} {other?.last_name}</p>
                    <p className={`${styles.convLast} ${unread > 0 ? styles.convLastUnread : ''}`}>
                      {conv.last_message?.body || 'Start the conversation'}
                    </p>
                  </div>
                  <div className={styles.convMeta}>
                    {conv.last_message && (
                      <p className={styles.convTime}>
                        {isToday(new Date(conv.last_message.created_at))
                          ? format(new Date(conv.last_message.created_at), 'h:mm a')
                          : format(new Date(conv.last_message.created_at), 'dd MMM')
                        }
                      </p>
                    )}
                    {unread > 0 && (
                      <span className={styles.unreadBadge}>{unread > 9 ? '9+' : unread}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Chat Area ─────────────────────────────────────── */}
        <div className={`card ${styles.chatArea}`}>
          {!activeId ? (
            <div className={styles.noChat}>
              <p style={{ fontWeight: 600 }}>Select a conversation</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 6 }}>
                Your messages will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderAvatar}>{otherInitials}</div>
                <div>
                  <p className={styles.chatHeaderName}>
                    {otherParticipant?.first_name} {otherParticipant?.last_name}
                  </p>
                  <p className={styles.chatHeaderSub}>
                    {otherParticipant?.role === 'PROVIDER' ? 'Service Provider' : 'Client'}
                  </p>
                </div>
                <button className={styles.moreBtn}><MoreHorizontal size={18} /></button>
              </div>

              {/* Message stream */}
              <div
                className={styles.messages}
                ref={messageContainerRef}
                onScroll={handleScroll}
              >
                {groupedMessages.map((item, idx) => {
                  if (item.type === 'separator') {
                    return (
                      <div key={`sep-${idx}`} className={styles.dateSeparator}>
                        <span className={styles.dateLabel}>{item.label}</span>
                      </div>
                    );
                  }

                  const { msg } = item;
                  const isOwn = msg.sender.id === user?.id;
                  const msgInitials = `${msg.sender.first_name?.[0] || ''}${msg.sender.last_name?.[0] || ''}`.toUpperCase();

                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`${styles.msgRow} ${isOwn ? styles.msgOwn : ''}`}
                    >
                      {!isOwn && <div className={styles.msgAvatar}>{msgInitials}</div>}
                      <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
                        <p>{msg.body}</p>
                        <div className={styles.msgMeta}>
                          <span className={styles.msgTime}>{format(new Date(msg.created_at), 'h:mm a')}</span>
                          {isOwn && (
                            <span className={styles.readReceipt}>{msg.is_read ? '✓✓' : '✓'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              {showScrollBtn && (
                <button className={styles.scrollBtn} onClick={() => scrollToBottom('smooth')}>
                  <ChevronDown size={16} />
                  {newMsgCount > 0 && (
                    <span className={styles.scrollBtnBadge}>{newMsgCount} new</span>
                  )}
                </button>
              )}

              {/* Input */}
              <div className={styles.inputRow}>
                <textarea
                  className={styles.input}
                  placeholder="Type a message..."
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                />
                <button
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
