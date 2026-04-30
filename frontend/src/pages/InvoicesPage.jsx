import { useEffect, useState } from 'react';
import { invoicesAPI, usersAPI, apartmentsAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdAdd, MdSearch, MdClose, MdPayment, MdAutorenew } from 'react-icons/md';
import { format } from 'date-fns';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function GenerateModal({ onClose, onSave }) {
  const [residents, setResidents] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [form, setForm] = useState({ residentId: '', apartmentId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), maintenanceCharge: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    Promise.all([
      usersAPI.getAll({ role: 'resident', limit: 100 }),
      apartmentsAPI.getAll({ isOccupied: true, limit: 100 })
    ]).then(([ru, ra]) => {
      setResidents(ru.data.data);
      setApartments(ra.data.data);
    }).catch(() => {});
  }, []);

  const handleResidentChange = (e) => {
    const resId = e.target.value;
    const resident = residents.find(r => r._id === resId);
    const apt = apartments.find(a => a.currentResidentId?._id === resId || a._id === resident?.apartmentId?._id);
    setForm(f => ({
      ...f,
      residentId: resId,
      apartmentId: apt?._id || '',
      maintenanceCharge: apt?.monthlyMaintenance || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.residentId || !form.apartmentId) { toast.error('Please select resident and apartment'); return; }
    setLoading(true);
    try {
      await invoicesAPI.generate({
        residentId: form.residentId,
        apartmentId: form.apartmentId,
        month: Number(form.month),
        year: Number(form.year),
        breakdown: { maintenanceCharge: Number(form.maintenanceCharge) }
      });
      toast.success('Invoice generated');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Generate Invoice</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Resident *</label>
            <select className="form-select" value={form.residentId} onChange={handleResidentChange} required>
              <option value="">Select resident...</option>
              {residents.map(r => <option key={r._id} value={r._id}>{r.name} — {r.email}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Apartment</label>
            <input className="form-input" value={apartments.find(a => a._id === form.apartmentId)
              ? `Block ${apartments.find(a => a._id === form.apartmentId).buildingBlock}-${apartments.find(a => a._id === form.apartmentId).apartmentNumber}`
              : '—'} readOnly style={{ opacity: 0.7 }} />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Month *</label>
              <select className="form-select" value={form.month} onChange={set('month')}>
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year *</label>
              <input className="form-input" type="number" value={form.year} onChange={set('year')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Maintenance Charge (₹)</label>
            <input className="form-input" type="number" value={form.maintenanceCharge} onChange={set('maintenanceCharge')} placeholder="Auto-filled from apartment" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Generating...' : 'Generate Invoice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PayModal({ invoice, onClose, onSave }) {
  const [form, setForm] = useState({ amountPaid: invoice.amount - invoice.amountPaid, paymentMethod: 'upi', transactionId: '', remarks: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await paymentsAPI.record({ invoiceId: invoice._id, ...form, amountPaid: Number(form.amountPaid) });
      toast.success('Payment recorded successfully');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Record Payment</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><MdClose /></button>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invoice #{invoice.invoiceNumber}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{invoice.residentId?.name}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Total: ₹{invoice.amount}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--red)' }}>Due: ₹{invoice.amount - invoice.amountPaid}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount Paying (₹) *</label>
            <input className="form-input" type="number" value={form.amountPaid} onChange={set('amountPaid')} min={1} max={invoice.amount - invoice.amountPaid} required />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" value={form.paymentMethod} onChange={set('paymentMethod')}>
              {['cash','bank_transfer','upi','cheque','online'].map(m => <option key={m} value={m}>{m.replace('_',' ').toUpperCase()}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Transaction ID</label>
            <input className="form-input" placeholder="UPI/Ref number (optional)" value={form.transactionId} onChange={set('transactionId')} />
          </div>
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea className="form-textarea" placeholder="Any notes..." value={form.remarks} onChange={set('remarks')} style={{ minHeight: 60 }} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Processing...' : 'Record Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', month: '', year: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await invoicesAPI.getAll(params);
      setInvoices(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, [filters, page]);

  const handleBulkGenerate = async () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    if (!confirm(`Generate invoices for all occupied apartments for ${MONTHS[month-1]} ${year}?`)) return;
    setBulkLoading(true);
    try {
      const res = await invoicesAPI.generateBulk({ month, year });
      toast.success(res.data.message);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk generation failed');
    } finally { setBulkLoading(false); }
  };

  const setFilter = k => e => { setFilters(f => ({ ...f, [k]: e.target.value })); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🧾 Invoices</div>
          <div className="page-subtitle">{isAdmin ? 'Manage all maintenance invoices' : 'Your billing history'}</div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={handleBulkGenerate} disabled={bulkLoading}>
              <MdAutorenew /> {bulkLoading ? 'Generating...' : 'Bulk Generate'}
            </button>
            <button className="btn btn-primary" onClick={() => setModal('create')}>
              <MdAdd /> New Invoice
            </button>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 140 }} value={filters.status} onChange={setFilter('status')}>
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <select className="form-select" style={{ width: 140 }} value={filters.month} onChange={setFilter('month')}>
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <input className="form-input" style={{ width: 100 }} placeholder="Year" type="number" value={filters.year} onChange={setFilter('year')} />
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              {isAdmin && <th>Resident</th>}
              <th>Apartment</th>
              <th>Period</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Due Date</th>
              <th>Status</th>
              {isAdmin && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={9}><div className="empty-state"><div className="empty-icon">🧾</div><p>No invoices found</p></div></td></tr>
            ) : invoices.map(inv => (
              <tr key={inv._id}>
                <td><span className="primary-text">{inv.invoiceNumber}</span></td>
                {isAdmin && <td>{inv.residentId?.name || '—'}</td>}
                <td>{inv.apartmentId ? `${inv.apartmentId.buildingBlock}-${inv.apartmentId.apartmentNumber}` : '—'}</td>
                <td>{MONTHS[(inv.month||1)-1].slice(0,3)} {inv.year}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{inv.amount}</td>
                <td style={{ color: 'var(--green)' }}>₹{inv.amountPaid}</td>
                <td style={{ color: new Date(inv.dueDate) < new Date() && inv.paymentStatus !== 'paid' ? 'var(--red)' : 'var(--text-secondary)' }}>
                  {format(new Date(inv.dueDate), 'dd MMM yyyy')}
                </td>
                <td><span className={`badge ${inv.paymentStatus}`}>{inv.paymentStatus}</span></td>
                {isAdmin && (
                  <td>
                    {inv.paymentStatus !== 'paid' && (
                      <button className="btn btn-primary btn-sm" onClick={() => setPayModal(inv)}>
                        <MdPayment /> Pay
                      </button>
                    )}
                  </td>
                )}
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

      {modal === 'create' && <GenerateModal onClose={() => setModal(null)} onSave={() => { setModal(null); fetchInvoices(); }} />}
      {payModal && <PayModal invoice={payModal} onClose={() => setPayModal(null)} onSave={() => { setPayModal(null); fetchInvoices(); }} />}
    </div>
  );
}
