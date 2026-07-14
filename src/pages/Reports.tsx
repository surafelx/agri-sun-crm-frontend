import { useState } from 'react';
import Layout from '../components/Layout';
import { reports } from '../lib/api';
import { FileDown, FileSpreadsheet, Filter, BarChart3 } from 'lucide-react';

const TABS = [
  { key: 'customers', label: 'Customers' },
  { key: 'installations', label: 'Installations' },
  { key: 'wells', label: 'Well Summary' },
  { key: 'custom', label: 'Custom Report' },
] as const;

const STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

const CUSTOM_FIELDS: Record<string, { key: string; label: string }[]> = {
  customers: [
    { key: 'fullName', label: 'Full Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'region', label: 'Region' },
    { key: 'zone', label: 'Zone' },
    { key: 'woreda', label: 'Woreda' },
    { key: 'specificLocation', label: 'Specific Location' },
    { key: 'notes', label: 'Notes' },
    { key: 'createdAt', label: 'Created At' },
  ],
  installations: [
    { key: 'projectTitle', label: 'Project Title' },
    { key: 'projectCategory', label: 'Category' },
    { key: 'siteName', label: 'Site Name' },
    { key: 'status', label: 'Status' },
    { key: 'installationDate', label: 'Date' },
    { key: 'wellData.depth', label: 'Well Depth' },
    { key: 'wellData.diameter', label: 'Well Diameter' },
    { key: 'wellData.waterLevel', label: 'Water Level' },
    { key: 'wellData.casingSize', label: 'Casing Size' },
    { key: 'wellData.casingType', label: 'Casing Type' },
    { key: 'pumpData.brand', label: 'Pump Brand' },
    { key: 'pumpData.model', label: 'Pump Model' },
    { key: 'pumpData.power', label: 'Pump Power' },
    { key: 'pumpData.type', label: 'Pump Type' },
    { key: 'endUserName', label: 'End User' },
    { key: 'endUserPhone', label: 'End User Phone' },
    { key: 'deliveredBy', label: 'Delivered By' },
    { key: 'receivedBy', label: 'Received By' },
    { key: 'remarks', label: 'Remarks' },
  ],
  wells: [
    { key: 'wellData.depth', label: 'Depth (m)' },
    { key: 'wellData.diameter', label: 'Diameter (m)' },
    { key: 'wellData.waterLevel', label: 'Water Level (m)' },
    { key: 'wellData.casingSize', label: 'Casing Size' },
    { key: 'wellData.casingType', label: 'Casing Type' },
    { key: 'projectTitle', label: 'Project' },
    { key: 'status', label: 'Status' },
    { key: 'installationDate', label: 'Date' },
  ],
};

function downloadBlob(res: any, fallbackName: string) {
  const disposition = res.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";\n]+)"?/);
  const filename = match ? match[1] : fallbackName;
  const blob = new Blob([res.data], {
    type: res.headers?.['content-type'] || 'text/csv',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [tab, setTab] = useState<string>('customers');
  const [loading, setLoading] = useState(false);

  // Filters
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customFields, setCustomFields] = useState<string[]>([]);

  const handleExport = async (format: 'csv' | 'excel') => {
    setLoading(true);
    try {
      let res;
      if (tab === 'customers') {
        const params: any = { format };
        if (region) params.region = region;
        res = await reports.customers(params);
      } else if (tab === 'installations') {
        const params: any = { format };
        if (status) params.status = status;
        if (region) params.region = region;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        res = await reports.installations(params);
      } else if (tab === 'wells') {
        const params: any = { format };
        res = await reports.wellSummary(params);
      } else if (tab === 'custom') {
        const entity = customFields.some((f) => f.startsWith('wellData')) ? 'wells' : 'installations';
        const params: any = { entity, format };
        if (customFields.length > 0) params.fields = customFields.join(',');
        if (status) params.status = status;
        if (region) params.region = region;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        res = await reports.custom(params);
      }
      if (res) downloadBlob(res, `${tab}-report.${format === 'excel' ? 'xlsx' : 'csv'}`);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (key: string) => {
    setCustomFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Export data as CSV or Excel</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-primary text-black'
                  : 'bg-surface-card border border-surface-border text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters + Export */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-white">Filters & Export</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {(tab === 'customers' || tab === 'installations' || tab === 'custom') && (
              <div>
                <label className="form-label">Region</label>
                <input
                  className="form-input"
                  placeholder="e.g. Oromia"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
            )}
            {(tab === 'installations' || tab === 'custom') && (
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {(tab === 'installations' || tab === 'custom') && (
              <>
                <div>
                  <label className="form-label">Date From</label>
                  <input className="form-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Date To</label>
                  <input className="form-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </>
            )}
          </div>

          {/* Custom field picker */}
          {tab === 'custom' && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Fields</p>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_FIELDS.installations.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => toggleField(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      customFields.includes(f.key)
                        ? 'bg-primary text-black'
                        : 'bg-surface border border-surface-border text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                {customFields.length === 0 ? 'No fields selected — all fields will be included' : `${customFields.length} field(s) selected`}
              </p>
            </div>
          )}

          {/* Export buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('csv')}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              {loading ? 'Exporting…' : 'Download CSV'}
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={loading}
              className="btn-ghost flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {loading ? 'Exporting…' : 'Download Excel'}
            </button>
          </div>
        </div>

        {/* Quick summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Quick Export</h3>
            </div>
            <div className="space-y-2 text-xs text-gray-400">
              <p>• <span className="text-white">Customers</span> — name, phone, region, location details</p>
              <p>• <span className="text-white">Installations</span> — project, well data, pump info, status</p>
              <p>• <span className="text-white">Well Summary</span> — depth, diameter, water level, casing</p>
              <p>• <span className="text-white">Custom</span> — pick exactly the fields you need</p>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-white">Format Info</h3>
            </div>
            <div className="space-y-2 text-xs text-gray-400">
              <p>• <span className="text-white">CSV</span> — lightweight, opens in any spreadsheet app</p>
              <p>• <span className="text-white">Excel (.xlsx)</span> — styled header row, green branding, better for sharing</p>
              <p>• All exports include filtered data based on your selected filters</p>
              <p>• Timestamps are formatted as readable dates</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
