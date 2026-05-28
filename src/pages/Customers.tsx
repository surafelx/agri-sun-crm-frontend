import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { customers as cApi, installations as iApi } from '../lib/api';
import { Plus, Search, MapPin, Phone, ChevronRight, Wrench, X, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const EMPTY_CUSTOMER = {
  fullName: '', phone: '', region: '', zone: '', woreda: '',
  specificLocation: '', latitude: '', longitude: '', notes: '',
};

const EMPTY_INSTALL = {
  projectTitle: '', status: 'Pending', deliveredBy: '', receivedBy: '',
  installationDate: '', remarks: '',
  wellData: { diameter: '', depth: '', waterLevel: '', casingSize: '', casingType: '' },
  activitiesPerformed: {
    casing: false, solarPump: false, testing: false,
    solarPanelStructure: false, sprinkler: false, practicalTraining: false,
  },
};

const ACTIVITIES: [string, string][] = [
  ['casing', 'Casing'], ['solarPump', 'Solar Pump'], ['testing', 'Testing'],
  ['solarPanelStructure', 'Solar Panel Structure'], ['sprinkler', 'Sprinkler'],
  ['practicalTraining', 'Practical Training'],
];

export default function Customers() {
  const [list, setList]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  // Customer form (create / edit)
  const [showCreate, setShowCreate]   = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [form, setForm]               = useState({ ...EMPTY_CUSTOMER });
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState('');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Inline customer detail panel
  const [selected, setSelected]             = useState<any>(null);
  const [customerInstalls, setCustomerInstalls] = useState<any[]>([]);
  const [loadingInstalls, setLoadingInstalls]   = useState(false);

  // Inline installation form (toggleable inside the panel)
  const [showInstallForm, setShowInstallForm] = useState(false);
  const [installForm, setInstallForm]         = useState<any>({ ...EMPTY_INSTALL });
  const [savingInstall, setSavingInstall]     = useState(false);
  const [installError, setInstallError]       = useState('');

  // On mobile, panel slides up as a full overlay
  const [panelOpen, setPanelOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await cApi.list({ search, limit: 50 });
    setList(r.data.customers);
    setTotal(r.data.total);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openEdit = (c: any) => {
    setForm({
      fullName: c.fullName, phone: c.phone || '', region: c.region,
      zone: c.zone || '', woreda: c.woreda || '',
      specificLocation: c.specificLocation || '',
      latitude: c.latitude ?? '', longitude: c.longitude ?? '',
      notes: c.notes || '',
    });
    setEditCustomer(c);
    setFormError('');
  };

  const saveCustomer = async () => {
    setFormError(''); setSaving(true);
    try {
      const body = {
        ...form,
        latitude:  form.latitude  !== '' ? Number(form.latitude)  : null,
        longitude: form.longitude !== '' ? Number(form.longitude) : null,
      };
      if (editCustomer) {
        await cApi.update(editCustomer._id, body);
      } else {
        await cApi.create(body);
      }
      setShowCreate(false); setEditCustomer(null); setForm({ ...EMPTY_CUSTOMER });
      load();
    } catch (e: any) {
      setFormError(e.response?.data?.message || 'Error saving customer');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await cApi.delete(deleteTarget._id);
    setDeleteTarget(null);
    if (selected?._id === deleteTarget._id) { setSelected(null); setPanelOpen(false); }
    load();
  };

  const selectCustomer = async (c: any) => {
    setSelected(c);
    setPanelOpen(true);
    setShowInstallForm(false);
    setInstallForm({ ...EMPTY_INSTALL });
    setLoadingInstalls(true);
    setCustomerInstalls([]);
    const r = await cApi.installations(c._id);
    setCustomerInstalls(r.data.installations);
    setLoadingInstalls(false);
  };

  const saveInstallation = async () => {
    setInstallError(''); setSavingInstall(true);
    try {
      const body = {
        ...installForm,
        customer: selected._id,
        installationDate: installForm.installationDate || null,
        wellData: {
          diameter:   installForm.wellData.diameter   !== '' ? Number(installForm.wellData.diameter)   : null,
          depth:      installForm.wellData.depth      !== '' ? Number(installForm.wellData.depth)      : null,
          waterLevel: installForm.wellData.waterLevel !== '' ? Number(installForm.wellData.waterLevel) : null,
          casingSize: installForm.wellData.casingSize,
          casingType: installForm.wellData.casingType,
        },
      };
      await iApi.create(body);
      setShowInstallForm(false);
      setInstallForm({ ...EMPTY_INSTALL });
      const r = await cApi.installations(selected._id);
      setCustomerInstalls(r.data.installations);
    } catch (e: any) {
      setInstallError(e.response?.data?.message || 'Error saving installation');
    } finally { setSavingInstall(false); }
  };

  // ── Customer form fields (shared between create & edit modal) ─────────────
  const CustomerFormFields = () => (
    <div className="space-y-4">
      {formError && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/40 px-3 py-2 rounded-lg">{formError}</p>
      )}
      <div>
        <label className="form-label">Full Name *</label>
        <input className="form-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" />
      </div>
      <div>
        <label className="form-label">Phone</label>
        <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxx" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Region *</label>
          <input className="form-input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. Amhara" />
        </div>
        <div>
          <label className="form-label">Zone</label>
          <input className="form-input" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="e.g. Debub Wolo" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Woreda</label>
          <input className="form-input" value={form.woreda} onChange={(e) => setForm({ ...form, woreda: e.target.value })} placeholder="e.g. Qalu" />
        </div>
        <div>
          <label className="form-label">Specific Location</label>
          <input className="form-input" value={form.specificLocation} onChange={(e) => setForm({ ...form, specificLocation: e.target.value })} placeholder="e.g. 2km from market" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Latitude</label>
          <input className="form-input" type="number" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="Optional" />
        </div>
        <div>
          <label className="form-label">Longitude</label>
          <input className="form-input" type="number" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="Optional" />
        </div>
      </div>
      <div>
        <label className="form-label">Notes</label>
        <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes…" />
      </div>
    </div>
  );

  // ── Inline installation form ───────────────────────────────────────────────
  const InstallFormInline = () => (
    <div className="border border-surface-border rounded-xl p-4 mt-3 space-y-4 bg-surface">
      <h4 className="text-sm font-semibold text-white">New Installation</h4>
      {installError && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/40 px-3 py-2 rounded-lg">{installError}</p>
      )}
      <div>
        <label className="form-label">Project Title</label>
        <input className="form-input" value={installForm.projectTitle} onChange={(e) => setInstallForm({ ...installForm, projectTitle: e.target.value })} placeholder="e.g. Solar Powered Submersible Pump + Sprinkler Kit" />
      </div>

      {/* Well Data */}
      <div>
        <p className="form-label mb-2">Well Data</p>
        <div className="grid grid-cols-2 gap-2">
          {[['diameter','Diameter (m)'],['depth','Depth (m)'],['waterLevel','Water Level (m)'],['casingSize','Casing Size']] .map(([k, lbl]) => (
            <div key={k}>
              <label className="form-label">{lbl}</label>
              <input className="form-input" value={installForm.wellData[k]}
                onChange={(e) => setInstallForm({ ...installForm, wellData: { ...installForm.wellData, [k]: e.target.value } })} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="form-label">Casing Type</label>
            <input className="form-input" value={installForm.wellData.casingType}
              onChange={(e) => setInstallForm({ ...installForm, wellData: { ...installForm.wellData, casingType: e.target.value } })} />
          </div>
        </div>
      </div>

      {/* Activities */}
      <div>
        <p className="form-label mb-2">Activities Performed</p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
          {ACTIVITIES.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-primary rounded"
                checked={installForm.activitiesPerformed[key]}
                onChange={(e) => setInstallForm({ ...installForm, activitiesPerformed: { ...installForm.activitiesPerformed, [key]: e.target.checked } })} />
              <span className="text-sm text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Delivered By</label>
          <input className="form-input" value={installForm.deliveredBy} onChange={(e) => setInstallForm({ ...installForm, deliveredBy: e.target.value })} />
        </div>
        <div>
          <label className="form-label">Received By</label>
          <input className="form-input" value={installForm.receivedBy} onChange={(e) => setInstallForm({ ...installForm, receivedBy: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Installation Date</label>
          <input className="form-input" type="date" value={installForm.installationDate} onChange={(e) => setInstallForm({ ...installForm, installationDate: e.target.value })} />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" value={installForm.status} onChange={(e) => setInstallForm({ ...installForm, status: e.target.value })}>
            {['Pending','In Progress','Completed','Cancelled'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="form-label">Remarks</label>
        <textarea className="form-input" rows={2} value={installForm.remarks} onChange={(e) => setInstallForm({ ...installForm, remarks: e.target.value })} />
      </div>
      <div className="flex gap-3">
        <button className="btn-ghost flex-1" onClick={() => { setShowInstallForm(false); setInstallForm({ ...EMPTY_INSTALL }); }}>Cancel</button>
        <button className="btn-primary flex-1" onClick={saveInstallation} disabled={savingInstall}>
          {savingInstall ? 'Saving…' : 'Create Installation'}
        </button>
      </div>
    </div>
  );

  // ── Customer detail panel content ─────────────────────────────────────────
  const CustomerPanel = () => (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-white truncate">{selected?.fullName}</h3>
          <p className="text-xs text-gray-500 truncate">
            {[selected?.region, selected?.zone, selected?.woreda].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button onClick={() => { setSelected(null); setPanelOpen(false); }} className="text-gray-500 hover:text-white ml-3 shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>

      {selected?.specificLocation && (
        <p className="text-xs text-gray-400 mb-3 flex items-start gap-1">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
          {selected.specificLocation}
        </p>
      )}

      {/* Add installation toggle button */}
      <button
        className="flex items-center justify-center gap-2 btn-primary w-full mb-4"
        onClick={() => { setShowInstallForm((v) => !v); setInstallForm({ ...EMPTY_INSTALL }); setInstallError(''); }}
      >
        <Wrench className="w-4 h-4" />
        {showInstallForm ? 'Cancel New Installation' : 'Add Installation'}
        {showInstallForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Inline installation form */}
      {showInstallForm && <InstallFormInline />}

      {/* Existing installations */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Installations ({customerInstalls.length})
        </p>
        {loadingInstalls ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customerInstalls.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-6">No installations yet</p>
        ) : (
          <div className="space-y-3">
            {customerInstalls.map((inst: any) => (
              <div key={inst._id} className="border border-surface-border rounded-lg p-3 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm text-white font-medium leading-snug">{inst.projectTitle || 'Untitled project'}</p>
                  <StatusBadge status={inst.status} />
                </div>
                {inst.installationDate && (
                  <p className="text-xs text-gray-500">{new Date(inst.installationDate).toLocaleDateString()}</p>
                )}
                {inst.deliveredBy && <p className="text-xs text-gray-500 mt-1">Delivered by: {inst.deliveredBy}</p>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(inst.activitiesPerformed || {}).filter(([, v]) => v).map(([k]) => (
                    <span key={k} className="text-[10px] bg-surface px-1.5 py-0.5 rounded text-gray-400 border border-surface-border">
                      {ACTIVITIES.find(([key]) => key === k)?.[1] || k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Customers</h1>
            <p className="text-sm text-gray-400">{total} total</p>
          </div>
          <button className="btn-primary flex items-center gap-2 shrink-0"
            onClick={() => { setForm({ ...EMPTY_CUSTOMER }); setFormError(''); setShowCreate(true); }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="form-input pl-9" placeholder="Search by name, phone, region…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Desktop: side-by-side; Mobile: stacked with slide-up panel */}
        <div className="flex gap-4">
          {/* Customer list */}
          <div className={`flex-1 min-w-0 space-y-2 ${selected ? 'hidden lg:block' : ''}`}>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : list.length === 0 ? (
              <div className="card text-center py-12 text-gray-500">No customers found</div>
            ) : list.map((c) => (
              <div
                key={c._id}
                onClick={() => selectCustomer(c)}
                className={`card cursor-pointer transition-all hover:border-primary/50 ${selected?._id === c._id ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">{c.fullName[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm">{c.fullName}</p>
                      {c.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{c.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {[c.region, c.zone, c.woreda].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                      className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selected?._id === c._id ? 'text-primary rotate-90' : 'text-gray-600'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop panel */}
          {selected && (
            <div className="hidden lg:block w-96 shrink-0">
              <div className="card sticky top-0 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <CustomerPanel />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile panel — full screen slide-up */}
      {panelOpen && selected && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/50" onClick={() => { setSelected(null); setPanelOpen(false); }} />
          <div className="bg-surface-card border-t border-surface-border rounded-t-2xl max-h-[85vh] overflow-y-auto p-5">
            <div className="w-10 h-1 bg-surface-border rounded-full mx-auto mb-4" />
            <CustomerPanel />
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreate && (
        <Modal title="Add Customer" onClose={() => setShowCreate(false)}>
          <CustomerFormFields />
          <div className="flex gap-3 mt-5">
            <button className="btn-ghost flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={saveCustomer} disabled={saving}>
              {saving ? 'Saving…' : 'Create Customer'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Customer Modal */}
      {editCustomer && (
        <Modal title="Edit Customer" onClose={() => setEditCustomer(null)}>
          <CustomerFormFields />
          <div className="flex gap-3 mt-5">
            <button className="btn-ghost flex-1" onClick={() => setEditCustomer(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={saveCustomer} disabled={saving}>
              {saving ? 'Saving…' : 'Update Customer'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete Customer" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-300 mb-5">
            Delete <span className="text-white font-semibold">{deleteTarget.fullName}</span> and all their installations? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger flex-1" onClick={handleDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
