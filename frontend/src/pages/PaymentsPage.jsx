import { useEffect, useState } from 'react';
import { paymentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdSearch } from 'react-icons/md';

const METHOD_COLORS = { cash: 'green', bank_transfer: 'blue', upi: 'accent', cheque: 'purple', online: 'orange' };

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (method) params.method = method;
      const res = await paymentsAPI.getAll(params);
      setPayments(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, [method, page]);

  const totalAmount = payments.reduce((s, p) => s + p.amountPaid, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">💳 Payment History</div>
          <div className="page-subtitle">{isAdmin ? 'All recorded payments' : 'Your payment history'}</div>
        </div>
        {payments.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 20px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shown on page</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green)', fontSize: '1.2rem' }}>₹{totalAmount.toLocaleString()}</div>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 160 }} value={method} onChange={e => { setMethod(e.target.value); setPage(1); }}>
          <option value="">All Methods</option>
          {['cash','bank_transfer','upi','cheque','online'].map(m => <option key={m} value={m}>{m.replace('_',' ').toUpperCase()}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              {isAdmin && <th>Resident</th>}
              <th>Amount Paid</th>
              <th>Method</th>
              <th>Transaction ID</th>
              <th>Payment Date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: 'auto' }} /></td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">💳</div><p>No payments recorded yet</p></div></td></tr>
            ) : payments.map(p => (
              <tr key={p._id}>
                <td><span className="primary-text">{p.invoiceId?.invoiceNumber || '—'}</span>
                  {p.invoiceId && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(p.invoiceId.month||1)-1]} {p.invoiceId.year}
                  </div>}
                </td>
                {isAdmin && <td>{p.residentId?.name || '—'}</td>}
                <td style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem' }}>₹{p.amountPaid.toLocaleString()}</td>
                <td><span className={`badge ${METHOD_COLORS[p.paymentMethod] || 'blue'}`}>{p.paymentMethod?.replace('_',' ')}</span></td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {p.transactionId || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td>{format(new Date(p.paymentDate), 'dd MMM yyyy, hh:mm a')}</td>
                <td style={{ color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.remarks || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <span className="page-info">{pagination.total} total payments</span>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
