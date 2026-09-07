import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/patients')
      .then(res => setPatients(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase()) ||
    p.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="container page-pad">
      <div className="fade-up" style={{ marginBottom: 26 }}>
        <h1 className="page-title">👥 Patients</h1>
        <p className="page-subtitle">Everyone you're caring for, in one place.</p>
      </div>

      <div className="fade-up-1" style={{ maxWidth: 420, marginBottom: 22 }}>
        <input
          type="search"
          placeholder="🔍 Search by name or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      {loading ? (
        <div className="grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 190 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{query ? '🔎' : '👤'}</div>
          <h3>{query ? 'No matches found' : 'No patients yet'}</h3>
          <p>{query ? `Nothing matches “${query}”. Try a different search.` : 'Add patients from the dashboard to see them here.'}</p>
          <Link to="/caretaker/dashboard"><button style={{ marginTop: 16 }}>Go to dashboard</button></Link>
        </div>
      ) : (
        <div className="grid fade-up-1">
          {filtered.map(p => (
            <div key={p.patient_id} className="card hoverable" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div className="avatar-gradient" style={{ width: 54, height: 54, fontSize: '1.4rem' }}>
                  {p.name?.charAt(0) || 'P'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.08rem' }}>{p.name}</div>
                  <div style={{ fontSize: '.84rem', color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className="badge badge-green">{p.games_completed || 0} games</span>
                <span className="badge badge-blue">{Math.round(p.avg_accuracy || 0)}% acc</span>
                {p.age && <span className="badge badge-gray">{p.age} yrs</span>}
              </div>
              <Link to={`/caretaker/patient/${p.patient_id}`} style={{ marginTop: 'auto' }}>
                <button className="secondary" style={{ width: '100%' }}>View details →</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
