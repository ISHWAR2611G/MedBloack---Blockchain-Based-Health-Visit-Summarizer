import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, UserPlus, Stethoscope, Users,
    Calendar, ClipboardList, Plus, X, Search, Activity
} from 'lucide-react';
import Shell from '../components/Shell';
import { api, getSession } from '../api';

const NAV = [
    { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { key: 'doctors', label: 'Doctors', Icon: Stethoscope },
    { key: 'patients', label: 'Patients', Icon: Users },
    { key: 'reports', label: 'Reports', Icon: ClipboardList },
    { key: 'appointments', label: 'Appointments', Icon: Calendar },
];

function useApiData(path) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const reload = () => {
        setLoading(true);
        api.get(path).then(setData).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(reload, [path]);
    return { data, loading, reload };
}

function Modal({ title, onClose, children }) {
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ user }) {
    const { data } = useApiData('/hospital/stats');
    return (
        <>
            <h1 className="page-title">Hospital Dashboard</h1>
            <p className="page-subtitle">Live statistics for your hospital.</p>

            <div className="stat-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="label">Doctors</div>
                    <div className="value" style={{ color: 'var(--warning)' }}>{data?.doctors ?? '—'}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Patients</div>
                    <div className="value" style={{ color: 'var(--accent)' }}>{data?.patients ?? '—'}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Reports</div>
                    <div className="value" style={{ color: 'var(--success)' }}>{data?.reports ?? '—'}</div>
                </div>
                <div className="stat-card">
                    <div className="label">Pending Appts</div>
                    <div className="value" style={{ color: 'var(--primary)' }}>{data?.pendingAppointments ?? '—'}</div>
                </div>
            </div>

            {/* Hospital info card */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: '2rem' }}>🏥</div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{user?.firstName} {user?.lastName}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>Hospital Administrator · MedBlock</div>
                </div>
            </div>
        </>
    );
}

