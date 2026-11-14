import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { shopFetch } from '../../utils/api.js';
import { useToast } from '../../ui/DialogProvider.jsx';
import {
  downloadKhataStatementPdf,
  sendKhataStatementWhatsApp,
  downloadReceiptPdf,
  sendBillToCustomerWhatsApp,
  extractKhataMeta,
} from '../../utils/billReceiptGenerator.js';
import { getPublicBillUrl } from '../../utils/whatsappShare.js';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export default function KhataTab({
  shopData,
  focusPhone = '',
  onClearFocusPhone,
  onKhataSummaryChange,
  onQuickPosBill,
  refreshSignal = 0,
}) {
  const toast = useToast();

  const [khataData, setKhataData] = useState({
    summary: {
      totalReceivable: 0,
      activeCustomersCount: 0,
      settledCustomersCount: 0,
      totalCustomersCount: 0,
      overLimitCount: 0,
      pendingVerificationCount: 0,
      todayCreditGiven: 0,
      todayCollected: 0,
      todayCashCollected: 0,
      todayUpiCollected: 0,
    },
    pendingApprovals: [],
    accounts: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // ALL | DUE | PENDING_UPI | OVER_LIMIT | SETTLED
  const [sortBy, setSortBy] = useState('HIGHEST_DUE'); // HIGHEST_DUE | RECENT | NAME

  // Manual Khata / Opening Balance Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualLimit, setManualLimit] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  // Reject UPI inline prompt
  const [rejectingTxId, setRejectingTxId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyingTxId, setVerifyingTxId] = useState(null);

  // Customer Passbook Detail Modal
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [detailAccount, setDetailAccount] = useState(null);
  const [detailTransactions, setDetailTransactions] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeActionPanel, setActiveActionPanel] = useState('COLLECT'); // COLLECT | ADD_CREDIT | SETTINGS | NONE
  const [txFilter, setTxFilter] = useState('ALL'); // ALL | BILLS | PAYMENTS
  const [expandedTxId, setExpandedTxId] = useState(null);

  // Collect Payment ("Jama") state inside Passbook Modal
  const [jamaAmount, setJamaAmount] = useState('');
  const [jamaMode, setJamaMode] = useState('CASH'); // CASH | UPI
  const [jamaNote, setJamaNote] = useState('');
  const [sendWhatsAppJama, setSendWhatsAppJama] = useState(true);
  const [savingJama, setSavingJama] = useState(false);

  // Quick Add Credit inside Passbook Modal
  const [extraCreditAmt, setExtraCreditAmt] = useState('');
  const [extraCreditNote, setExtraCreditNote] = useState('');
  const [savingExtraCredit, setSavingExtraCredit] = useState(false);

  // Account Settings inside Passbook Modal
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const hasShopUpi = Boolean(shopData?.upiId && String(shopData.upiId).includes('@'));

  const fetchKhataOverview = useCallback(async (silent = false) => {
    if (!shopData?._id) return null;
    if (!silent) setLoading(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/khata`);
      if (res.ok) {
        const data = await res.json();
        setKhataData({
          summary: data.summary || {},
          pendingApprovals: Array.isArray(data.pendingApprovals) ? data.pendingApprovals : [],
          accounts: Array.isArray(data.accounts) ? data.accounts : [],
        });
        if (onKhataSummaryChange && data.summary) {
          onKhataSummaryChange(data.summary);
        }
        if (!silent) setLoading(false);
        return data;
      }
    } catch {
      if (!silent) toast('Could not load Khata ledger', 'error');
    }
    if (!silent) setLoading(false);
    return null;
  }, [shopData, onKhataSummaryChange, toast]);

  const fetchAccountDetail = useCallback(async (accountId, silent = false) => {
    if (!accountId || !shopData?._id) return null;
    if (!silent) setLoadingDetail(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/khata/${accountId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailAccount(data.account);
        setDetailTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        setEditName(data.account?.customerName || '');
        setEditLimit(data.account?.creditLimit > 0 ? String(data.account.creditLimit) : '');
        setEditNotes(data.account?.notes || '');
        if (!silent) {
          const bal = r2(data.account?.currentBalance);
          setJamaAmount(bal > 0 ? String(bal) : '');
          setActiveActionPanel(bal > 0 ? 'COLLECT' : 'NONE');
        }
        if (!silent) setLoadingDetail(false);
        return data;
      }
    } catch {
      if (!silent) toast('Could not load customer passbook', 'error');
    }
    if (!silent) setLoadingDetail(false);
    return null;
  }, [shopData, toast]);

  useEffect(() => {
    fetchKhataOverview(refreshSignal > 0);
    if (selectedAccountId && refreshSignal > 0) {
      fetchAccountDetail(selectedAccountId, true);
    }
  }, [fetchKhataOverview, fetchAccountDetail, refreshSignal, selectedAccountId]);

  // Handle focusPhone navigation from Counter POS
  useEffect(() => {
    if (!focusPhone || loading) return;
    const clean = String(focusPhone).replace(/\D/g, '').slice(-10);
    if (!clean) {
      if (onClearFocusPhone) onClearFocusPhone();
      return;
    }
    const match = khataData.accounts.find((a) => a.customerPhone === clean);
    if (match) {
      setSelectedAccountId(match._id);
      fetchAccountDetail(match._id, false);
    } else {
      setSearchQuery(clean);
    }
    if (onClearFocusPhone) onClearFocusPhone();
  }, [focusPhone, loading, khataData.accounts, fetchAccountDetail, onClearFocusPhone]);

  const openPassbook = (acc) => {
    setSelectedAccountId(acc._id);
    setExpandedTxId(null);
    setTxFilter('ALL');
    fetchAccountDetail(acc._id, false);
  };

  const closePassbook = () => {
    setSelectedAccountId(null);
    setDetailAccount(null);
    setDetailTransactions([]);
    setExpandedTxId(null);
  };

  // --- VERIFY / REJECT CUSTOMER UPI CLAIM ---
  const handleVerifyUpi = async (txId, action, reasonText = '') => {
    setVerifyingTxId(txId);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/khata/transactions/${txId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ action, rejectReason: reasonText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || 'Could not update UPI claim', 'error');
        setVerifyingTxId(null);
        return;
      }
      toast(
        action === 'approve'
          ? `✅ UPI Payment Confirmed! Remaining Balance: ₹${r2(data.account?.currentBalance)}`
          : '❌ UPI Claim Rejected & Customer Notified'
      );
      setRejectingTxId(null);
      setRejectReason('');
      await fetchKhataOverview(true);
      if (selectedAccountId) {
        await fetchAccountDetail(selectedAccountId, true);
      }
    } catch {
      toast('Network error verifying UPI payment', 'error');
    }
    setVerifyingTxId(null);
  };

  // --- RECORD PAYMENT (JAMA) ---
  const handleRecordJama = async (e) => {
    e.preventDefault();
    if (!detailAccount) return;
    const amt = r2(jamaAmount);
    if (amt <= 0) {
      toast('Enter a valid amount greater than ₹0', 'error');
      return;
    }
    if (amt > r2(detailAccount.currentBalance)) {
      toast(`Amount cannot exceed pending balance ₹${r2(detailAccount.currentBalance)}`, 'error');
      return;
    }
    setSavingJama(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/khata/record-payment`, {
        method: 'POST',
        body: JSON.stringify({
          accountId: detailAccount._id,
          phone: detailAccount.customerPhone,
          amount: amt,
          mode: jamaMode,
          note: jamaNote.trim() || `Khata Jama (${jamaMode})`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || 'Failed to record payment', 'error');
        setSavingJama(false);
        return;
      }
      toast(`✅ ₹${amt} Jama Recorded! New Balance: ₹${r2(data.account?.currentBalance)}`);
      setJamaNote('');
      await fetchKhataOverview(true);
      const refreshed = await fetchAccountDetail(detailAccount._id, true);
      const newBal = r2(data.account?.currentBalance);
      setJamaAmount(newBal > 0 ? String(newBal) : '');
      if (newBal === 0) setActiveActionPanel('NONE');

      if (sendWhatsAppJama && data.transaction) {
        sendKhataStatementWhatsApp(
          data.account || detailAccount,
          refreshed?.transactions || detailTransactions,
          shopData,
          { toast, paymentTx: data.transaction }
        );
      }
    } catch {
      toast('Network error while recording payment', 'error');
    }
    setSavingJama(false);
  };

  // --- ADD MANUAL KHATA / OPENING BALANCE (Global Modal) ---
  const handleCreateManualCredit = async (e) => {
    e.preventDefault();
    const clean = manualPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      toast('Enter a valid 10-digit Indian mobile number', 'error');
      return;
    }
    if (!manualName.trim()) {
      toast('Enter customer name', 'error');
      return;
    }
    const amt = r2(manualAmount);
    if (amt <= 0) {
      toast('Enter credit amount greater than ₹0', 'error');
      return;
    }
    setSavingManual(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/khata/manual-credit`, {
        method: 'POST',
        body: JSON.stringify({
          phone: clean,
          customerName: manualName.trim(),
          amount: amt,
          note: manualNote.trim() || 'Opening / Manual Store Khata Entry',
          creditLimit: manualLimit ? Number(manualLimit) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || 'Failed to add manual Khata', 'error');
        setSavingManual(false);
        return;
      }
      toast(`📒 ₹${amt} Khata Added for ${data.account?.customerName || manualName}!`);
      setShowManualModal(false);
      setManualPhone('');
      setManualName('');
      setManualAmount('');
      setManualNote('');
      setManualLimit('');
      await fetchKhataOverview(true);
      if (data.account?._id) {
        openPassbook(data.account);
      }
    } catch {
      toast('Network error adding Khata entry', 'error');
    }
    setSavingManual(false);
  };

  // --- ADD EXTRA CREDIT INSIDE PASSBOOK ---
  const handleAddExtraCredit = async (e) => {
    e.preventDefault();
    if (!detailAccount) return;
    const amt = r2(extraCreditAmt);
    if (amt <= 0) {
      toast('Enter amount > ₹0', 'error');
      return;
    }
    setSavingExtraCredit(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/khata/manual-credit`, {
        method: 'POST',
        body: JSON.stringify({
          phone: detailAccount.customerPhone,
          customerName: detailAccount.customerName,
          amount: amt,
          note: extraCreditNote.trim() || 'Manual Udhaar Entry',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || 'Could not add credit', 'error');
        setSavingExtraCredit(false);
        return;
      }
      toast(`📒 +₹${amt} Added to Khata! New Due: ₹${r2(data.account?.currentBalance)}`);
      setExtraCreditAmt('');
      setExtraCreditNote('');
      await fetchKhataOverview(true);
      await fetchAccountDetail(detailAccount._id, true);
    } catch {
      toast('Network error adding credit', 'error');
    }
    setSavingExtraCredit(false);
  };

  // --- SAVE ACCOUNT CREDIT LIMIT & NOTES ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!detailAccount) return;
    setSavingSettings(true);
    try {
      const res = await shopFetch(shopData, `/shops/${shopData._id}/khata/${detailAccount._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customerName: editName.trim() || detailAccount.customerName,
          creditLimit: editLimit === '' ? 0 : Math.max(0, Number(editLimit) || 0),
          notes: editNotes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || 'Failed to update settings', 'error');
        setSavingSettings(false);
        return;
      }
      toast('✅ Khata Account Settings Saved!');
      setDetailAccount(data.account);
      await fetchKhataOverview(true);
      setActiveActionPanel('NONE');
    } catch {
      toast('Network error saving settings', 'error');
    }
    setSavingSettings(false);
  };

  // --- FILTERED & SORTED ACCOUNTS ---
  const filteredAccounts = useMemo(() => {
    let list = [...khataData.accounts];

    if (filterMode === 'DUE') {
      list = list.filter((a) => r2(a.currentBalance) > 0);
    } else if (filterMode === 'PENDING_UPI') {
      list = list.filter((a) => (a.pendingVerificationCount || 0) > 0);
    } else if (filterMode === 'OVER_LIMIT') {
      list = list.filter((a) => a.creditLimit > 0 && r2(a.currentBalance) >= a.creditLimit);
    } else if (filterMode === 'SETTLED') {
      list = list.filter((a) => r2(a.currentBalance) === 0);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          String(a.customerName || '').toLowerCase().includes(q) ||
          String(a.customerPhone || '').toLowerCase().includes(q) ||
          String(a.notes || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'HIGHEST_DUE') {
      list.sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0));
    } else if (sortBy === 'RECENT') {
      list.sort((a, b) => new Date(b.lastTransactionAt || 0) - new Date(a.lastTransactionAt || 0));
    } else if (sortBy === 'NAME') {
      list.sort((a, b) => String(a.customerName || '').localeCompare(String(b.customerName || '')));
    }

    return list;
  }, [khataData.accounts, filterMode, searchQuery, sortBy]);

  // Filtered passbook transactions
  const filteredTransactions = useMemo(() => {
    if (txFilter === 'BILLS') {
      return detailTransactions.filter((t) => t.type === 'CREDIT_BILL' || t.type === 'MANUAL_CREDIT');
    }
    if (txFilter === 'PAYMENTS') {
      return detailTransactions.filter((t) => t.type === 'PAYMENT_CASH' || t.type === 'PAYMENT_UPI');
    }
    return detailTransactions;
  }, [detailTransactions, txFilter]);

  // Identify the oldest credit entry ID in this passbook to badge "FIRST KHATA ENTRY"
  const oldestCreditTxId = useMemo(() => {
    const credits = detailTransactions.filter((t) => t.type === 'CREDIT_BILL' || t.type === 'MANUAL_CREDIT');
    return credits.length > 0 ? credits[credits.length - 1]._id : null;
  }, [detailTransactions]);

  const { summary, pendingApprovals } = khataData;

  const jamaUpiUri = hasShopUpi && r2(jamaAmount) > 0
    ? `upi://pay?pa=${encodeURIComponent(shopData.upiId)}&pn=${encodeURIComponent(shopData.name || 'Store')}&am=${r2(jamaAmount)}&cu=INR&tn=${encodeURIComponent(`Khata Jama ${detailAccount?.customerPhone || ''}`)}`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* 📊 1. KHATA BOOK EXECUTIVE HEADER & KPI STRIP */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        borderRadius: '20px',
        padding: '18px 20px',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.22)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📒 Store Khata Book (Udhaar &amp; Vasooli Ledger)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
              Live digital passbooks synced with Counter POS, Customer App &amp; Official PDF Statements
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid #fbbf24',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              ➕ Add Manual Khata / Old Balance
            </button>
            {onQuickPosBill && (
              <button
                type="button"
                onClick={onQuickPosBill}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid #34d399',
                  background: 'rgba(16, 185, 129, 0.16)',
                  color: '#6ee7b7',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                ⚡ Counter POS
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(251, 191, 36, 0.35)', borderRadius: '14px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.7rem', color: '#fde68a', fontWeight: 800, textTransform: 'uppercase' }}>
              💰 Total Market Udhaar
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fbbf24', marginTop: '3px' }}>
              ₹{r2(summary.totalReceivable)}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#cbd5e1' }}>
              Across <strong>{summary.activeCustomersCount || 0}</strong> active customer{summary.activeCustomersCount === 1 ? '' : 's'}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(52, 211, 153, 0.35)', borderRadius: '14px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.7rem', color: '#86efac', fontWeight: 800, textTransform: 'uppercase' }}>
              ✅ Today&apos;s Vasooli (Jama)
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#34d399', marginTop: '3px' }}>
              ₹{r2(summary.todayCollected)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
              Cash ₹{r2(summary.todayCashCollected)} • UPI ₹{r2(summary.todayUpiCollected)}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '14px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase' }}>
              🧾 Today&apos;s Udhaar Given
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#f87171', marginTop: '3px' }}>
              +₹{r2(summary.todayCreditGiven)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
              {summary.settledCustomersCount || 0} Settled Account{summary.settledCustomersCount === 1 ? '' : 's'}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: '14px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase' }}>
              🔔 Attention &amp; Alerts
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: summary.pendingVerificationCount > 0 ? '#fde047' : '#f8fafc', marginTop: '4px' }}>
              ⏳ {summary.pendingVerificationCount || 0} Pending UPI Claim{summary.pendingVerificationCount === 1 ? '' : 's'}
            </div>
            <div style={{ fontSize: '0.76rem', color: summary.overLimitCount > 0 ? '#fca5a5' : '#94a3b8', fontWeight: 700, marginTop: '3px' }}>
              ⚠️ {summary.overLimitCount || 0} Over Credit Limit
            </div>
          </div>
        </div>
      </div>

      {/* 🔔 2. PRIORITY PENDING UPI APPROVALS BANNER */}
      {pendingApprovals.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '16px',
          padding: '14px 16px',
          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.15)',
        }}>
          <div style={{ fontWeight: 900, color: '#92400e', fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⏳ Customer UPI Payment Claims Awaiting Your Confirmation ({pendingApprovals.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingApprovals.map((claim) => (
              <div
                key={claim._id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  border: '1px solid #fcd34d',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>
                    {claim.customerName} ({claim.customerPhone}) — Claimed <span style={{ color: '#15803d' }}>₹{r2(claim.amount)}</span> via UPI
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Current Khata Balance: <strong>₹{r2(claim.currentBalance)}</strong>
                    {claim.utrOrRef ? ` • UTR/Ref: ${claim.utrOrRef}` : ''}
                    {claim.note ? ` • "${claim.note}"` : ''}
                    {' • '}
                    {new Date(claim.createdAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {rejectingTxId === claim._id ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Reason (e.g. Not received in bank)"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '0.78rem' }}
                    />
                    <button
                      type="button"
                      disabled={verifyingTxId === claim._id}
                      onClick={() => handleVerifyUpi(claim._id, 'reject', rejectReason || 'UPI not received in bank statement')}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer' }}
                    >
                      Confirm Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRejectingTxId(null); setRejectReason(''); }}
                      style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={verifyingTxId === claim._id}
                      onClick={() => handleVerifyUpi(claim._id, 'approve')}
                      style={{
                        padding: '7px 13px',
                        borderRadius: '9px',
                        border: 'none',
                        background: '#16a34a',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      {verifyingTxId === claim._id ? 'Confirming…' : '✅ Confirm Received'}
                    </button>
                    <button
                      type="button"
                      disabled={verifyingTxId === claim._id}
                      onClick={() => setRejectingTxId(claim._id)}
                      style={{
                        padding: '7px 11px',
                        borderRadius: '9px',
                        border: '1px solid #fca5a5',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔍 3. CUSTOMER LEDGER DIRECTORY & FILTERS */}
      <div style={{ background: '#ffffff', borderRadius: '18px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `All (${khataData.accounts.length})` },
              { id: 'DUE', label: `💰 Has Due (${summary.activeCustomersCount || 0})` },
              { id: 'PENDING_UPI', label: `⏳ UPI Verify (${summary.pendingVerificationCount || 0})` },
              { id: 'OVER_LIMIT', label: `⚠️ Over Limit (${summary.overLimitCount || 0})` },
              { id: 'SETTLED', label: `✅ Settled (${summary.settledCustomersCount || 0})` },
            ].map((f) => {
              const active = filterMode === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: active ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                    background: active ? '#0f172a' : '#f8fafc',
                    color: active ? '#ffffff' : '#334155',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', background: '#fff' }}
          >
            <option value="HIGHEST_DUE">Sort: Highest Due First</option>
            <option value="RECENT">Sort: Most Recent Activity</option>
            <option value="NAME">Sort: Customer Name (A–Z)</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="🔎 Search Khata customer by name, 10-digit mobile number, or note…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1.5px solid #cbd5e1',
            fontSize: '0.86rem',
            fontWeight: 600,
            boxSizing: 'border-box',
            marginBottom: '14px',
          }}
        />

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
            Loading Store Khata Ledgers…
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>📒</div>
            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>
              {khataData.accounts.length === 0 ? 'No Khata Accounts Yet' : 'No Matching Khata Customers'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '420px', margin: '6px auto 14px' }}>
              {khataData.accounts.length === 0
                ? 'Create a Khata bill directly from Counter POS (select 📒 Khata Due) or add an existing customer balance manually.'
                : 'Try clearing your search or switching the filter pill above.'}
            </div>
            {khataData.accounts.length === 0 && (
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#d97706', color: '#fff', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                ➕ Add First Customer Khata
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredAccounts.map((acc) => {
              const bal = r2(acc.currentBalance);
              const isOverLimit = acc.creditLimit > 0 && bal >= acc.creditLimit;
              return (
                <div
                  key={acc._id}
                  onClick={() => openPassbook(acc)}
                  style={{
                    padding: '13px 16px',
                    borderRadius: '14px',
                    background: isOverLimit ? '#fef2f2' : bal > 0 ? '#fffbeb' : '#f8fafc',
                    border: `1.5px solid ${isOverLimit ? '#fca5a5' : bal > 0 ? '#fde68a' : '#e2e8f0'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'transform 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: bal > 0 ? '#d97706' : '#16a34a',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.05rem',
                      flexShrink: 0,
                    }}>
                      {String(acc.customerName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                          {acc.customerName || 'Customer'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                          📞 {acc.customerPhone}
                        </span>
                        {acc.userId && (
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 7px', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 800 }}>
                            📱 App Linked
                          </span>
                        )}
                        {isOverLimit && (
                          <span style={{ background: '#dc2626', color: '#fff', padding: '2px 7px', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 900 }}>
                            ⚠️ Over Limit (₹{acc.creditLimit})
                          </span>
                        )}
                        {(acc.pendingVerificationCount || 0) > 0 && (
                          <span style={{ background: '#fef08a', color: '#854d0e', border: '1px solid #facc15', padding: '2px 7px', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 900 }}>
                            ⏳ {acc.pendingVerificationCount} UPI Verify
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
                        Lifetime Udhaar: ₹{r2(acc.totalCreditGiven)} • Paid: ₹{r2(acc.totalSettled)}
                        {acc.lastTransactionAt
                          ? ` • Last Entry: ${new Date(acc.lastTransactionAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                          : ''}
                        {acc.lastReminderAt
                          ? ` • Reminded ${new Date(acc.lastReminderAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                          : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: bal > 0 ? '#92400e' : '#15803d', textTransform: 'uppercase' }}>
                        {bal > 0 ? 'Net Due' : 'Status'}
                      </div>
                      <div style={{ fontSize: '1.22rem', fontWeight: 900, color: isOverLimit ? '#dc2626' : bal > 0 ? '#b45309' : '#16a34a' }}>
                        {bal > 0 ? `₹${bal}` : '₹0 Cleared ✅'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPassbook(acc);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Open Passbook ›
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= ➕ ADD MANUAL KHATA / OPENING BALANCE MODAL ================= */}
      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <form
            onSubmit={handleCreateManualCredit}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '22px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 900 }}>
                ➕ Add Manual Khata / Opening Balance
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
              Bring an existing paper register balance online or record quick manual store credit without creating an itemized POS cart.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Customer 10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="e.g. 9876543210"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #cbd5e1', fontWeight: 800, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #cbd5e1', fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Udhaar Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    placeholder="₹500"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', border: '1.5px solid #d97706', fontWeight: 900, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Credit Limit (Optional ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3000"
                    value={manualLimit}
                    onChange={(e) => setManualLimit(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', border: '1px solid #cbd5e1', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Particulars / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Previous diary balance / Monthly rashan"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '9px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={savingManual}
                style={{
                  marginTop: '6px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: savingManual ? 'wait' : 'pointer',
                }}
              >
                {savingManual ? 'Saving Khata Entry…' : '📒 Save Khata Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= 📖 CUSTOMER KHATA PASSBOOK MODAL ================= */}
      {selectedAccountId && (
        <div
          onClick={closePassbook}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.78)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '22px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 28px 70px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {loadingDetail || !detailAccount ? (
              <div style={{ padding: '50px 24px', textAlign: 'center', color: '#64748b', fontWeight: 800 }}>
                Loading Customer Khata Passbook…
              </div>
            ) : (
              <>
                {/* Modal Top Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#fff',
                  padding: '18px 20px',
                  borderTopLeftRadius: '22px',
                  borderTopRightRadius: '22px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>
                          📒 {detailAccount.customerName}
                        </h3>
                        <a
                          href={`tel:${detailAccount.customerPhone}`}
                          style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', textDecoration: 'none', padding: '3px 9px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}
                        >
                          📞 {detailAccount.customerPhone}
                        </a>
                      </div>
                      {detailAccount.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>
                          📌 {detailAccount.notes}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={closePassbook}
                      style={{ border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '0.95rem', cursor: 'pointer', fontWeight: 900 }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Balance Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px', marginTop: '14px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.4)' }}>
                      <div style={{ fontSize: '0.68rem', color: '#fde68a', fontWeight: 800, textTransform: 'uppercase' }}>
                        Net Pending Khata
                      </div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: r2(detailAccount.currentBalance) > 0 ? '#fbbf24' : '#34d399', marginTop: '2px' }}>
                        {r2(detailAccount.currentBalance) > 0 ? `₹${r2(detailAccount.currentBalance)}` : '₹0 Cleared ✅'}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase' }}>
                        Total Credit Given
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginTop: '2px' }}>
                        ₹{r2(detailAccount.totalCreditGiven)}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase' }}>
                        Total Paid (Jama)
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#86efac', marginTop: '2px' }}>
                        ₹{r2(detailAccount.totalSettled)}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase' }}>
                        Credit Limit
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 900, color: detailAccount.creditLimit > 0 && r2(detailAccount.currentBalance) >= detailAccount.creditLimit ? '#fca5a5' : '#e2e8f0', marginTop: '2px' }}>
                        {detailAccount.creditLimit > 0 ? `₹${detailAccount.creditLimit}` : 'No Limit'}
                      </div>
                    </div>
                  </div>

                  {/* Quick Share / PDF / Action Bar */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await sendKhataStatementWhatsApp(detailAccount, detailTransactions, shopData, { toast });
                        shopFetch(shopData, `/shops/${shopData._id}/khata/${detailAccount._id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ markReminderSent: true }),
                        }).catch(() => {});
                      }}
                      style={{ padding: '8px 12px', borderRadius: '9px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      📲 Send Statement / Reminder PDF on WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          toast('Generating Khata Statement PDF…', 'info');
                          await downloadKhataStatementPdf(detailAccount, detailTransactions, shopData);
                          toast('📄 Statement PDF Downloaded!');
                        } catch {
                          toast('Failed to generate Statement PDF', 'error');
                        }
                      }}
                      style={{ padding: '8px 12px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      📄 Statement PDF
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Action Panel Switcher */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'COLLECT', label: '💰 Record Payment (Jama)', bg: '#dcfce7', activeBg: '#16a34a', fg: '#166534' },
                      { id: 'ADD_CREDIT', label: '➕ Add Udhaar', bg: '#fef3c7', activeBg: '#d97706', fg: '#92400e' },
                      { id: 'SETTINGS', label: '⚙️ Credit Limit & Notes', bg: '#f1f5f9', activeBg: '#334155', fg: '#334155' },
                    ].map((tab) => {
                      const active = activeActionPanel === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveActionPanel(active ? 'NONE' : tab.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: active ? `2px solid ${tab.activeBg}` : '1px solid #cbd5e1',
                            background: active ? tab.activeBg : tab.bg,
                            color: active ? '#fff' : tab.fg,
                            fontWeight: 900,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* PANEL A: COLLECT PAYMENT (JAMA) */}
                  {activeActionPanel === 'COLLECT' && (
                    <form
                      onSubmit={handleRecordJama}
                      style={{ padding: '14px', borderRadius: '14px', background: '#f0fdf4', border: '1.5px solid #86efac' }}
                    >
                      {r2(detailAccount.currentBalance) <= 0 ? (
                        <div style={{ color: '#166534', fontWeight: 800, fontSize: '0.84rem' }}>
                          🎉 This customer&apos;s Khata is completely settled (₹0 due)!
                        </div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 900, color: '#166534', fontSize: '0.88rem', marginBottom: '8px' }}>
                            💰 Collect Khata Payment (Pending: ₹{r2(detailAccount.currentBalance)})
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <input
                              type="number"
                              min="1"
                              step="0.01"
                              max={r2(detailAccount.currentBalance)}
                              required
                              placeholder="Amount received (₹)"
                              value={jamaAmount}
                              onChange={(e) => setJamaAmount(e.target.value)}
                              style={{ flex: 1, minWidth: '140px', padding: '9px 12px', borderRadius: '9px', border: '2px solid #16a34a', fontWeight: 900, fontSize: '0.95rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setJamaAmount(String(r2(detailAccount.currentBalance)))}
                              style={{ padding: '8px 12px', borderRadius: '9px', border: '1px solid #16a34a', background: '#fff', color: '#166534', fontWeight: 900, fontSize: '0.76rem', cursor: 'pointer' }}
                            >
                              Full ₹{r2(detailAccount.currentBalance)}
                            </button>
                            <button
                              type="button"
                              onClick={() => setJamaMode('CASH')}
                              style={{ padding: '8px 12px', borderRadius: '9px', border: jamaMode === 'CASH' ? '2px solid #15803d' : '1px solid #cbd5e1', background: jamaMode === 'CASH' ? '#16a34a' : '#fff', color: jamaMode === 'CASH' ? '#fff' : '#334155', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              💵 Cash
                            </button>
                            <button
                              type="button"
                              onClick={() => setJamaMode('UPI')}
                              style={{ padding: '8px 12px', borderRadius: '9px', border: jamaMode === 'UPI' ? '2px solid #2563eb' : '1px solid #cbd5e1', background: jamaMode === 'UPI' ? '#2563eb' : '#fff', color: jamaMode === 'UPI' ? '#fff' : '#334155', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              📱 UPI
                            </button>
                          </div>

                          {jamaMode === 'UPI' && jamaUpiUri && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 10px', background: '#fff', borderRadius: '10px', border: '1px dashed #3b82f6', marginBottom: '8px' }}>
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=6&data=${encodeURIComponent(jamaUpiUri)}`}
                                alt="Jama UPI QR"
                                style={{ width: '74px', height: '74px', borderRadius: '8px' }}
                              />
                              <div style={{ fontSize: '0.78rem', color: '#1e3a8a' }}>
                                <div style={{ fontWeight: 900 }}>Scan to Pay ₹{r2(jamaAmount)}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>UPI ID: {shopData.upiId}</div>
                              </div>
                            </div>
                          )}

                          <input
                            type="text"
                            placeholder="Optional note (e.g. Paid by son / GPay ref)"
                            value={jamaNote}
                            onChange={(e) => setJamaNote(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.8rem', boxSizing: 'border-box', marginBottom: '8px' }}
                          />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#166534', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={sendWhatsAppJama}
                                onChange={(e) => setSendWhatsAppJama(e.target.checked)}
                              />
                              📲 Send Jama Receipt PDF on WhatsApp
                            </label>

                            <button
                              type="submit"
                              disabled={savingJama}
                              style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 900, fontSize: '0.84rem', cursor: 'pointer' }}
                            >
                              {savingJama ? 'Saving…' : `✅ Confirm ₹${r2(jamaAmount)} Jama`}
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  )}

                  {/* PANEL B: ADD MANUAL CREDIT */}
                  {activeActionPanel === 'ADD_CREDIT' && (
                    <form
                      onSubmit={handleAddExtraCredit}
                      style={{ padding: '14px', borderRadius: '14px', background: '#fffbeb', border: '1.5px solid #fcd34d', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}
                    >
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        placeholder="Udhaar ₹"
                        value={extraCreditAmt}
                        onChange={(e) => setExtraCreditAmt(e.target.value)}
                        style={{ width: '120px', padding: '9px 10px', borderRadius: '9px', border: '1.5px solid #d97706', fontWeight: 900 }}
                      />
                      <input
                        type="text"
                        placeholder="Reason / items note (e.g. Milk + Bread)"
                        value={extraCreditNote}
                        onChange={(e) => setExtraCreditNote(e.target.value)}
                        style={{ flex: 1, minWidth: '180px', padding: '9px 10px', borderRadius: '9px', border: '1px solid #fcd34d' }}
                      />
                      <button
                        type="submit"
                        disabled={savingExtraCredit}
                        style={{ padding: '9px 16px', borderRadius: '9px', border: 'none', background: '#d97706', color: '#fff', fontWeight: 900, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        {savingExtraCredit ? 'Adding…' : '➕ Add to Khata'}
                      </button>
                    </form>
                  )}

                  {/* PANEL C: SETTINGS */}
                  {activeActionPanel === 'SETTINGS' && (
                    <form
                      onSubmit={handleSaveSettings}
                      style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569' }}>Customer Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontWeight: 700 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569' }}>Credit Limit (₹, 0 = Unlimited)</label>
                          <input
                            type="number"
                            min="0"
                            value={editLimit}
                            onChange={(e) => setEditLimit(e.target.value)}
                            placeholder="0"
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontWeight: 700 }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569' }}>Private Shopkeeper Note</label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="e.g. Settles on 5th of every month, House #12"
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={savingSettings}
                        style={{ alignSelf: 'flex-end', padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        {savingSettings ? 'Saving…' : '💾 Save Settings'}
                      </button>
                    </form>
                  )}

                  {/* PASSBOOK TIMELINE HEADER & FILTERS */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.94rem' }}>
                      📜 Chronological Passbook ({filteredTransactions.length})
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'BILLS', label: '🧾 Credit Bills' },
                        { id: 'PAYMENTS', label: '💵 Payments' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setTxFilter(f.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            border: txFilter === f.id ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                            background: txFilter === f.id ? '#0f172a' : '#fff',
                            color: txFilter === f.id ? '#fff' : '#475569',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PASSBOOK TRANSACTION ENTRIES */}
                  {filteredTransactions.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                      No transactions in this filter.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredTransactions.map((tx) => {
                        const isCredit = tx.type === 'CREDIT_BILL' || tx.type === 'MANUAL_CREDIT';
                        const isPending = tx.verificationStatus === 'PendingVerification';
                        const isRejected = tx.verificationStatus === 'Rejected';
                        const linkedOrder = tx.orderId && typeof tx.orderId === 'object' ? tx.orderId : null;
                        const isFirstEntry = tx._id === oldestCreditTxId || linkedOrder?.khataSnapshot?.isFirstTimeKhata;
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: '180px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 900, fontSize: '0.84rem', color: '#0f172a' }}>
                                    {tx.type === 'CREDIT_BILL'
                                      ? `🧾 Counter Bill #${String(linkedOrder?._id || '').slice(-5).toUpperCase()}`
                                      : tx.type === 'MANUAL_CREDIT'
                                        ? '📝 Manual Khata Credit'
                                        : tx.type === 'PAYMENT_UPI'
                                          ? '📱 UPI Jama Payment'
                                          : '💵 Cash Jama Payment'}
                                  </span>
                                  {isFirstEntry && isCredit && (
                                    <span style={{ background: '#7c3aed', color: '#fff', padding: '1px 7px', borderRadius: '999px', fontSize: '0.64rem', fontWeight: 900 }}>
                                      🆕 FIRST KHATA ENTRY
                                    </span>
                                  )}
                                  {isPending && (
                                    <span style={{ background: '#f59e0b', color: '#fff', padding: '1px 7px', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 900 }}>
                                      ⏳ Awaiting Your Verification
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span style={{ background: '#dc2626', color: '#fff', padding: '1px 7px', borderRadius: '999px', fontSize: '0.66rem', fontWeight: 900 }}>
                                      ❌ Rejected
                                    </span>
                                  )}
                                  {linkedOrder?.paymentStatus === 'Paid' && (
                                    <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '1px 6px', borderRadius: '999px', fontSize: '0.64rem', fontWeight: 800 }}>
                                      ✅ Bill Settled
                                    </span>
                                  )}
                                </div>

                                <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: '3px' }}>
                                  {new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  {tx.utrOrRef ? ` • UTR: ${tx.utrOrRef}` : ''}
                                  {tx.note ? ` • ${tx.note}` : ''}
                                </div>

                                {/* Inline Approve / Reject if Pending */}
                                {isPending && (
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                    <button
                                      type="button"
                                      disabled={verifyingTxId === tx._id}
                                      onClick={() => handleVerifyUpi(tx._id, 'approve')}
                                      style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 900, fontSize: '0.74rem', cursor: 'pointer' }}
                                    >
                                      ✅ Confirm UPI Received
                                    </button>
                                    <button
                                      type="button"
                                      disabled={verifyingTxId === tx._id}
                                      onClick={() => handleVerifyUpi(tx._id, 'reject', 'UPI payment not received')}
                                      style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}
                                    >
                                      ✕ Reject
                                    </button>
                                  </div>
                                )}

                                {/* Action links for Bill or Payment receipt */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                  {linkedOrder && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedTxId(isExpanded ? null : tx._id)}
                                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                      >
                                        {isExpanded ? '▲ Hide Items' : `▼ View ${(linkedOrder.items || []).length} Items`}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => downloadReceiptPdf(linkedOrder, shopData)}
                                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                      >
                                        📄 Bill PDF
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => sendBillToCustomerWhatsApp(linkedOrder, shopData, { toast })}
                                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #86efac', background: '#f0fdf4', color: '#15803d', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                      >
                                        📲 WhatsApp Bill
                                      </button>
                                      <a
                                        href={getPublicBillUrl(linkedOrder._id, shopData._id, shopData.pincode)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}
                                      >
                                        🌐 Web Bill
                                      </a>
                                    </>
                                  )}

                                  {!isCredit && tx.verificationStatus === 'Confirmed' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => downloadKhataStatementPdf(detailAccount, detailTransactions, shopData, { paymentTx: tx })}
                                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #86efac', background: '#fff', color: '#15803d', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                      >
                                        📄 Jama PDF
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => sendKhataStatementWhatsApp(detailAccount, detailTransactions, shopData, { toast, paymentTx: tx })}
                                        style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #86efac', background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                      >
                                        📲 WhatsApp Jama Parchi
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{
                                  fontWeight: 900,
                                  fontSize: '1rem',
                                  color: isRejected ? '#94a3b8' : isPending ? '#b45309' : isCredit ? '#b91c1c' : '#15803d',
                                  textDecoration: isRejected ? 'line-through' : 'none',
                                }}>
                                  {isCredit ? `+₹${r2(tx.amount)}` : `-₹${r2(tx.amount)}`}
                                </div>
                                {!isPending && !isRejected && (
                                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                                    Bal: ₹{r2(tx.balanceAfter)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Expanded POS Bill Items */}
                            {isExpanded && linkedOrder && (
                              <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '8px', background: '#ffffff', border: '1px dashed #cbd5e1', fontSize: '0.75rem' }}>
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
                                      {` • Added to Khata: ₹${m.addedToKhata}`}
                                      {linkedOrder.khataSettledAmount > 0 ? ` • Settled Later: ₹${r2(linkedOrder.khataSettledAmount)}` : ''}
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
          </div>
        </div>
      )}
    </div>
  );
}
