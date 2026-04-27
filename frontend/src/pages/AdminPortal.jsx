import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Building2, Users, BookOpen,
    Plus, X, Check, XCircle, TrendingUp
} from 'lucide-react';
import Shell from '../components/Shell';
import { api, getSession } from '../api';

const NAV = [
    { key: 'dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
    { key: 'hospitals', label: 'Hospitals',  Icon: Building2 },
    { key: 'users',     label: 'All Users',  Icon: Users },
    { key: 'logs',      label: 'Audit Logs', Icon: BookOpen },
];

function Modal({ title, onClose, children }) {
    return (
        <div className="modal-overlay">
            <div className="modal anim-slide-up">
                <div className="flex items-center justify-between mb-6">
                    <div className="modal-title">{title}</div>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function useApiData(path) {
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState('');
    const reload = () => {
        setLoading(true);
        api.get(path).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(reload, [path]);
    return { data, loading, error, reload };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
    const { data }       = useApiData('/admin/stats');
    const { data: chain } = useApiData('/blockchain/status');

    const stats = [
        { label: 'Hospitals', value: data?.hospitals, icon: '🏥', color: 'var(--primary)',  accent: '#3b82f6', trend: '+1 this month' },
        { label: 'Doctors',   value: data?.doctors,   icon: '👨‍⚕️', color: 'var(--warning)', accent: '#f59e0b', trend: 'Active staff' },
        { label: 'Patients',  value: data?.patients,  icon: '👥', color: 'var(--accent)',   accent: '#a78bfa', trend: 'Registered' },
        { label: 'Reports',   value: data?.reports,   icon: '📋', color: 'var(--success)',  accent: '#22c55e', trend: 'On IPFS' },
    ];

    return (
        <>
            <h1 className="page-title">System Overview</h1>
            <p className="page-subtitle">Platform-wide statistics and blockchain status</p>

            <div className="stat-grid">
                {stats.map(s => (
                    <div key={s.label} className="stat-card" style={{ '--card-accent': s.accent }}>
                        <div className="stat-icon" style={{ background: `${s.accent}18` }}>
                            <span style={{ fontSize: '1.15rem' }}>{s.icon}</span>
                        </div>
                        <div className="stat-body">
                            <div className="label">{s.label}</div>
                            <div className="value" style={{ color: s.color }}>{s.value ?? '—'}</div>
                            <div className="trend"><TrendingUp size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{s.trend}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Blockchain Status */}
            {chain && (
                <div className="card" style={{ borderLeft: `3px solid ${chain.ipfsTier === 'simulated' ? 'var(--warning)' : chain.ipfsTier === 'local' ? 'var(--success)' : 'var(--primary)'}` }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.95rem' }}>⛓️ Blockchain / IPFS Status</div>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>IPFS Tier</div>
                            <span className={`badge ${chain.ipfsTier === 'local' ? 'badge-green' : chain.ipfsTier === 'pinata' ? 'badge-blue' : 'badge-amber'}`}>
                                {chain.ipfsTier}
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Reports Stored</div>
                            <span style={{ fontWeight: 700 }}>{chain.reportCount}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Uptime</div>
                            <span style={{ fontWeight: 600 }}>{chain.uptime ? `${Math.floor(chain.uptime / 60)}m` : '—'}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Hospitals ─────────────────────────────────────────────────────────────────
function HospitalsPage() {
    const { data, reload } = useApiData('/admin/hospitals');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', city: '', address: '', email: '', phone: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const submit = async (e) => {
        e.preventDefault(); setSaving(true); setErr('');
        try {
            await api.post('/admin/hospitals', form);
            setShowModal(false);
            setForm({ name: '', city: '', address: '', email: '', phone: '', password: '' });
            reload();
        } catch (e) { setErr(e.message); }
        finally { setSaving(false); }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Hospitals</h1>
                    <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage registered healthcare institutions</p>
                </div>
                <button className="btn btn-primary" id="add-hospital-btn" onClick={() => setShowModal(true)}>
                    <Plus size={15} /> Add Hospital
                </button>
            </div>

            <div className="table-wrap">
                <table>
                    <thead><tr><th>Name</th><th>City</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {data?.hospitals?.map(h => (
                            <tr key={h.id}>
                                <td className="fw-600">{h.name}</td>
                                <td>{h.city || '—'}</td>
                                <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{h.email}</td>
                                <td>{h.phone || '—'}</td>
                                <td><span className={`badge ${h.is_active ? 'badge-green' : 'badge-red'}`}>{h.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <button className="btn btn-ghost btn-sm" onClick={() => api.delete(`/admin/hospitals/${h.id}`).then(reload)}>
                                        <XCircle size={13} /> Deactivate
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <Modal title="🏥 Register New Hospital" onClose={() => setShowModal(false)}>
                    {err && <div className="alert alert-error">{err}</div>}
                    <form onSubmit={submit}>
                        <div className="grid-2">
                            <div className="form-group"><label>Hospital Name *</label><input id="h-name" className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label>City</label><input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                            <div className="form-group"><label>Login Email *</label><input id="h-email" type="email" className="input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            <div className="form-group"><label>Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        </div>
                        <div className="form-group"><label>Address</label><input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                        <div className="form-group"><label>Portal Password *</label><input id="h-pass" type="password" className="input" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                        <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Hospital'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}

// ── Users ─────────────────────────────────────────────────────────────────────
function UsersPage() {
    const [roleFilter, setRoleFilter] = useState('');
    const { data, reload } = useApiData(`/admin/users${roleFilter ? `?role=${roleFilter}` : ''}`);

    const toggle = async (id, current) => {
        await api.patch(`/admin/users/${id}/status`, { is_active: !current });
        reload();
    };

    const roleBadge = (role) => {
        const map = { admin: 'badge-purple', hospital: 'badge-green', doctor: 'badge-amber', patient: 'badge-blue' };
        return <span className={`badge ${map[role] || 'badge-teal'}`}>{role}</span>;
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="page-title" style={{ marginBottom: 0 }}>All Users</h1>
                    <p className="page-subtitle" style={{ marginBottom: 0 }}>{data?.users?.length ?? 0} total</p>
                </div>
                <select className="input" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="hospital">Hospital</option>
                    <option value="doctor">Doctor</option>
                    <option value="patient">Patient</option>
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Name</th><th>Email / Wallet</th><th>Role</th><th>Status</th><th>Since</th><th>Actions</th></tr></thead>
                    <tbody>
                        {data?.users?.map(u => (
                            <tr key={u.id}>
                                <td className="fw-600">{u.first_name} {u.last_name}</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{u.email || u.wallet_address || '—'}</td>
                                <td>{roleBadge(u.role)}</td>
                                <td><span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button className={`btn btn-sm ${u.is_active ? 'btn-ghost' : 'btn-success'}`} onClick={() => toggle(u.id, u.is_active)}>
                                        {u.is_active ? <><XCircle size={12} /> Deactivate</> : <><Check size={12} /> Activate</>}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
const ACTION_STYLE = {
    LOGIN:            { cls: 'badge-blue',   label: 'Login' },
    WALLET_LOGIN:     { cls: 'badge-teal',   label: 'Wallet Login' },
    SELF_REGISTER:    { cls: 'badge-green',  label: 'Register' },
    HOSPITAL_SIGNUP:  { cls: 'badge-green',  label: 'Hospital Signup' },
    CREATE_HOSPITAL:  { cls: 'badge-purple', label: 'Create Hospital' },
    REGISTER_DOCTOR:  { cls: 'badge-amber',  label: 'Register Doctor' },
    REGISTER_PATIENT: { cls: 'badge-blue',   label: 'Register Patient' },
    CREATE_REPORT:    { cls: 'badge-green',  label: 'Create Report' },
    LINK_WALLET:      { cls: 'badge-teal',   label: 'Link Wallet' },
    SYSTEM_INIT:      { cls: 'badge-purple', label: 'System Init' },
    DEACTIVATE:       { cls: 'badge-red',    label: 'Deactivate' },
};

function AuditPage() {
    const { data } = useApiData('/admin/audit-logs');
    return (
        <>
            <h1 className="page-title">Audit Logs</h1>
            <p className="page-subtitle">All system actions — tamper-evident activity trail</p>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Actor</th><th>Role</th><th>Action</th><th>Target</th><th>Time</th></tr></thead>
                    <tbody>
                        {data?.logs?.map(l => {
                            const style = ACTION_STYLE[l.action] || { cls: 'badge-purple', label: l.action };
                            return (
                                <tr key={l.id}>
                                    <td style={{ fontSize: '0.85rem' }}>{l.email || `#${l.actor_id}`}</td>
                                    <td>
                                        {l.role && <span className={`badge ${ACTION_STYLE[`${l.role?.toUpperCase()}_x`]?.cls || 'badge-blue'}`} style={{ textTransform: 'capitalize' }}>{l.role}</span>}
                                    </td>
                                    <td><span className={`badge ${style.cls}`}>{style.label}</span></td>
                                    <td style={{ color: 'var(--muted)', fontSize: '0.82rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {String(l.target || '—').slice(0, 40)}
                                    </td>
                                    <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(l.created_at).toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}

// ── Admin Portal Root ─────────────────────────────────────────────────────────
export default function AdminPortal() {
    const [page, setPage] = useState('dashboard');
    const { user } = getSession();

    const PAGE = {
        dashboard: <Dashboard />,
        hospitals: <HospitalsPage />,
        users:     <UsersPage />,
        logs:      <AuditPage />,
    };

    return (
        <Shell
            brand={{ icon: '⚡', name: 'Admin Panel', sub: `${user?.firstName || ''} ${user?.lastName || ''}`, role: 'Admin' }}
            grad="var(--admin-grad)"
            navItems={NAV}
            activePage={page}
            onNav={setPage}
        >
            <div className="anim-slide-up">{PAGE[page]}</div>
        </Shell>
    );
}
