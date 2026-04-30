import { useEffect, useState } from 'react';
import { apartmentsAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdApartment } from 'react-icons/md';

const EMPTY_FORM = { apartmentNumber: '', buildingBlock: '', floor: '', type: '2BHK', area: '', monthlyMaintenance: '', parkingSlot: '' };

function ApartmentModal({ apt, onClose, onSave }) {
  const [form, setForm] = useState(apt ? {
    apartmentNumber: apt.apartmentNumber,
    buildingBlock: apt.buildingBlock,
    floor: apt.floor,
    type: apt.type,
    area: apt.area,
    monthlyMaintenance: apt.monthlyMaintenance,
    parkingSlot: apt.parkingSlot || '',
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (apt) {
        await apartmentsAPI.update(apt._id, form);
        toast.success('Apartment updated');
      } else {
        await apartmentsAPI.create(form);
        toast.success('Apartment created');
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
          <div className="modal-title">{apt ? 'Edit Apartment' : 'Add Apartment'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Apartment Number *</label>
              <input className="form-input" placeholder="A101" value={form.apartmentNumber} onChange={set('apartmentNumber')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Building Block *</label>
              <input className="form-input" placeholder="A" value={form.buildingBlock} onChange={set('buildingBlock')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Floor *</label>
              <input className="form-input" type="number" placeholder="1" value={form.floor} onChange={set('floor')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select className="form-select" value={form.type} onChange={set('type')}>
                {['1BHK','2BHK','3BHK','4BHK','Studio','Penthouse'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Area (sq ft) *</label>
              <input className="form-input" type="number" placeholder="950" value={form.area} onChange={set('area')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Maintenance (₹) *</label>
              <input className="form-input" type="number" placeholder="2500" value={form.monthlyMaintenance} onChange={set('monthlyMaintenance')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Parking Slot</label>
            <input className="form-input" placeholder="P-12 (optional)" value={form.parkingSlot} onChange={set('parkingSlot')} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : (apt ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ApartmentsPage() {
  const [apts, setApts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | apt object
  const [search, setSearch] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchApts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterBlock) params.block = filterBlock;
      const [res, statsRes] = await Promise.all([apartmentsAPI.getAll(params), apartmentsAPI.stats()]);
      setApts(res.data.data);
      setPagination(res.data.pagination);
      setStats(statsRes.data.data);
    } catch { toast.error('Failed to load apartments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApts(); }, [search, filterBlock, page]);

  const handleDelete = async (id, occupied) => {
    if (occupied) { toast.error('Cannot delete occupied apartment'); return; }
    if (!confirm('Delete this apartment?')) return;
    try {
      await apartmentsAPI.delete(id);
      toast.success('Apartment deleted');
      fetchApts();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🏢 Apartments</div>
          <div className="page-subtitle">Manage all apartment units in the society</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <MdAdd /> Add Apartment
        </button>
      </div>

      {stats && (
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
          {[
            { label: 'Total', value: stats.total, color: 'blue' },
            { label: 'Occupied', value: stats.occupied, color: 'green' },
            { label: 'Vacant', value: stats.vacant, color: 'orange' },
            { label: 'Occupancy', value: `${stats.occupancyRate}%`, color: 'accent' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.color}`} style={{ padding: 16 }}>
              <div className="stat-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="filter-bar">
        <div className="search-input-wrap">
          <MdSearch className="search-icon" />
          <input className="form-input" placeholder="Search apartments..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-select" style={{ width: 140 }} value={filterBlock} onChange={e => { setFilterBlock(e.target.value); setPage(1); }}>
          <option value="">All Blocks</option>
          {['A','B','C','D'].map(b => <option key={b} value={b}>Block {b}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Apartment</th>
              <th>Block / Floor</th>
              <th>Type</th>
              <th>Area</th>
              <th>Maintenance</th>
              <th>Resident</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
            ) : apts.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">🏢</div><p>No apartments found</p></div></td></tr>
            ) : apts.map(apt => (
              <tr key={apt._id}>
                <td><span className="primary-text">{apt.apartmentNumber}</span></td>
                <td>Block {apt.buildingBlock} · Floor {apt.floor}</td>
                <td><span className="badge blue">{apt.type}</span></td>
                <td>{apt.area} sq ft</td>
                <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{apt.monthlyMaintenance}</td>
                <td>{apt.currentResidentId?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td><span className={`badge ${apt.isOccupied ? 'paid' : 'unpaid'}`}>{apt.isOccupied ? 'Occupied' : 'Vacant'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setModal(apt)}><MdEdit /></button>
                    <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => handleDelete(apt._id, apt.isOccupied)}><MdDelete /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <span className="page-info">Page {page} of {pagination.pages}</span>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}

      {modal && (
        <ApartmentModal
          apt={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchApts(); }}
        />
      )}
    </div>
  );
}
