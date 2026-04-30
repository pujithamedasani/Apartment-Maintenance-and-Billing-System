import { useEffect, useState } from 'react';
import { usersAPI, apartmentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdPerson } from 'react-icons/md';

const ROLES = ['resident', 'maintenance', 'admin'];
const EMPTY = { name: '', email: '', password: '', phone: '', role: 'resident', apartmentId: '' };

function ResidentModal({ resident, onClose, onSave }) {
  const [form, setForm] = useState(resident ? {
    name: resident.name, email: resident.email, phone: resident.phone || '',
    role: resident.role, apartmentId: resident.apartmentId?._id || '',
  } : EMPTY);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    apartmentsAPI.getAll({ limit: 100 }).then(r => setApartments(r.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.apartmentId) delete payload.apartmentId;
      if (resident && !payload.password) delete payload.password;

      if (resident) {
        await usersAPI.update(resident._id, payload);
        toast.success('Resident updated');
      } else {
        await usersAPI.create(payload);
        toast.success('Resident created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{resident ? 'Edit User' : 'Add User'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="Arjun Sharma" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          {!resident && (
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />
            </div>
          )}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={set('role')}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign Apartment</label>
              <select className="form-select" value={form.apartmentId} onChange={set('apartmentId')}>
                <option value="">— Not Assigned —</option>
                {apartments.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.buildingBlock}-{a.apartmentNumber} ({a.isOccupied && a.currentResidentId?._id !== resident?._id ? '⚠ Occupied' : 'Available'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : (resident ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResidentsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;
      const res = await usersAPI.getAll(params);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, filterRole, page]);

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">👥 Residents & Staff</div>
          <div className="page-subtitle">Manage all users in the system</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <MdAdd /> Add User
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <MdSearch className="search-icon" />
          <input className="form-input" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-select" style={{ width: 150 }} value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Apartment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">👤</div><p>No users found</p></div></td></tr>
            ) : users.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="user-avatar" style={{ width: 30, height: 30, fontSize: '0.7rem' }}>
                      {u.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <span className="primary-text">{u.name}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                <td>
                  {u.apartmentId
                    ? <span style={{ color: 'var(--blue)', fontWeight: 500 }}>
                        Block {u.apartmentId.buildingBlock}-{u.apartmentId.apartmentNumber}
                      </span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>
                  }
                </td>
                <td><span className={`badge ${u.isActive ? 'paid' : 'unpaid'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(u)} title="Edit"><MdEdit /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(u._id)} title="Deactivate"><MdDelete /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <span className="page-info">Page {page} of {pagination.pages} · {pagination.total} total</span>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}

      {modal && (
        <ResidentModal
          resident={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}
