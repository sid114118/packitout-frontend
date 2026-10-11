import React, { useState, useEffect } from 'react';
import { adminFetch, BASE_URL } from '../../utils/api.js';
import { useToast } from '../../ui/DialogProvider.jsx';

export default function CampaignsTab({ adminToken }) {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [emoji, setEmoji] = useState('🪔');
  const [keywords, setKeywords] = useState('');
  const [bannerColor, setBannerColor] = useState('linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${BASE_URL}/campaigns`);
      if (res.ok) setCampaigns(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !keywords) return toast('Title and keywords required', 'warn');
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        subtitle,
        emoji,
        bannerColor,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k)
      };
      const res = await adminFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast('Campaign launched globally! 🚀');
        setTitle('');
        setSubtitle('');
        setKeywords('');
        fetchCampaigns();
      } else {
        toast('Failed to create campaign', 'error');
      }
    } catch (err) {
      toast('Network error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Stop this global campaign?')) return;
    try {
      const res = await adminFetch(`/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Campaign stopped');
        fetchCampaigns();
      } else {
        toast('Failed to delete', 'error');
      }
    } catch (err) {
      toast('Network error', 'error');
    }
  };

  if (loading) return <div>Loading campaigns...</div>;

  return (
    <div>
      <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>🌍 Global Occasions / Campaigns</h2>

      <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#166534' }}>Launch New Campaign</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
             <input type="text" placeholder="Emoji (🪔)" value={emoji} onChange={e => setEmoji(e.target.value)} style={{ width: '60px', padding: '10px', borderRadius: '8px', border: '1px solid #86efac', textAlign: 'center' }} />
             <input type="text" placeholder="Campaign Title (e.g. Diwali Specials)" value={title} onChange={e => setTitle(e.target.value)} required style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #86efac' }} />
          </div>
          <input type="text" placeholder="Subtitle (e.g. Get your Pooja Essentials in 1 Click!)" value={subtitle} onChange={e => setSubtitle(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #86efac' }} />
          <input type="text" placeholder="Smart Keywords (comma separated, e.g. diya, sweets, pooja)" value={keywords} onChange={e => setKeywords(e.target.value)} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #86efac' }} />
          
          <div>
            <label style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 'bold' }}>Banner CSS Gradient:</label>
            <input type="text" value={bannerColor} onChange={e => setBannerColor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #86efac', marginTop: '5px' }} />
          </div>

          <button type="submit" disabled={isSubmitting} style={{ padding: '12px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isSubmitting ? 'wait' : 'pointer' }}>
            {isSubmitting ? 'Launching...' : '🚀 Launch Campaign Globally'}
          </button>
        </form>
      </div>

      <h3 style={{ color: '#334155' }}>Active Campaigns ({campaigns.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {campaigns.map(c => (
          <div key={c._id} style={{ padding: '15px', borderRadius: '16px', background: c.bannerColor, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem', background: 'rgba(255,255,255,0.2)', padding: '5px', borderRadius: '10px' }}>{c.emoji}</span>
                {c.title}
              </h3>
              <p style={{ margin: 0, opacity: 0.9 }}>{c.subtitle}</p>
              <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {c.keywords.map(k => (
                  <span key={k} style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{k}</span>
                ))}
              </div>
            </div>
            <button onClick={() => handleDelete(c._id)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Stop
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
