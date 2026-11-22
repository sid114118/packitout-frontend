import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { userFetch, BASE_URL } from '../../utils/api.js';
import { useToast } from '../../ui/DialogProvider.jsx';
import { openWhatsAppChat } from '../../utils/whatsappShare.js';
import { downloadKhataStatementPdf, downloadReceiptPdf, extractKhataMeta, enrichTransactionsWithRunningBalance } from '../../utils/billReceiptGenerator.js';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export default function MyKhataModal({ open, onClose, user, onKhataUpdated }) {
  const toast = useToast();

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [totalPendingAcrossShops, setTotalPendingAcrossShops] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailAccount, setDetailAccount] = useState(null);
  const [detailTransactions, setDetailTransactions] = useState([]);

  const [payAmount, setPayAmount] = useState('');
  const [utrRef, setUtrRef] = useState('');
  const [payNote, setPayNote] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const [txFilter, setTxFilter] = useState('ALL'); // ALL | BILLS | PAYMENTS
  const [expandedTxId, setExpandedTxId] = useState(null);

  const userRef = useRef(user);
  const toastRef = useRef(toast);
  const onKhataUpdatedRef = useRef(onKhataUpdated);
  userRef.current = user;
  toastRef.current = toast;
  onKhataUpdatedRef.current = onKhataUpdated;

  const fetchOverview = useCallback(async (silent = false) => {
    const u = userRef.current;
    if (!u?._id) {
      setLoadingOverview(false);
      return;
    }
    if (!silent) setLoadingOverview(true);
    try {
      const res = await userFetch(u, `/users/${u._id}/khata`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.accounts) ? data.accounts : [];
        setAccounts(list);
        setTotalPendingAcrossShops(r2(data.totalPendingAcrossShops));
        setSelectedAccountId((prev) => {
          if (prev && list.some((a) => a._id === prev)) return prev;
          const firstDue = list.find((a) => r2(a.currentBalance) > 0);
          return firstDue ? firstDue._id : (list[0]?._id || null);
        });
      }
    } catch {
      if (!silent) toastRef.current?.('Could not load store Khata accounts', 'error');
    } finally {
      if (!silent) setLoadingOverview(false);
    }
  }, [user?._id]);

  const fetchDetail = useCallback(async (accountId, silent = false) => {
    const u = userRef.current;
    if (!u?._id || !accountId) {
      setLoadingDetail(false);
      return;
    }
    if (!silent) setLoadingDetail(true);
    try {
      const res = await userFetch(u, `/users/${u._id}/khata/${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailAccount(data.account);
        setDetailTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        if (!silent) {
          const bal = r2(data.account?.currentBalance);
          setPayAmount(bal > 0 ? String(bal) : '');
          setUtrRef('');
          setPayNote('');
          setShowQr(false);
        }
      }
    } catch {
      if (!silent) toastRef.current?.('Could not load shop passbook', 'error');
    } finally {
      if (!silent) setLoadingDetail(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (!open || !user?._id) return;
    fetchOverview(false);
  }, [open, user?._id, fetchOverview]);

  useEffect(() => {
    if (!open || !selectedAccountId) return;
    fetchDetail(selectedAccountId, false);
  }, [open, selectedAccountId, fetchDetail]);

  // Live SSE sync while modal is open
  useEffect(() => {
    if (!open || !user?._id || !user?.sessionToken) return;
    const sseUrl = `${BASE_URL.replace(/\/api$/, '')}/user-events/${user._id}?token=${user.sessionToken}`;
    const eventSource = new EventSource(sseUrl);
    let timer;
    eventSource.addEventListener('refresh_khata', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fetchOverview(true);
        if (selectedAccountId) fetchDetail(selectedAccountId, true);
        if (onKhataUpdatedRef.current) onKhataUpdatedRef.current();
      }, 350);
    });
    return () => {
      clearTimeout(timer);
      eventSource.close();
    };
  }, [open, user?._id, user?.sessionToken, selectedAccountId, fetchOverview, fetchDetail]);

  const enrichedPassbook = useMemo(() => {
    return enrichTransactionsWithRunningBalance(detailTransactions);
  }, [detailTransactions]);

  const filteredTransactions = useMemo(() => {
    const list = [...enrichedPassbook.transactions].reverse();
    if (txFilter === 'BILLS') {
      return list.filter((t) => t.type === 'CREDIT_BILL' || t.type === 'MANUAL_CREDIT');
    }
    if (txFilter === 'PAYMENTS') {
      return list.filter((t) => t.type === 'PAYMENT_CASH' || t.type === 'PAYMENT_UPI');
    }
    return list;
  }, [enrichedPassbook, txFilter]);

  const oldestCreditTxId = useMemo(() => {
    const credits = enrichedPassbook.transactions.filter((t) => t.type === 'CREDIT_BILL' || t.type === 'MANUAL_CREDIT');
    return credits.length > 0 ? credits[0]._id : null;
  }, [enrichedPassbook]);

  const pendingClaimsInAccount = useMemo(
    () => detailTransactions.filter((t) => t.verificationStatus === 'PendingVerification'),
    [detailTransactions]
  );

  if (!open || !user?._id) return null;

  const shop = detailAccount?.shopId || {};
  const hasShopUpi = Boolean(shop?.upiId && String(shop.upiId).includes('@'));
  const currentBal = enrichedPassbook.transactions.length > 0 ? enrichedPassbook.netPending : r2(detailAccount?.currentBalance);
  const totalCreditGiven = enrichedPassbook.transactions.length > 0 ? enrichedPassbook.totalCredit : r2(detailAccount?.totalCreditGiven);
  const totalSettled = enrichedPassbook.transactions.length > 0 ? enrichedPassbook.totalSettled : r2(detailAccount?.totalSettled);
  const validPayAmt = Math.min(currentBal, Math.max(0, r2(payAmount)));
  const upiDeepLink = hasShopUpi && validPayAmt > 0
    ? `upi://pay?pa=${encodeURIComponent(shop.upiId)}&pn=${encodeURIComponent(shop.name || 'Store')}&am=${validPayAmt}&cu=INR&tn=${encodeURIComponent(`Khata Pay ${user.name || user.phone || ''}`)}`
    : '';

  const handleClaimUpiPayment = async (e) => {
    e.preventDefault();
    if (!detailAccount) return;
    if (validPayAmt <= 0) {
      toast('Enter a valid amount greater than ₹0', 'error');
      return;
    }
    setSubmittingClaim(true);
    try {
      const res = await userFetch(user, `/users/${user._id}/khata/${detailAccount._id}/claim-upi-payment`, {
        method: 'POST',
        body: JSON.stringify({
          amount: validPayAmt,
          utrOrRef: utrRef.trim(),
          note: payNote.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || 'Could not notify shopkeeper', 'error');
        setSubmittingClaim(false);
        return;
      }
      toast('⏳ Shopkeeper notified! Balance updates as soon as they confirm receipt.');
      setUtrRef('');
      setPayNote('');
      await fetchOverview(true);
      await fetchDetail(detailAccount._id, true);
      if (onKhataUpdated) onKhataUpdated();
    } catch {
      toast('Network error sending UPI payment claim', 'error');
    }
    setSubmittingClaim(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.78)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#f8fafc',
          borderRadius: '22px',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 28px 70px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          padding: '16px 18px',
          borderTopLeftRadius: '22px',
          borderTopRightRadius: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div>
            <div style={{ fontSize: '1.12rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📒 My Store Khata Passbook</span>
              {accounts.length > 1 && totalPendingAcrossShops > 0 && (
                <span style={{ background: '#d97706', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 900 }}>
                  Total Due: ₹{totalPendingAcrossShops}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '2px' }}>
              Transparent store bills, payments &amp; instant UPI due settlement
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'rgba(255,255,255,0.16)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', fontWeight: 900, cursor: 'pointer', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loadingOverview ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontWeight: 800 }}>
              Loading your Store Khata Passbook…
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>📒</div>
              <div style={{ fontWeight: 900, color: '#0f172a' }}>No Store Khata Accounts</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                You do not have any Khata ledger with any store yet.
              </div>
            </div>
          ) : (
            <>
              {/* Shop Selector Pills (when multiple stores) */}
              {accounts.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {accounts.map((acc) => {
                    const active = acc._id === selectedAccountId;
                    const sName = acc.shopId?.name || 'Store';
                    const bal = r2(acc.currentBalance);
                    return (
                      <button
                        key={acc._id}
                        type="button"
                        onClick={() => setSelectedAccountId(acc._id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '12px',
                          border: active ? '2px solid #d97706' : '1px solid #cbd5e1',
                          background: active ? '#fffbeb' : '#ffffff',
                          color: '#0f172a',
                          fontWeight: 900,
                          fontSize: '0.78rem',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>🏪 {sName}</span>
                        <span style={{
                          padding: '1px 7px',
                          borderRadius: '999px',
                          fontSize: '0.68rem',
                          background: bal > 0 ? '#fef3c7' : '#dcfce7',
                          color: bal > 0 ? '#b45309' : '#15803d',
                        }}>
                          {bal > 0 ? `₹${bal} Due` : 'Cleared ✅'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {loadingDetail || !detailAccount ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
                  Loading store ledger…
                </div>
              ) : (
                <>
                  {/* Active Shop Hero Ledger Card */}
                  <div style={{
                    background: currentBal > 0
                      ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                      : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: `2px solid ${currentBal > 0 ? '#f59e0b' : '#22c55e'}`,
                    borderRadius: '16px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '1.02rem', color: '#0f172a' }}>
                          🏪 {shop.name || 'Store'}
                        </div>
                        {(shop.fullAddress || shop.phone) && (
                          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px' }}>
                            {shop.fullAddress ? `${shop.fullAddress} ` : ''}
                            {shop.phone ? `• Ph: ${shop.phone}` : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {shop.phone && (
                          <>
                            <a
                              href={`tel:${shop.phone}`}
                              style={{ padding: '5px 9px', borderRadius: '8px', background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 800, fontSize: '0.74rem', textDecoration: 'none' }}
                            >
                              📞 Call
                            </a>
                            <button
                              type="button"
                              onClick={() => openWhatsAppChat(shop.phone, `Namaste ${shop.name || ''} ji, regarding my Store Khata (Current Due: Rs.${currentBal}).`)}
                              style={{ padding: '5px 9px', borderRadius: '8px', background: '#16a34a', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}
                            >
                              💬 WhatsApp
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: currentBal > 0 ? '#92400e' : '#166534', textTransform: 'uppercase' }}>
                          {currentBal > 0 ? 'Pending Khata Payable' : 'Khata Balance'}
                        </div>
                        <div style={{ fontSize: '1.85rem', fontWeight: 900, color: currentBal > 0 ? '#b45309' : '#15803d', lineHeight: 1.1 }}>
                          {currentBal > 0 ? `₹${currentBal}` : '₹0 — All Dues Cleared ✅'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700, marginTop: '4px' }}>
                          Total Credit Used: ₹{totalCreditGiven} • Total Paid: ₹{totalSettled}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            toast('Generating Statement PDF…', 'info');
                            await downloadKhataStatementPdf(detailAccount, detailTransactions, shop);
                            toast('📄 Statement PDF Downloaded!');
                          } catch {
                            toast('Could not download Statement PDF', 'error');
                          }
                        }}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #1d4ed8', background: '#eff6ff', color: '#1d4ed8', fontWeight: 900, fontSize: '0.76rem', cursor: 'pointer' }}
                      >
                        📄 Statement PDF
                      </button>
                    </div>
                  </div>

                  {/* Pending Verification Alert */}
                  {pendingClaimsInAccount.length > 0 && (
                    <div style={{ padding: '10px 14px', borderRadius: '12px', background: '#fefce8', border: '1.5px solid #facc15', fontSize: '0.78rem', color: '#854d0e', fontWeight: 800 }}>
                      ⏳ You have {pendingClaimsInAccount.length} UPI payment claim(s) awaiting shopkeeper confirmation. Balance will update automatically once verified!
                    </div>
                  )}

                  {/* Interactive Pay Khata via UPI Box */}
                  {currentBal > 0 && (
                    <form
                      onSubmit={handleClaimUpiPayment}
                      style={{ background: '#ffffff', borderRadius: '16px', padding: '14px 16px', border: '1.5px solid #93c5fd', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)' }}
                    >
                      <div style={{ fontWeight: 900, color: '#1e3a8a', fontSize: '0.92rem', marginBottom: '8px' }}>
                        📱 Pay Khata Balance Now via UPI
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          max={currentBal}
                          required
                          placeholder={`Amount (up to ₹${currentBal})`}
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '2px solid #2563eb', fontWeight: 900, fontSize: '0.98rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setPayAmount(String(currentBal))}
                          style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Full ₹{currentBal}
                        </button>
                      </div>

                      {hasShopUpi && validPayAmt > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <a
                            href={upiDeepLink}
                            style={{
                              flex: 1,
                              minWidth: '170px',
                              textAlign: 'center',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                              color: '#fff',
                              fontWeight: 900,
                              fontSize: '0.84rem',
                              textDecoration: 'none',
                            }}
                          >
                            📱 Pay ₹{validPayAmt} via UPI App
                          </a>
                          <button
                            type="button"
                            onClick={() => setShowQr((v) => !v)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#0f172a',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                            }}
                          >
                            {showQr ? 'Hide QR' : '🔳 Show QR'}
                          </button>
                        </div>
                      )}

                      {showQr && upiDeepLink && (
                        <div style={{ textAlign: 'center', padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #3b82f6', marginBottom: '10px' }}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(upiDeepLink)}`}
                            alt="Shop UPI QR"
                            style={{ width: '160px', height: '160px', borderRadius: '8px', background: '#fff' }}
                          />
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, marginTop: '4px' }}>
                            UPI ID: <strong>{shop.upiId}</strong>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          placeholder="UTR / UPI Ref No. (Optional)"
                          value={utrRef}
                          onChange={(e) => setUtrRef(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Note (Optional)"
                          value={payNote}
                          onChange={(e) => setPayNote(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingClaim || validPayAmt <= 0}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#16a34a',
                          color: '#fff',
                          fontWeight: 900,
                          fontSize: '0.84rem',
                          cursor: submittingClaim ? 'wait' : 'pointer',
                        }}
                      >
                        {submittingClaim ? 'Notifying Shopkeeper…' : '✅ I Have Paid via UPI — Notify Shopkeeper'}
                      </button>

                      <div style={{ textAlign: 'center', fontSize: '0.71rem', color: '#64748b', marginTop: '6px' }}>
                        Or pay Cash / UPI directly at the shop counter anytime.
                      </div>
                    </form>
                  )}

                  {/* Chronological Passbook Timeline */}
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.92rem' }}>
                        📜 Passbook Entries ({filteredTransactions.length})
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {[
                          { id: 'ALL', label: 'All' },
                          { id: 'BILLS', label: '🧾 Bills' },
                          { id: 'PAYMENTS', label: '💵 Payments' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setTxFilter(f.id)}
                            style={{
                              padding: '4px 9px',
                              borderRadius: '999px',
                              border: txFilter === f.id ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                              background: txFilter === f.id ? '#0f172a' : '#fff',
                              color: txFilter === f.id ? '#fff' : '#475569',
                              fontSize: '0.71rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredTransactions.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                        No entries in this view.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filteredTransactions.map((tx) => {
                          const isCredit = tx.type === 'CREDIT_BILL' || tx.type === 'MANUAL_CREDIT';
                          const isPending = tx.verificationStatus === 'PendingVerification';
                          const isRejected = tx.verificationStatus === 'Rejected';
                          const linkedOrder = tx.orderId && typeof tx.orderId === 'object' ? tx.orderId : null;
                          const isFirstEntry = tx._id === oldestCreditTxId || Boolean(linkedOrder?.khataSnapshot?.isFirstKhata || linkedOrder?.khataSnapshot?.isFirstTimeKhata);
                          const isExpanded = expandedTxId === tx._id;

                          return (
                            <div
                              key={tx._id}
                              style={{
                                borderRadius: '12px',
                                border: `1px solid ${isPending ? '#f59e0b' : isRejected ? '#fecaca' : isCredit ? '#fde68a' : '#bbf7d0'}`,
                                background: isPending ? '#fefce8' : isRejected ? '#fef2f2' : isCredit ? '#fffdf5' : '#f0fdf4',
                                padding: '10px 12px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 900, fontSize: '0.82rem', color: '#0f172a' }}>
                                      {tx.type === 'CREDIT_BILL'
                                        ? `🧾 Store Bill #${String(linkedOrder?._id || '').slice(-5).toUpperCase()}`
                                        : tx.type === 'MANUAL_CREDIT'
                                          ? '📝 Opening / Manual Credit'
                                          : tx.type === 'PAYMENT_UPI'
                                            ? '📱 UPI Paid'
                                            : '💵 Cash Paid'}
                                    </span>
                                    {isFirstEntry && isCredit && (
                                      <span style={{ background: '#7c3aed', color: '#fff', padding: '1px 6px', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 900 }}>
                                        🆕 First Khata Entry
                                      </span>
                                    )}
                                    {isPending && (
                                      <span style={{ background: '#f59e0b', color: '#fff', padding: '1px 6px', borderRadius: '999px', fontSize: '0.64rem', fontWeight: 900 }}>
                                        ⏳ Verification Pending
                                      </span>
                                    )}
                                    {isRejected && (
                                      <span style={{ background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: '999px', fontSize: '0.64rem', fontWeight: 900 }}>
                                        ❌ Rejected
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px' }}>
                                    {new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    {tx.utrOrRef ? ` • UTR: ${tx.utrOrRef}` : ''}
                                    {tx.note ? ` • ${tx.note}` : ''}
                                  </div>

                                  {linkedOrder && (
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedTxId(isExpanded ? null : tx._id)}
                                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                      >
                                        {isExpanded ? '▲ Hide Items' : `▼ ${(linkedOrder.items || []).length} Items`}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => downloadReceiptPdf(linkedOrder, shop)}
                                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                      >
                                        📄 Download Bill PDF
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{
                                    fontWeight: 900,
                                    fontSize: '0.96rem',
                                    color: isRejected ? '#94a3b8' : isPending ? '#b45309' : isCredit ? '#b91c1c' : '#15803d',
                                    textDecoration: isRejected ? 'line-through' : 'none',
                                  }}>
                                    {isCredit ? `+₹${r2(tx.amount)}` : `-₹${r2(tx.amount)}`}
                                  </div>
                                  {!isPending && !isRejected && (
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>
                                      Bal: ₹{r2(tx.computedBalanceAfter !== undefined ? tx.computedBalanceAfter : tx.balanceAfter)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isExpanded && linkedOrder && (
                                <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '8px', background: '#fff', border: '1px dashed #cbd5e1', fontSize: '0.74rem' }}>
                                  {(linkedOrder.items || []).map((it, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                      <span>{it.qty} × {it.name} {it.qnty ? `(${it.qnty})` : ''}</span>
                                      <strong>₹{r2((Number(it.price) || 0) * (Number(it.qty) || 1))}</strong>
                                    </div>
                                  ))}
                                  {(() => {
                                    const m = extractKhataMeta(linkedOrder);
                                    return (
                                      <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '5px', paddingTop: '5px', color: '#475569', fontWeight: 800 }}>
                                        Bill Total: ₹{r2(linkedOrder.totalAmount)}
                                        {m.paidNow > 0 ? ` • Paid Upfront (${m.paidVia}): ₹${m.paidNow}` : ''}
                                        {` • Added to Khata: ₹${m.addedDue}`}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
