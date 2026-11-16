import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
    diterima: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    diproses: 'border-blue-200 bg-blue-50 text-blue-700',
    selesai: 'border-teal-200 bg-teal-50 text-teal-700',
    diarsipkan: 'border-zinc-200 bg-zinc-100 text-zinc-600',
    draft: 'border-amber-200 bg-amber-50 text-amber-700',
    dikirim: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    diajukan: 'border-sky-200 bg-sky-50 text-sky-700',
    menunggu_pemeriksaan: 'border-violet-200 bg-violet-50 text-violet-700',
    revisi: 'border-orange-200 bg-orange-50 text-orange-700',
    disetujui: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    ditolak: 'border-red-200 bg-red-50 text-red-700',
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
    return (
        <Badge variant="outline" className={cn('font-medium', statusStyles[status])}>
            {label ?? status}
        </Badge>
    );
}

const sifatStyles: Record<string, string> = {
    biasa: 'border-border bg-muted text-muted-foreground',
    penting: 'border-amber-300 bg-amber-100 text-amber-800',
    segera: 'border-red-300 bg-red-100 text-red-700',
};

export function SifatBadge({ sifat }: { sifat: string }) {
    return (
        <Badge variant="outline" className={cn('capitalize', sifatStyles[sifat])}>
            {sifat}
        </Badge>
    );
}
