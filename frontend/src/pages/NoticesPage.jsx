import { useEffect, useState } from 'react';
import { noticesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdAdd, MdClose, MdDelete } from 'react-icons/md';
import { format } from 'date-fns';

const CATEGORIES = ['general','maintenance','billing','event','emergency','rules'];
const PRIORITIES = ['normal','important','urgent'];

const PRIORITY_ICONS = { normal: '📢', important: '⚠️', urgent: '🚨' };

function NoticeModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', message: '', category: 'general', priority: 'normal' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await noticesAPI.create(form);
      toast.success('Notice posted');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">📢 Post Notice</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Notice subject..." value={form.title} onChange={set('title')} required />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Message *</label>
            <textarea className="form-textarea" placeholder="Write the notice here..." value={form.message} onChange={set('message')} required />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Posting...' : 'Post Notice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NoticesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      const res = await noticesAPI.getAll(params);
      setNotices(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load notices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, [filterCategory, filterPriority, page]);

  const handleDelete = async (id) => {
    if (!confirm('Remove this notice?')) return;
    try {
      await noticesAPI.delete(id);
      toast.success('Notice removed');
      fetchNotices();
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📣 Notice Board</div>
          <div className="page-subtitle">Society announcements and updates</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <MdAdd /> Post Notice
          </button>
        )}
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 160 }} value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
        <select className="form-select" style={{ width: 150 }} value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : notices.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-icon">📭</div>
          <p>No notices posted yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {notices.map(n => (
            <div key={n._id} className={`notice-card ${n.priority}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: '1.1rem' }}>{PRIORITY_ICONS[n.priority]}</span>
                    <div className="notice-title">{n.title}</div>
                    <span className={`badge ${n.priority}`}>{n.priority}</span>
                    <span className="badge blue">{n.category}</span>
                  </div>
                  <div className="notice-body">{n.message}</div>
                  <div className="notice-meta">
                    <span>Posted by {n.createdBy?.name || 'Admin'}</span>
                    <span>·</span>
                    <span>{format(new Date(n.createdAt), 'dd MMMM yyyy, hh:mm a')}</span>
                  </div>
                </div>
                {isAdmin && (
                  <button className="btn btn-danger btn-icon btn-sm" style={{ marginLeft: 12, flexShrink: 0 }} onClick={() => handleDelete(n._id)}>
                    <MdDelete />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination" style={{ marginTop: 20 }}>
          <span className="page-info">{pagination.total} total</span>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}

      {modal && <NoticeModal onClose={() => setModal(false)} onSave={() => { setModal(false); fetchNotices(); }} />}
    </div>
  );
}
