import React, { useState } from 'react';
import { useToast } from '../../ui/DialogProvider.jsx';

// Map author → bubble style. Customer-side replies render through this same
// component (readOnly=true) so the thread looks consistent everywhere.
const AUTHOR_STYLE = {
  shop:  { label: '🏪 Shop',         bg: '#eff6ff', border: '#bfdbfe', fg: '#1e3a8a' },
  admin: { label: '🛡️ Admin',         bg: '#f0fdf4', border: '#bbf7d0', fg: '#166534' },
};

const fmtWhen = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function ComplaintReplyThread({
  replies = [],
  composerLabel,
  composerPlaceholder = 'Write a reply…',
  onSubmit,
  readOnly = false,
}) {
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (e) => {
    e?.preventDefault?.();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSubmit(trimmed);
      setDraft('');
      toast('Reply sent.');
    } catch (err) {
      toast(err?.message || 'Could not send reply.', 'error');
    } finally {
      setSending(false);
    }
  };

  const hasReplies = Array.isArray(replies) && replies.length > 0;

  return (
    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
      {hasReplies && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: readOnly ? 0 : '12px' }}>
          {replies.map((r, i) => {
            const meta = AUTHOR_STYLE[r.authorType] || AUTHOR_STYLE.admin;
            return (
              <div
                key={r._id || i}
                style={{
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  borderRadius: '12px',
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: meta.fg }}>
                    {meta.label}{r.authorName ? ` · ${r.authorName}` : ''}
                  </div>
                  {r.createdAt && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>{fmtWhen(r.createdAt)}</div>
                  )}
                </div>
                <div style={{ color: '#0f172a', fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {r.message}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <form onSubmit={send}>
          {composerLabel && (
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '6px' }}>
              {composerLabel}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={composerPlaceholder}
              rows={2}
              maxLength={2000}
              style={{
                flex: 1, padding: '10px 12px',
                borderRadius: '10px', border: '1px solid #cbd5e1',
                fontSize: '0.9rem', fontWeight: 500, color: '#0f172a',
                background: '#fff', outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', minHeight: '44px',
              }}
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              style={{
                padding: '12px 16px', border: 'none', borderRadius: '10px',
                background: (!draft.trim() || sending) ? '#cbd5e1' : '#16a34a',
                color: '#fff', fontWeight: 900, fontSize: '0.85rem',
                cursor: (!draft.trim() || sending) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </form>
      )}

      {readOnly && !hasReplies && (
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, padding: '6px 0' }}>
          No replies yet. The shop or admin will respond soon.
        </div>
      )}
    </div>
  );
}
