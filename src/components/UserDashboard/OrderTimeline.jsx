import React from 'react';

// Map free-form status strings (set by the shop) to canonical timeline stages.
// Order matters: "cancelled" wins over anything else.
const stageOf = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("deliver") || s.includes("✅") || s.includes("🎉")) return "delivered";
  if (s.includes("ready")) return "ready";
  if (s.includes("pack")) return "packing";
  return "placed";
};

const STAGES = [
  { key: "placed",    label: "Order Placed",      icon: "📝" },
  { key: "packing",   label: "Packing",           icon: "📦" },
  { key: "ready",     label: "Ready to Collect",  icon: "🛍️" },
  { key: "delivered", label: "Picked Up",         icon: "✅" },
];

const stageIndex = (key) => STAGES.findIndex(s => s.key === key);

const fmtTime = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Find the timestamp at which an order first reached a stage.
const timestampForStage = (history, stageKey, fallbackCreatedAt) => {
  if (stageKey === "placed") return fallbackCreatedAt;
  if (!Array.isArray(history)) return null;
  const hit = history.find(h => stageOf(h.status) === stageKey);
  return hit?.at || null;
};

export default function OrderTimeline({ order }) {
  if (!order) return null;

  const currentStage = stageOf(order.status);
  const isCancelled = currentStage === "cancelled";
  const currentIdx = isCancelled ? -1 : stageIndex(currentStage);

  if (isCancelled) {
    const cancelTs = timestampForStage(order.statusHistory, "cancelled", null);
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '14px 16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>❌</span>
          <div>
            <div style={{ fontWeight: '900', color: '#b91c1c', fontSize: '0.95rem' }}>Order Cancelled</div>
            {cancelTs && (
              <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: '600', marginTop: '2px' }}>
                {new Date(cancelTs).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '18px' }}>

      {/* Header: current stage */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.5px' }}>STATUS</div>
        <div style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: '900', marginTop: '2px' }}>
          {STAGES[currentIdx]?.label || "Order Placed"}
        </div>
      </div>

      {/* Vertical timeline */}
      <div style={{ position: 'relative', paddingLeft: '6px' }}>
        {STAGES.map((stage, i) => {
          const reached = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const ts = reached ? timestampForStage(order.statusHistory, stage.key, order.createdAt) : null;
          const isLast = i === STAGES.length - 1;

          return (
            <div key={stage.key} style={{ display: 'flex', gap: '12px', position: 'relative', paddingBottom: isLast ? 0 : '18px' }}>

              {/* Connector line — drawn behind the dot, fades to neutral for unreached stages */}
              {!isLast && (
                <div style={{
                  position: 'absolute',
                  left: '11px', top: '24px', bottom: 0,
                  width: '2px',
                  background: i < currentIdx ? '#16a34a' : '#e2e8f0',
                }} />
              )}

              {/* Dot */}
              <div style={{
                width: '24px', height: '24px', flexShrink: 0,
                borderRadius: '50%',
                background: reached ? '#16a34a' : '#fff',
                border: `2px solid ${reached ? '#16a34a' : '#cbd5e1'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '0.7rem', fontWeight: '900',
                boxShadow: isCurrent ? '0 0 0 4px rgba(22,163,74,0.15)' : 'none',
                zIndex: 1,
              }}>
                {reached ? '✓' : ''}
              </div>

              {/* Label + timestamp */}
              <div style={{ flex: 1, paddingTop: '1px' }}>
                <div style={{
                  fontSize: '0.92rem',
                  fontWeight: isCurrent ? '900' : reached ? '700' : '600',
                  color: reached ? '#0f172a' : '#94a3b8',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span>{stage.icon}</span>
                  <span>{stage.label}</span>
                </div>
                {ts && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                    {fmtTime(ts)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
