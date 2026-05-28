const map: Record<string, string> = {
  'Pending':     'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
  'In Progress': 'bg-blue-900/40 text-blue-300 border border-blue-700/50',
  'Completed':   'bg-green-900/40 text-green-300 border border-green-700/50',
  'Cancelled':   'bg-red-900/40 text-red-300 border border-red-700/50',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-800 text-gray-300'}`}>
      {status}
    </span>
  );
}
