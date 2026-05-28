import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { installations as iApi } from '../lib/api';
import { Search, Pencil, Trash2 } from 'lucide-react';

const STATUSES = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];

export default function Installations() {
  const [list, setList]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState('All');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem]   = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving]   = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    const params: any = { limit: 100 };
    if (filter !== 'All') params.status = filter;
    const r = await iApi.list(params);
    const items = r.data.installations;
    const filtered = search
      ? items.filter((i: any) => i.projectTitle?.toLowerCase().includes(search.toLowerCase()) || i.customer?.fullName?.toLowerCase().includes(search.toLowerCase()))
      : items;
    setList(filtered);
    setTotal(filtered.length);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, search]);

  const openEdit = (i: any) => {
    setEditForm({
      projectTitle: i.projectTitle || '',
      status: i.status,
      deliveredBy: i.deliveredBy || '',
      receivedBy: i.receivedBy || '',
      installationDate: i.installationDate ? i.installationDate.slice(0, 10) : '',
      remarks: i.remarks || '',
    });
    setEditItem(i);
  };

  const saveEdit = async () => {
    setSaving(true);
    await iApi.update(editItem._id, editForm);
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
            <input className="form-input pl-9" placeholder="Search by project or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-white text-sm">{inst.projectTitle || 'Untitled project'}</p>
                      <StatusBadge status={inst.status} />
                    </div>
                    <p className="text-xs text-gray-400">{inst.customer?.fullName} · {inst.customer?.region}{inst.customer?.woreda ? `, ${inst.customer.woreda}` : ''}</p>
                    {inst.installationDate && (
                      <p className="text-xs text-gray-500 mt-1">Date: {new Date(inst.installationDate).toLocaleDateString()}</p>
                    )}
                    {(inst.deliveredBy || inst.receivedBy) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {inst.deliveredBy && `Delivered by: ${inst.deliveredBy}`}
                        {inst.deliveredBy && inst.receivedBy && ' · '}
                        {inst.receivedBy && `Received by: ${inst.receivedBy}`}
                      </p>
                    )}
                    {/* Activities */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(inst.activitiesPerformed || {}).filter(([, v]) => v).map(([k]) => {
                        const labels: Record<string, string> = { casing: 'Casing', solarPump: 'Solar Pump', testing: 'Testing', solarPanelStructure: 'Solar Panel Structure', sprinkler: 'Sprinkler', practicalTraining: 'Practical Training' };
                        return <span key={k} className="text-[10px] bg-surface px-1.5 py-0.5 rounded text-gray-400 border border-surface-border">{labels[k] || k}</span>;
                      })}
                    </div>
                    {inst.wellData?.depth && (
                      <p className="text-xs text-gray-600 mt-1">Well: {inst.wellData.depth}m depth{inst.wellData.diameter ? `, ${inst.wellData.diameter}m dia.` : ''}</p>
                    )}
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
        <Modal title="Edit Installation" onClose={() => setEditItem(null)}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Project Title</label>
              <input className="form-input" value={editForm.projectTitle} onChange={(e) => setEditForm({ ...editForm, projectTitle: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  {['Pending','In Progress','Completed','Cancelled'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Installation Date</label>
                <input className="form-input" type="date" value={editForm.installationDate} onChange={(e) => setEditForm({ ...editForm, installationDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Delivered By</label>
                <input className="form-input" value={editForm.deliveredBy} onChange={(e) => setEditForm({ ...editForm, deliveredBy: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Received By</label>
                <input className="form-input" value={editForm.receivedBy} onChange={(e) => setEditForm({ ...editForm, receivedBy: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="form-label">Remarks</label>
              <textarea className="form-input" rows={3} value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} />
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
