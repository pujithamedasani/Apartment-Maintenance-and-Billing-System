import { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { MdApartment, MdPeople, MdReceipt, MdAttachMoney, MdBuildCircle, MdWarning, MdCheckCircle, MdHourglassEmpty } from 'react-icons/md';
import { format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#8b90a8', font: { family: 'DM Sans', size: 12 }, boxWidth: 12 } } },
  scales: {
    x: { ticks: { color: '#555c78', font: { family: 'DM Sans', size: 11 } }, grid: { color: '#252a38' } },
    y: { ticks: { color: '#555c78', font: { family: 'DM Sans', size: 11 } }, grid: { color: '#252a38' } }
  }
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(n) { return n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : `₹${n||0}`; }

// ── Admin Dashboard ──
function AdminDashboard({ data }) {
  const { overview, billing, complaints, monthlyRevenue, recentComplaints, recentNotices } = data;

  const revenueChartData = {
    labels: (monthlyRevenue || []).map(d => `${MONTHS[d._id.month - 1]} ${d._id.year}`),
    datasets: [{
      label: 'Revenue Collected',
      data: (monthlyRevenue || []).map(d => d.revenue),
      borderColor: '#f5a623',
      backgroundColor: 'rgba(245,166,35,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#f5a623',
      pointRadius: 4,
    }]
  };

  const complaintChartData = {
    labels: ['Pending', 'In Progress', 'Resolved', 'Closed'],
    datasets: [{
      data: [complaints.pending||0, complaints.in_progress||0, complaints.resolved||0, complaints.closed||0],
      backgroundColor: ['#ef4444','#fb923c','#22c55e','#555c78'],
      borderColor: 'transparent',
      hoverOffset: 6,
    }]
  };

  const statusChartData = {
    labels: ['Paid', 'Partial', 'Unpaid'],
    datasets: [{
      label: 'Invoices',
      data: [
        billing?.paidCount || 0,
        billing?.partialCount || 0,
        billing?.pendingCount || 0,
      ],
      backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(251,146,60,0.7)', 'rgba(239,68,68,0.7)'],
      borderRadius: 6,
    }]
  };

  return (
    <>
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><MdApartment /></div>
          <div className="stat-value">{overview.totalApartments}</div>
          <div className="stat-label">Total Apartments</div>
          <div className="stat-change">{overview.occupancyRate}% occupied · {overview.vacantApartments} vacant</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><MdPeople /></div>
          <div className="stat-value">{overview.totalResidents}</div>
          <div className="stat-label">Active Residents</div>
          <div className="stat-change">{overview.totalStaff} maintenance staff</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon"><MdAttachMoney /></div>
          <div className="stat-value">{fmt(billing.currentMonthTotal)}</div>
          <div className="stat-label">This Month Billed</div>
          <div className="stat-change">{billing.currentMonthCount} invoices generated</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><MdReceipt /></div>
          <div className="stat-value">{fmt(billing.pendingAmount)}</div>
          <div className="stat-label">Pending Dues</div>
          <div className="stat-change">{billing.pendingCount} unpaid invoices</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><MdBuildCircle /></div>
          <div className="stat-value">{(complaints.pending||0) + (complaints.in_progress||0)}</div>
          <div className="stat-label">Open Complaints</div>
          <div className="stat-change">{complaints.resolved||0} resolved this month</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><MdAttachMoney /></div>
          <div className="stat-value">{fmt(billing.recentCollected)}</div>
          <div className="stat-label">Collected (30 days)</div>
          <div className="stat-change">{billing.recentPaymentCount} payments received</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue Trend</div>
              <div className="card-subtitle">Monthly collections over time</div>
            </div>
          </div>
          <div className="chart-container">
            <Line data={revenueChartData} options={{ ...CHART_DEFAULTS }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Complaint Status</div>
              <div className="card-subtitle">Current breakdown</div>
            </div>
          </div>
          <div className="chart-container" style={{ height: 200 }}>
            <Doughnut data={complaintChartData} options={{ ...CHART_DEFAULTS, scales: undefined, cutout: '65%' }} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Complaints</div>
            <span className="badge orange" style={{ textTransform: 'none' }}>{(complaints.pending||0)+(complaints.in_progress||0)} open</span>
          </div>
          {recentComplaints?.length === 0 && <div className="empty-state"><p>No open complaints 🎉</p></div>}
          {(recentComplaints||[]).map(c => (
            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.title}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {c.residentId?.name} · {c.apartmentId?.buildingBlock}-{c.apartmentId?.apartmentNumber}
                </div>
              </div>
              <span className={`badge ${c.status}`}>{c.status.replace('_',' ')}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Latest Notices</div>
          </div>
          {(recentNotices||[]).map(n => (
            <div key={n._id} className={`notice-card ${n.priority}`} style={{ marginBottom: 10 }}>
              <div className="notice-title">{n.title}</div>
              <div className="notice-body" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
              <div className="notice-meta">
                <span>{n.category}</span>
                <span>·</span>
                <span>{format(new Date(n.createdAt), 'dd MMM yyyy')}</span>
              </div>
            </div>
          ))}
          {!recentNotices?.length && <div className="empty-state"><p>No notices posted yet</p></div>}
        </div>
      </div>
    </>
  );
}

// ── Resident Dashboard ──
function ResidentDashboard({ data }) {
  const { totalDue, pendingInvoices, recentPayments, myComplaints, notices } = data;

  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        <div className="stat-card red">
          <div className="stat-icon"><MdReceipt /></div>
          <div className="stat-value">{fmt(totalDue)}</div>
          <div className="stat-label">Total Dues</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><MdHourglassEmpty /></div>
          <div className="stat-value">{pendingInvoices?.length || 0}</div>
          <div className="stat-label">Pending Bills</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><MdCheckCircle /></div>
          <div className="stat-value">{recentPayments?.length || 0}</div>
          <div className="stat-label">Recent Payments</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"><MdBuildCircle /></div>
          <div className="stat-value">{myComplaints?.filter(c => c.status !== 'resolved')?.length || 0}</div>
          <div className="stat-label">Open Complaints</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pending Invoices</div>
          </div>
          {!pendingInvoices?.length && <div className="empty-state"><p>All dues cleared! 🎉</p></div>}
          {(pendingInvoices||[]).map(inv => (
            <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {MONTHS[(inv.month||1)-1]} {inv.year}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Due: {format(new Date(inv.dueDate), 'dd MMM yyyy')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{inv.amount - inv.amountPaid}</div>
                <span className={`badge ${inv.paymentStatus}`}>{inv.paymentStatus}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Society Notices</div></div>
          {(notices||[]).map(n => (
            <div key={n._id} className={`notice-card ${n.priority}`} style={{ marginBottom: 10 }}>
              <div className="notice-title">{n.title}</div>
              <div className="notice-body" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
            </div>
          ))}
          {!notices?.length && <div className="empty-state"><p>No notices posted yet</p></div>}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const fn = user?.role === 'admin' ? dashboardAPI.admin : dashboardAPI.resident;
        const res = await fn();
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetch();
  }, [user]);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            {user?.role === 'admin' ? '📊 Admin Dashboard' : user?.role === 'maintenance' ? '🔧 Work Dashboard' : '🏠 My Dashboard'}
          </div>
          <div className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {data && user?.role === 'admin' && <AdminDashboard data={data} />}
      {data && user?.role === 'resident' && <ResidentDashboard data={data} />}
      {data && user?.role === 'maintenance' && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Your Assigned Complaints</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Navigate to the Complaints tab to view and update your assigned tasks.</p>
        </div>
      )}
    </div>
  );
}
