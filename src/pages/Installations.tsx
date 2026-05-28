import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { installations as iApi } from '../lib/api';
import { Search, Pencil, Trash2 } from 'lucide-react';

const STATUSES = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];
const ACT_LABELS: Record<string, string> = {
  casing: 'Casing', solarPump: 'Solar Pump', testing: 'Testing',
  solarPanelStructure: 'Solar Panel Structure', sprinkler: 'Sprinkler', practicalTraining: 'Practical Training',
};

export default function Installations() {
  const [list, setList]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState('All');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem]       = useState<any>(null);
  const [deleteItem, setDeleteItem]   = useState<any>(null);
  const [saving, setSaving]           = useState(false);
  const [editForm, setEditForm]       = useState<any>({});

  const load = async () => {
    setLoading(true);
    const params: any = { limit: 100 };
    if (filter !== 'All') params.status = filter;
    const r = await iApi.list(params);
    const items = r.data.installations;
    const filtered = search
      ? items.filter((i: any) =>
          i.projectTitle?.toLowerCase().includes(search.toLowerCase()) ||
          i.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          i.siteName?.toLowerCase().includes(search.toLowerCase()) ||
          i.endUserName?.toLowerCase().includes(search.toLowerCase()))
      : items;
    setList(filtered);
    setTotal(filtered.length);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, search]);

  const openEdit = (i: any) => {
    setEditForm({
      projectTitle:    i.projectTitle    || '',
      projectCategory: i.projectCategory || '',
      siteName:        i.siteName        || '',
      geoLocation:     i.geoLocation     || '',
      endUserName:     i.endUserName     || '',
      endUserPhone:    i.endUserPhone    || '',
      status:          i.status,
      deliveredBy:     i.deliveredBy     || '',
      receivedBy:      i.receivedBy      || '',
      installationDate: i.installationDate ? i.installationDate.slice(0, 10) : '',
      remarks:         i.remarks         || '',
      pumpData: {
        type:         i.pumpData?.type         || '',
        serialNumber: i.pumpData?.serialNumber || '',
        brand:        i.pumpData?.brand        || '',
        model:        i.pumpData?.model        || '',
        power:        i.pumpData?.power        || '',
        maxDischarge: i.pumpData?.maxDischarge || '',
        maxHead:      i.pumpData?.maxHead      || '',
        controller:   i.pumpData?.controller   || '',
        solarPanel:   i.pumpData?.solarPanel   || '',
      },
      packageItems: {
        pipe:               i.packageItems?.pipe               || '',
        acCables:           i.packageItems?.acCables           || '',
        dcCables:           i.packageItems?.dcCables           || '',
        accessories:        i.packageItems?.accessories        || '',
        pvMountedStructure: i.packageItems?.pvMountedStructure || '',
        fence:              i.packageItems?.fence              || '',
      },
      installationTeam: i.installationTeam?.length
        ? [...i.installationTeam, '', ''].slice(0, 3)
        : ['', '', ''],
    });
    setEditItem(i);
  };

  const ef = (key: string, val: any) => setEditForm((f: any) => ({ ...f, [key]: val }));
  const efPump = (k: string, v: string) => setEditForm((f: any) => ({ ...f, pumpData: { ...f.pumpData, [k]: v } }));
  const efPkg  = (k: string, v: string) => setEditForm((f: any) => ({ ...f, packageItems: { ...f.packageItems, [k]: v } }));
  const efTeam = (idx: number, v: string) => setEditForm((f: any) => {
    const t = [...f.installationTeam]; t[idx] = v; return { ...f, installationTeam: t };
  });

  const saveEdit = async () => {
    setSaving(true);
    const body = {
      ...editForm,
      installationTeam: editForm.installationTeam.filter((t: string) => t.trim() !== ''),
    };
    await iApi.update(editItem._id, body);
    setEditItem(null); setSaving(false); load();
  };

  const confirmDelete = async () => {
    await iApi.delete(deleteItem._id);
    setDeleteItem(null); load();
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Installations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} records</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input className="form-input pl-9" placeholder="Search by project, customer, site, end user…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-primary text-black' : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="card text-center py-16 text-gray-500">No installations found</div>
        ) : (
          <div className="space-y-2">
            {list.map((inst) => (
              <div key={inst._id} className="card hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white text-sm">{inst.projectTitle || 'Untitled project'}</p>
                      <StatusBadge status={inst.status} />
                    </div>
                    {inst.projectCategory && <p className="text-xs text-primary">{inst.projectCategory}</p>}
                    <p className="text-xs text-gray-400">{inst.customer?.fullName} · {inst.customer?.region}{inst.customer?.woreda ? `, ${inst.customer.woreda}` : ''}</p>
                    {inst.siteName && <p className="text-xs text-gray-500">Site: {inst.siteName}</p>}
                    {inst.endUserName && <p className="text-xs text-gray-500">End user: {inst.endUserName}{inst.endUserPhone ? ` · ${inst.endUserPhone}` : ''}</p>}
                    {inst.installationDate && (
                      <p className="text-xs text-gray-500">Date: {new Date(inst.installationDate).toLocaleDateString()}</p>
                    )}
                    {inst.pumpData?.brand && (
                      <p className="text-xs text-gray-500">
                        Pump: {inst.pumpData.brand} {inst.pumpData.model}
                        {inst.pumpData.type ? ` · ${inst.pumpData.type}` : ''}
                        {inst.pumpData.power ? ` · ${inst.pumpData.power}` : ''}
                      </p>
                    )}
                    {inst.installationTeam?.length > 0 && (
                      <p className="text-xs text-gray-500">Team: {inst.installationTeam.join(', ')}</p>
                    )}
                    {(inst.deliveredBy || inst.receivedBy) && (
                      <p className="text-xs text-gray-500">
                        {inst.deliveredBy && `Delivered: ${inst.deliveredBy}`}
                        {inst.deliveredBy && inst.receivedBy && ' · '}
                        {inst.receivedBy && `Received: ${inst.receivedBy}`}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {Object.entries(inst.activitiesPerformed || {}).filter(([, v]) => v).map(([k]) => (
                        <span key={k} className="text-[10px] bg-surface px-1.5 py-0.5 rounded text-gray-400 border border-surface-border">{ACT_LABELS[k] || k}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(inst)} className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteItem(inst)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editItem && (
        <Modal title="Edit Installation" onClose={() => setEditItem(null)} wide>
          <div className="space-y-5">

            {/* Project */}
            <div className="space-y-3">
              <div>
                <label className="form-label">Project Title</label>
                <input className="form-input" value={editForm.projectTitle} onChange={(e) => ef('projectTitle', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Project Category</label>
                  <input className="form-input" value={editForm.projectCategory} onChange={(e) => ef('projectCategory', e.target.value)} placeholder="e.g. Solar water Pump" />
                </div>
                <div>
                  <label className="form-label">Site Name</label>
                  <input className="form-input" value={editForm.siteName} onChange={(e) => ef('siteName', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">Geo Location</label>
                <input className="form-input" value={editForm.geoLocation} onChange={(e) => ef('geoLocation', e.target.value)} placeholder="X:..., Y:..., Z:..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">End User Name</label>
                  <input className="form-input" value={editForm.endUserName} onChange={(e) => ef('endUserName', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">End User Phone</label>
                  <input className="form-input" value={editForm.endUserPhone} onChange={(e) => ef('endUserPhone', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Pump */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pump Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([['type','Pump Type'],['brand','Brand'],['model','Model'],['serialNumber','Serial Number'],['power','Pump Power'],['maxDischarge','Max Discharge'],['maxHead','Max Head'],['controller','Controller'],['solarPanel','Solar Panel']] as [string,string][]).map(([k, lbl]) => (
                  <div key={k}>
                    <label className="form-label">{lbl}</label>
                    <input className="form-input" value={editForm.pumpData[k]} onChange={(e) => efPump(k, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Package Items */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Package Items Delivered</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([['pipe','Pipe'],['acCables','AC Cables'],['dcCables','DC Cables'],['accessories','Accessories'],['pvMountedStructure','PV Mounted Structure'],['fence','Fence']] as [string,string][]).map(([k, lbl]) => (
                  <div key={k}>
                    <label className="form-label">{lbl}</label>
                    <input className="form-input" value={editForm.packageItems[k]} onChange={(e) => efPkg(k, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Installation Team */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Installation Team</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {editForm.installationTeam.map((name: string, idx: number) => (
                  <div key={idx}>
                    <label className="form-label">Technician {idx + 1}</label>
                    <input className="form-input" value={name} onChange={(e) => efTeam(idx, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Status & dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={editForm.status} onChange={(e) => ef('status', e.target.value)}>
                  {['Pending','In Progress','Completed','Cancelled'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Installation Date</label>
                <input className="form-input" type="date" value={editForm.installationDate} onChange={(e) => ef('installationDate', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Delivered By</label>
                <input className="form-input" value={editForm.deliveredBy} onChange={(e) => ef('deliveredBy', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Received By</label>
                <input className="form-input" value={editForm.receivedBy} onChange={(e) => ef('receivedBy', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Remarks</label>
              <textarea className="form-input" rows={3} value={editForm.remarks} onChange={(e) => ef('remarks', e.target.value)} />
            </div>

            <div className="flex gap-3 pt-1">
              <button className="btn-ghost flex-1" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteItem && (
        <Modal title="Delete Installation" onClose={() => setDeleteItem(null)}>
          <p className="text-sm text-gray-300 mb-5">Delete <span className="text-white font-semibold">{deleteItem.projectTitle || 'this installation'}</span>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setDeleteItem(null)}>Cancel</button>
            <button className="btn-danger flex-1" onClick={confirmDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
