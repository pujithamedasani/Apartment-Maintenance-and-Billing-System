import { useEffect, useState } from 'react';
import { complaintsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdClose, MdExpandMore } from 'react-icons/md';
import { format } from 'date-fns';

const CATEGORIES = ['plumbing','electrical','cleaning','security','lift','parking','noise','other'];
const STATUSES = ['pending','in_progress','resolved','closed'];
const PRIORITIES = ['low','medium','high','urgent'];

function NewComplaintModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'plumbing', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await complaintsAPI.create(form);
      toast.success('Complaint submitted successfully');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">🔧 Raise Complaint</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Brief description of the issue" value={form.title} onChange={set('title')} required />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Category *</label>
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
            <label className="form-label">Detailed Description *</label>
            <textarea className="form-textarea" placeholder="Describe the issue in detail..." value={form.description} onChange={set('description')} required />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Complaint'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateModal({ complaint, onClose, onSave, isAdmin }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ status: complaint.status, assignedTo: complaint.assignedTo?._id || '', note: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (isAdmin) usersAPI.getAll({ role: 'maintenance', limit: 50 }).then(r => setStaff(r.data.data)).catch(() => {});
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await complaintsAPI.update(complaint._id, form);
      toast.success('Complaint updated');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-title">{complaint.ticketNumber}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{complaint.title}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><MdClose /></button>
        </div>

        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 16, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {complaint.description}
        </div>

        {/* Status History */}
        {complaint.statusHistory?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>HISTORY</div>
            <div className="timeline">
              {[...complaint.statusHistory].reverse().map((h, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-label">{h.status?.replace('_',' ').toUpperCase()} — {h.note}</div>
                    <div className="timeline-time">{format(new Date(h.changedAt), 'dd MMM yyyy, hh:mm a')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select className="form-select" value={form.status} onChange={set('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
              </select>
            </div>
            {isAdmin && (
              <div className="form-group">
                <label className="form-label">Assign To (Staff)</label>
                <select className="form-select" value={form.assignedTo} onChange={set('assignedTo')}>
                  <option value="">— Unassigned —</option>
                  {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Note / Remarks</label>
            <input className="form-input" placeholder="Add a note about the update..." value={form.note} onChange={set('note')} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ComplaintsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isResident = user?.role === 'resident';
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await complaintsAPI.getAll(params);
      setComplaints(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, [filters, page]);

  const setFilter = k => e => { setFilters(f => ({ ...f, [k]: e.target.value })); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🔧 Complaints</div>
          <div className="page-subtitle">{isAdmin ? 'Manage all maintenance complaints' : isResident ? 'Raise and track your issues' : 'Your assigned tasks'}</div>
        </div>
        {isResident && (
          <button className="btn btn-primary" onClick={() => setModal('create')}>
            <MdAdd /> Raise Complaint
          </button>
        )}
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 150 }} value={filters.status} onChange={setFilter('status')}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ').toUpperCase()}</option>)}
        </select>
        <select className="form-select" style={{ width: 150 }} value={filters.category} onChange={setFilter('category')}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
        <select className="form-select" style={{ width: 130 }} value={filters.priority} onChange={setFilter('priority')}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Title</th>
              {isAdmin && <th>Resident</th>}
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              {isAdmin && <th>Assigned To</th>}
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">🔧</div><p>No complaints found</p></div></td></tr>
            ) : complaints.map(c => (
              <tr key={c._id}>
                <td><span className="primary-text" style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{c.ticketNumber}</span></td>
                <td style={{ maxWidth: 200 }}>
                  <div className="primary-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{c.title}</div>
                  {c.apartmentId && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.apartmentId.buildingBlock}-{c.apartmentId.apartmentNumber}</div>}
                </td>
                {isAdmin && <td>{c.residentId?.name || '—'}</td>}
                <td><span className="badge blue">{c.category}</span></td>
                <td><span className={`badge ${c.priority}`}>{c.priority}</span></td>
                <td><span className={`badge ${c.status}`}>{c.status.replace('_',' ')}</span></td>
                {isAdmin && <td>{c.assignedTo?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>}
                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{format(new Date(c.createdAt), 'dd MMM yy')}</td>
                <td>
                  {(isAdmin || user?.role === 'maintenance') && c.status !== 'closed' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setUpdateModal(c)}>Update</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <span className="page-info">{pagination.total} total</span>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}

      {modal === 'create' && <NewComplaintModal onClose={() => setModal(null)} onSave={() => { setModal(null); fetchComplaints(); }} />}
      {updateModal && <UpdateModal complaint={updateModal} isAdmin={isAdmin} onClose={() => setUpdateModal(null)} onSave={() => { setUpdateModal(null); fetchComplaints(); }} />}
    </div>
  );
}
