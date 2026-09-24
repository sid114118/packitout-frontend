import fs from 'fs';

let content = fs.readFileSync('src/UserDashboard.jsx', 'utf8');

content = content.replace(
  "import TermsModal from './components/UserDashboard/TermsModal.jsx';",
  "import TermsModal from './components/UserDashboard/TermsModal.jsx';\nimport RequestItemModal from './components/UserDashboard/RequestItemModal.jsx';"
);

content = content.replace(
  "const [showComplaint, setShowComplaint] = useState(false);",
  "const [showComplaint, setShowComplaint] = useState(false);\n  const [showRequestItem, setShowRequestItem] = useState(false);"
);

content = content.replace(
  "{showTerms && <TermsModal onClose={() => setShowTerms(false)} />}",
  "{showTerms && <TermsModal onClose={() => setShowTerms(false)} />}\n      {showRequestItem && <RequestItemModal user={user} onClose={() => setShowRequestItem(false)} />}"
);

const btnStr = `<button
            onClick={() => setShowComplaint(true)}`;

const btnRep = `<button
            onClick={() => setShowRequestItem(true)}
            style={{
              width: '100%', padding: '14px 16px',
              background: '#fff', border: 'none', borderTop: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                width: '38px', height: '38px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>📦</span>
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Request a Product</span>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Ask shops to add missing items</span>
              </span>
            </span>
            <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>›</span>
          </button>

          <button
            onClick={() => setShowComplaint(true)}`;

content = content.replace(btnStr, btnRep);

fs.writeFileSync('src/UserDashboard.jsx', content);
console.log("Updated UserDashboard!");
