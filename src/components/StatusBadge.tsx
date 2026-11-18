import { AlertCircle, CheckCircle2, Clock, HelpCircle } from 'lucide-react';
import { STATUS_LABELS } from '../data/initialData';
import type { MaintenanceStatus } from '../types/maintenance';

interface StatusBadgeProps {
  status: MaintenanceStatus;
}

const STYLES: Record<MaintenanceStatus, string> = {
  overdue: 'bg-red-50 text-red-700 border-red-200',
  soon: 'bg-amber-50 text-amber-800 border-amber-200',
  safe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unknown: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const Icon =
    status === 'overdue'
      ? AlertCircle
      : status === 'soon'
        ? Clock
        : status === 'safe'
          ? CheckCircle2
          : HelpCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold whitespace-nowrap shrink-0 ${STYLES[status]}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
}
