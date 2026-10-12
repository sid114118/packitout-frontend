import React, { useState, useEffect, useRef } from 'react';
import { BASE_URL, userFetch, shopFetch } from '../../utils/api.js';
import { cdnImage } from '../../utils/cloudinaryUrl.js';
import { playMessagePop, playAcceptChime } from '../../utils/chatSound.js';
import ChatIcon from '../../ui/ChatIcon.jsx';
import SubstitutePickerModal from '../ShopDashboard/SubstitutePickerModal.jsx';

const QUICK_CHIPS_CUSTOMER = [
  '🏃 Coming in 5 mins',
  '🥛 Add 1 Amul Milk pouch',
  '🍞 Add 1 bread packet please',
  '🙏 Thanks bhaiya',
];

const QUICK_CHIPS_SHOP = [
  '📦 Packing almost done',
  '🛍️ Ready for pickup!',
  '👍 Noted, packing now',
  '🙏 Thank you!',
];

export default function OrderChatDrawer({
  orderId,
  role = 'user', // 'user' | 'shop'
  sessionUser = null,
  sessionShop = null,
  orderData = null,
  onClose,
  onOrderUpdated,
}) {
  const [messages, setMessages] = useState([]);
  const [order, setOrder] = useState(orderData || null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [substitutePickerIdx, setSubstitutePickerIdx] = useState(null);
  const [substituteMode, setSubstituteMode] = useState('swap');
  const [showPickerModal, setShowPickerModal] = useState(false);

  const messagesEndRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const isShop = role === 'shop';

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Helper fetcher according to role
  const doFetch = (path, init = {}) => {
    if (isShop) {
      return shopFetch(sessionShop, path, init);
    }
    return userFetch(sessionUser, path, init);
  };

  const loadChat = async (isInitial = false) => {
    try {
      const res = await doFetch(`/orders/${orderId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setMessages(prev => {
          // Play pop sound if new incoming message arrived
          if (!isInitial && data.messages.length > prevMsgCountRef.current) {
            const lastMsg = data.messages[data.messages.length - 1];
            const isFromOther = isShop ? lastMsg.senderRole === 'user' : lastMsg.senderRole === 'shop';
            if (isFromOther) {
              playMessagePop();
            }
          }
          prevMsgCountRef.current = data.messages.length;
          return data.messages;
        });

        if (data.order) {
          setOrder(data.order);
          if (onOrderUpdated) onOrderUpdated(data.order);
        }
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
        setTimeout(() => scrollToBottom(false), 80);
      }
    }
  };

  useEffect(() => {
    loadChat(true);

    // ⚡ Real-Time Polling fallback every 3s while drawer is open
    const pollInterval = setInterval(() => {
      loadChat(false);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');

    // Optimistic message UI
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      senderRole: isShop ? 'shop' : 'user',
      senderName: isShop ? (sessionShop?.name || 'Shop') : (sessionUser?.name || 'You'),
      text,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await doFetch(`/orders/${orderId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages(prev => prev.map(m => (m._id === tempId ? data.message : m)));
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleRespondProposal = async (messageId, decision, actionIfDeclined = 'keep') => {
    if (respondingId) return;
    setRespondingId(messageId);

    try {
      const res = await doFetch(`/orders/${orderId}/respond-proposal`, {
        method: 'POST',
        body: JSON.stringify({ messageId, decision, actionIfDeclined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (decision === 'accept') {
          playAcceptChime();
        }
        await loadChat(false);
        if (data.order && onOrderUpdated) {
          onOrderUpdated(data.order);
        }
      }
    } catch (err) {
      console.error('Failed to respond to proposal:', err);
    } finally {
      setRespondingId(null);
    }
  };

  const isClosed = order?.status?.includes('✅') || order?.status?.includes('❌');
  const otherPartyName = isShop
    ? (order?.userId?.name || 'Customer')
    : (order?.shopId?.name || 'Shopkeeper');
  const otherPartyPhone = isShop
    ? order?.userId?.phone
    : order?.shopId?.phone;

  const quickChips = isShop ? QUICK_CHIPS_SHOP : QUICK_CHIPS_CUSTOMER;
  const shortId = (orderId || '').slice(-5).toUpperCase();

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(5px)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '540px',
        height: '92vh',
        backgroundColor: '#efeae2',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}>

        {/* 🟩 WHATSAPP HEADER */}
        <div style={{
          backgroundColor: '#075e54',
          color: '#ffffff',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                color: '#fff',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                flexShrink: 0,
              }}
              title="Close chat"
            >
              ✕
            </button>

            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#128c7e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.3)'
            }}>
              {isShop ? '👤' : '🏪'}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 800,
                fontSize: '1rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>{otherPartyName}</span>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#25d366', color: '#075e54', padding: '1px 6px', borderRadius: '6px', fontWeight: 900 }}>
                  Order #{shortId}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', opacity: 0.9, marginTop: '1px' }}>
                Total: <strong style={{ color: '#86efac' }}>₹{order?.totalAmount ?? '...'}</strong> · {order?.status || 'Active'}
              </div>
            </div>
          </div>

          {/* Quick Call Button */}
          {otherPartyPhone && (
            <a
              href={`tel:${otherPartyPhone}`}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.8rem',
                flexShrink: 0,
                cursor: 'pointer'
              }}
            >
              📞 Call
            </a>
          )}
        </div>

        {/* 🛍️ SHOPKEEPER QUICK REPLACEMENT & ADD ITEM BAR */}
        {isShop && !isClosed && (
          <div style={{
            backgroundColor: '#054c44',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)'
          }}>
            {/* ➕ Add Extra Item Button */}
            <button
              onClick={() => {
                setSubstituteMode('add');
                setSubstitutePickerIdx(null);
                setShowPickerModal(true);
              }}
              style={{
                backgroundColor: '#16a34a',
                border: '1px solid #4ade80',
                borderRadius: '14px',
                color: '#ffffff',
                padding: '4px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.35)'
              }}
              title="Add a new item to this order if customer asked in chat"
            >
              <span>➕ Add Item (सामान जोड़ें)</span>
            </button>

            {order?.items && order.items.length > 0 && (
              <>
                <span style={{ fontSize: '0.73rem', color: '#a7f3d0', fontWeight: 800, flexShrink: 0, marginLeft: '4px' }}>
                  Replace:
                </span>
                {order.items.map((it, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSubstituteMode('swap');
                      setSubstitutePickerIdx(idx);
                      setShowPickerModal(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.16)',
                      border: '1px solid rgba(255,255,255,0.28)',
                      borderRadius: '14px',
                      color: '#ffffff',
                      padding: '4px 10px',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                  >
                    <span>⇄ {it.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* 📜 CHAT MESSAGE STREAM */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundImage: `radial-gradient(#cbd5e1 0.75px, transparent 0.75px)`,
          backgroundSize: '16px 16px',
        }}>

          {/* Security Notice */}
          <div style={{
            alignSelf: 'center',
            backgroundColor: '#fed7aa',
            color: '#7c2d12',
            fontSize: '0.72rem',
            padding: '5px 12px',
            borderRadius: '12px',
            fontWeight: 700,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            textAlign: 'center',
            maxWidth: '90%'
          }}>
            🔒 Order Chat & Quick Replacement connected to Order #{shortId}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '30px' }}>
              Loading order chat...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '40px' }}>
              <div style={{ marginBottom: '10px' }}><ChatIcon size={36} color="#64748b" /></div>
              <div style={{ fontWeight: 800, color: '#334155' }}>No messages yet</div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                {isShop
                  ? 'Chat with customer or propose substitutes for out-of-stock items.'
                  : 'Chat with the shopkeeper or ask for item replacements.'}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = isShop ? msg.senderRole === 'shop' : msg.senderRole === 'user';
              const isSystem = msg.senderRole === 'system';
              const timeStr = msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              if (isSystem) {
                return (
                  <div key={msg._id || idx} style={{
                    alignSelf: 'center',
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    fontSize: '0.75rem',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textAlign: 'center',
                    maxWidth: '85%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid #cbd5e1'
                  }}>
                    {msg.text}
                  </div>
                );
              }

              return (
                <div key={msg._id || idx} style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    backgroundColor: isMine ? '#d9fdd3' : '#ffffff',
                    color: '#111b21',
                    borderRadius: '14px',
                    borderTopRightRadius: isMine ? '3px' : '14px',
                    borderTopLeftRadius: !isMine ? '3px' : '14px',
                    padding: '8px 12px 6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    position: 'relative',
                    wordBreak: 'break-word',
                  }}>

                    {/* Sender Name for incoming */}
                    {!isMine && (
                      <div style={{
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        color: msg.senderRole === 'shop' ? '#0f766e' : '#b45309',
                        marginBottom: '3px'
                      }}>
                        {msg.senderName || (msg.senderRole === 'shop' ? 'Shopkeeper' : 'Customer')}
                      </div>
                    )}

                    {/* Plain Text Message */}
                    {msg.text && (
                      <div style={{ fontSize: '0.9rem', lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </div>
                    )}

                    {/* 🔄 INTERACTIVE REPLACEMENT PROPOSAL CARD */}
                    {Boolean(msg.proposal && msg.proposal.proposalId && (msg.proposal.replacementItem?.name || msg.proposal.originalItem?.name)) && (
                      <div style={{
                        marginTop: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '10px',
                        fontSize: '0.82rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                          borderBottom: '1px dashed #e2e8f0',
                          paddingBottom: '6px'
                        }}>
                          <span style={{ fontWeight: 900, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>🔄</span> Substitute Proposed
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            backgroundColor: msg.proposal.status === 'accepted' ? '#dcfce7' : msg.proposal.status === 'declined' ? '#fee2e2' : '#fef3c7',
                            color: msg.proposal.status === 'accepted' ? '#15803d' : msg.proposal.status === 'declined' ? '#b91c1c' : '#92400e',
                          }}>
                            {msg.proposal.status === 'accepted' ? '✅ Accepted' : msg.proposal.status === 'declined' ? '❌ Declined' : '⏳ Pending'}
                          </span>
                        </div>

                        {/* Original item */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 900, width: '42px', flexShrink: 0 }}>OUT:</span>
                          <div style={{ flex: 1, minWidth: 0, textDecoration: 'line-through', color: '#64748b' }}>
                            {msg.proposal.originalItem?.name} (₹{msg.proposal.originalItem?.price})
                          </div>
                        </div>

                        {/* Replacement item */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 900, width: '42px', flexShrink: 0 }}>SUB:</span>
                          <div style={{ flex: 1, minWidth: 0, fontWeight: 800, color: '#0f172a' }}>
                            {msg.proposal.replacementItem?.name} (₹{msg.proposal.replacementItem?.price})
                          </div>
                        </div>

                        {/* Price Delta Badge */}
                        <div style={{
                          backgroundColor: '#f1f5f9',
                          padding: '5px 8px',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          color: '#334155',
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: msg.proposal.status === 'pending' && !isShop ? '10px' : '0'
                        }}>
                          <span>Price Difference:</span>
                          <span style={{ color: msg.proposal.priceDelta > 0 ? '#ea580c' : msg.proposal.priceDelta < 0 ? '#16a34a' : '#475569', fontWeight: 900 }}>
                            {msg.proposal.priceDelta > 0 ? `+₹${msg.proposal.priceDelta}` : msg.proposal.priceDelta < 0 ? `-₹${Math.abs(msg.proposal.priceDelta)}` : '₹0'}
                          </span>
                        </div>

                        {/* Action Buttons for Customer when Pending */}
                        {!isShop && msg.proposal.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                            <button
                              onClick={() => handleRespondProposal(msg._id, 'accept')}
                              disabled={respondingId === msg._id}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 900,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.28)'
                              }}
                            >
                              {respondingId === msg._id ? 'Updating...' : `✅ Accept (${msg.proposal.priceDelta >= 0 ? '+' : ''}₹${msg.proposal.priceDelta})`}
                            </button>

                            <button
                              onClick={() => handleRespondProposal(msg._id, 'decline', 'remove')}
                              disabled={respondingId === msg._id}
                              style={{
                                padding: '8px 10px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                cursor: 'pointer'
                              }}
                            >
                              ❌ Remove Item
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp & Ticks */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      fontSize: '0.64rem',
                      color: '#667781',
                      marginTop: '4px'
                    }}>
                      <span>{timeStr}</span>
                      {isMine && <span style={{ color: '#53bdeb', fontWeight: 900 }}>✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ⚡ QUICK-REPLY HINGLISH CHIPS */}
        {!isClosed && (
          <div style={{
            backgroundColor: '#f0f2f5',
            padding: '8px 10px 4px',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            borderTop: '1px solid #e2e8f0',
          }}>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                disabled={sending}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '5px 11px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* ✍️ INPUT BOX */}
        {isClosed ? (
          <div style={{
            backgroundColor: '#f1f5f9',
            padding: '14px',
            textAlign: 'center',
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#64748b',
            borderTop: '1px solid #e2e8f0'
          }}>
            🔒 This order is completed or cancelled. Chat is archived.
          </div>
        ) : (
          <div style={{
            backgroundColor: '#f0f2f5',
            padding: '8px 12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={isShop ? "Message customer or suggest items..." : "Message shopkeeper..."}
              disabled={sending}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '24px',
                padding: '11px 16px',
                fontSize: '0.9rem',
                outline: 'none',
                color: '#111b21',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || sending}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: inputText.trim() ? '#128c7e' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                cursor: inputText.trim() ? 'pointer' : 'default',
                boxShadow: inputText.trim() ? '0 3px 10px rgba(18, 140, 126, 0.4)' : 'none',
                transition: '0.2s',
                flexShrink: 0
              }}
            >
              ➤
            </button>
          </div>
        )}

        {/* 🔄 Substitute & Add Item Modal for Shopkeeper */}
        {showPickerModal && (
          <SubstitutePickerModal
            open={showPickerModal}
            order={order}
            itemIndex={substitutePickerIdx}
            mode={substituteMode}
            shopData={sessionShop}
            onClose={() => {
              setShowPickerModal(false);
              setSubstitutePickerIdx(null);
              setSubstituteMode('swap');
            }}
            onItemAdded={(updated) => {
              setShowPickerModal(false);
              setSubstitutePickerIdx(null);
              setSubstituteMode('swap');
              if (onOrderUpdated) onOrderUpdated(updated);
              setOrder(updated);
              loadChat(false);
            }}
            onProposalSent={(msg) => {
              setShowPickerModal(false);
              setSubstitutePickerIdx(null);
              setSubstituteMode('swap');
              loadChat(false);
            }}
          />
        )}

      </div>
    </div>
  );
}