// ── Doctors ───────────────────────────────────────────────────────────────────
function DoctorsPage() {
    const { data, reload } = useApiData('/hospital/doctors');
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', walletAddress: '', specialization: '', phone: '' });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [q, setQ] = useState('');

    const submit = async (e) => {
        e.preventDefault(); setSaving(true); setErr('');
        try { await api.post('/hospital/doctors', form); setShow(false); setForm({ firstName: '', lastName: '', walletAddress: '', specialization: '', phone: '' }); reload(); }
        catch (e) { setErr(e.message); }
        finally { setSaving(false); }
    };

    const filtered = (data?.doctors ?? []).filter(d =>
        !q || `${d.first_name} ${d.last_name} ${d.specialization}`.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="page-title" style={{ marginBottom: 0 }}>Doctors</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                        <input className="input" style={{ paddingLeft: 28, width: 180 }} placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" id="add-doctor-btn" onClick={() => setShow(true)}>
                        <Plus size={16} /> Add Doctor
                    </button>
                </div>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Name</th><th>Specialization</th><th>Wallet Address</th><th>Phone</th><th>Status</th></tr></thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
                                {q ? 'No doctors match your search.' : 'No doctors registered yet.'}
                            </td></tr>
                        )}
                        {filtered.map(d => (
                            <tr key={d.id}>
                                <td className="fw-600">{d.first_name} {d.last_name}</td>
                                <td>{d.specialization || '—'}</td>
                                <td style={{ fontSize: '0.76rem', color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.wallet_address}</td>
                                <td>{d.phone || '—'}</td>
                                <td><span className={`badge ${d.is_active ? 'badge-green' : 'badge-red'}`}>{d.is_active ? 'Active' : 'Inactive'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {show && (
                <Modal title="Register Doctor" onClose={() => setShow(false)}>
                    {err && <div className="alert alert-error">{err}</div>}
                    <form onSubmit={submit}>
                        <div className="grid-2">
                            <div className="form-group"><label>First Name *</label><input id="doc-fname" className="input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                            <div className="form-group"><label>Last Name</label><input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
                            <div className="form-group"><label>Specialization</label><input className="input" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></div>
                            <div className="form-group"><label>Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        </div>
                        <div className="form-group"><label>MetaMask Wallet Address *</label><input id="doc-wallet" className="input" required placeholder="0x…" value={form.walletAddress} onChange={e => setForm({ ...form, walletAddress: e.target.value })} /></div>
                        <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Register Doctor'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}

// ── Patients ──────────────────────────────────────────────────────────────────
function PatientsPage() {
    const { data, reload } = useApiData('/hospital/patients');
    const [show, setShow] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', dateOfBirth: '' });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [q, setQ] = useState('');

    const submit = async (e) => {
        e.preventDefault(); setSaving(true); setErr('');
        try { await api.post('/hospital/patients', form); setShow(false); setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', dateOfBirth: '' }); reload(); }
        catch (e) { setErr(e.message); }
        finally { setSaving(false); }
    };

    const filtered = (data?.patients ?? []).filter(p =>
        !q || `${p.first_name} ${p.last_name} ${p.email} ${p.phone}`.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="page-title" style={{ marginBottom: 0 }}>Patients</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                        <input className="input" style={{ paddingLeft: 28, width: 180 }} placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" id="add-patient-btn" onClick={() => setShow(true)}>
                        <Plus size={16} /> Register Patient
                    </button>
                </div>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>D.O.B</th><th>Registered</th></tr></thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
                                {q ? 'No patients match your search.' : 'No patients registered yet.'}
                            </td></tr>
                        )}
                        {filtered.map(p => (
                            <tr key={p.id}>
                                <td style={{ color: 'var(--muted)', fontSize: '0.83rem' }}>#{p.id}</td>
                                <td className="fw-600">{p.first_name} {p.last_name}</td>
                                <td>{p.email}</td>
                                <td>{p.phone || '—'}</td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                                    {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('en-IN') : '—'}
                                </td>
                                <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                                    {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {show && (
                <Modal title="Register Patient" onClose={() => setShow(false)}>
                    {err && <div className="alert alert-error">{err}</div>}
                    <form onSubmit={submit}>
                        <div className="grid-2">
                            <div className="form-group"><label>First Name *</label><input id="pat-fname" className="input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                            <div className="form-group"><label>Last Name</label><input className="input" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
                            <div className="form-group"><label>Email *</label><input id="pat-email" type="email" className="input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            <div className="form-group"><label>Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                            <div className="form-group"><label>Date of Birth</label><input type="date" className="input" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
                        </div>
                        <div className="form-group"><label>Portal Password *</label><input id="pat-pass" type="password" className="input" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                        <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                            <button type="button" className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Register Patient'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function ReportsPage() {
    const { data } = useApiData('/hospital/reports');
    return (
        <>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">{data?.reports?.length ?? 0} report(s) issued by this hospital.</p>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Patient</th><th>Doctor</th><th>IPFS CID</th><th>Date</th><th>Verified</th></tr></thead>
                    <tbody>
                        {data?.reports?.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>No reports yet.</td></tr>
                        )}
                        {data?.reports?.map(r => (
                            <tr key={r.id}>
                                <td className="fw-600">{r.patient_first} {r.patient_last}</td>
                                <td>{r.doctor_first} {r.doctor_last}</td>
                                <td style={{ fontSize: '0.76rem', color: 'var(--muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.cid}</td>
                                <td style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td>
                                    {r.tx_hash
                                        ? <span className="badge badge-green">Verified</span>
                                        : <span className="badge badge-amber">Pending</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

// ── Appointments ──────────────────────────────────────────────────────────────
function AppointmentsPage() {
    const { data } = useApiData('/hospital/appointments');
    const upcoming = data?.appointments?.filter(a => a.status === 'scheduled') ?? [];
    const past = data?.appointments?.filter(a => a.status !== 'scheduled') ?? [];

    return (
        <>
            <h1 className="page-title">Appointments</h1>

            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Upcoming</div>
            <div className="table-wrap" style={{ marginBottom: 24 }}>
                <table>
                    <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Reason</th><th>Status</th></tr></thead>
                    <tbody>
                        {upcoming.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No upcoming appointments.</td></tr>
                        )}
                        {upcoming.map(a => (
                            <tr key={a.id}>
                                <td className="fw-600">{a.patient_first} {a.patient_last}</td>
                                <td>{a.doctor_first} {a.doctor_last}<br /><span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{a.specialization}</span></td>
                                <td>{new Date(a.appointment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td>{a.reason || '—'}</td>
                                <td><span className="badge badge-blue">{a.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {past.length > 0 && (
                <>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Past</div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Reason</th><th>Status</th></tr></thead>
                            <tbody>
                                {past.map(a => (
                                    <tr key={a.id}>
                                        <td>{a.patient_first} {a.patient_last}</td>
                                        <td>{a.doctor_first} {a.doctor_last}</td>
                                        <td style={{ color: 'var(--muted)', fontSize: '0.83rem' }}>{new Date(a.appointment_date).toLocaleDateString()}</td>
                                        <td>{a.reason || '—'}</td>
                                        <td><span className={`badge ${a.status === 'completed' ? 'badge-green' : 'badge-red'}`}>{a.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </>
    );
}

export default function HospitalPortal() {
    const [page, setPage] = useState('dashboard');
    const { user } = getSession();
    const PAGE = {
        dashboard: <Dashboard user={user} />,
        doctors: <DoctorsPage />,
        patients: <PatientsPage />,
        reports: <ReportsPage />,
        appointments: <AppointmentsPage />,
    };

    return (
        <Shell
            brand={{ icon: '🏥', name: 'Hospital Panel', sub: user?.firstName || 'Hospital Admin', role: 'Hospital Admin' }}
            grad="var(--hospital-grad)"
            navItems={NAV}
            activePage={page}
            onNav={setPage}
        >
            <div className="anim-slide-up">{PAGE[page]}</div>
        </Shell>
    );
}
