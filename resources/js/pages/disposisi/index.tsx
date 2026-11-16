import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, FileSignature, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FilterSelect } from '@/components/filter-select';
import { PageHeader } from '@/components/page-header';
import { PaginationLinks } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { SifatBadge, StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { applyFilter } from '@/lib/filter';
import { cn } from '@/lib/utils';
import type { DisposisiRow, Paginated, SharedProps } from '@/types';

interface DisposisiIndexProps {
    disposisi: Paginated<DisposisiRow>;
    tabs: string[];
    tab: string;
    tabCounts: Record<string, number>;
    filters: {
        q?: string;
        status?: string;
    };
}

const tabLabels: Record<string, string> = {
    diterima: 'Diterima',
    diberikan: 'Diberikan',
    semua: 'Semua',
};

export default function DisposisiIndex({ disposisi, tabs, tab, tabCounts, filters }: DisposisiIndexProps) {
    const { auth } = usePage<SharedProps>().props;
    const role = auth.user?.role;
    const isAdmin = role === 'admin';

    const [deleting, setDeleting] = useState<DisposisiRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const hasFilter = Boolean(filters.q || filters.status);

    function handleStatusChange(item: DisposisiRow, status: string) {
        router.patch(
            `/disposisi/${item.id}`,
            { status },
            { preserveScroll: true, preserveState: true },
        );
    }

    function handleDelete() {
        if (!deleting) return;

        setProcessing(true);
        router.delete(`/disposisi/${deleting.id}`, {
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    }

    return (
        <AppShell title="Disposisi">
            <Head title="Disposisi" />

            <PageHeader
                title="Disposisi Surat"
                description="Pantau disposisi yang Anda terima dan yang Anda berikan."
            >
                <Button asChild variant="outline" size="sm">
                    <Link href="/surat-masuk">Pilih Surat untuk Didisposisikan</Link>
                </Button>
            </PageHeader>

            <div className="flex flex-wrap gap-2">
                {tabs.map((item) => (
                    <Button
                        key={item}
                        variant={tab === item ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => applyFilter('/disposisi', { ...filters, tab: item })}
                    >
                        {tabLabels[item] ?? item}
                        <span className="ml-1 text-muted-foreground">{tabCounts[item] ?? 0}</span>
                    </Button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                    value={filters.q ?? ''}
                    onSubmit={(value) => applyFilter('/disposisi', { ...filters, q: value })}
                    placeholder="Cari perihal atau nomor agenda..."
                />
                <FilterSelect
                    value={filters.status ?? ''}
                    onChange={(value) => applyFilter('/disposisi', { ...filters, status: value })}
                    placeholder="Status"
                    options={[
                        { value: 'pending', label: 'Menunggu' },
                        { value: 'diproses', label: 'Diproses' },
                        { value: 'selesai', label: 'Selesai' },
                    ]}
                />
                {hasFilter && (
                    <Button variant="ghost" size="sm" onClick={() => router.get('/disposisi', { tab })}>
                        Reset Filter
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {disposisi.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={FileSignature}
                                title="Tidak ada disposisi ditemukan"
                                description="Disposisi yang diberikan kepada Anda akan muncul di sini."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Surat</TableHead>
                                        <TableHead className="hidden md:table-cell">
                                            {tab === 'diterima' ? 'Dari' : tab === 'diberikan' ? 'Kepada' : 'Alur'}
                                        </TableHead>
                                        <TableHead>Catatan</TableHead>
                                        <TableHead className="hidden lg:table-cell">Batas Waktu</TableHead>
                                        <TableHead>Sifat</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-10 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {disposisi.data.map((item) => {
                                        const canUpdateStatus = item.status !== 'selesai' && (tab === 'diterima' || isAdmin);
                                        const canDelete = tab === 'diberikan' || isAdmin;

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Link
                                                        href={`/surat-masuk/${item.surat_masuk_id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {item.perihal}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.nomor_agenda}
                                                        {item.klasifikasi ? ` · ${item.klasifikasi}` : ''}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <span className="text-sm">
                                                        {item.dari} → {item.kepada}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-64">
                                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                                        {item.catatan}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="hidden whitespace-nowrap lg:table-cell">
                                                    <span
                                                        className={cn(
                                                            'text-sm',
                                                            item.terlambat ? 'font-medium text-destructive' : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {item.batas_waktu ?? '-'}
                                                        {item.terlambat && ' (Terlambat)'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <SifatBadge sifat={item.sifat} />
                                                </TableCell>
                                                <TableCell>
                                                    {canUpdateStatus ? (
                                                        <Select
                                                            value={item.status}
                                                            onValueChange={(value) => handleStatusChange(item, value)}
                                                        >
                                                            <SelectTrigger className="h-7 w-[125px] text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Menunggu</SelectItem>
                                                                <SelectItem value="diproses">Diproses</SelectItem>
                                                                <SelectItem value="selesai">Selesai</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <StatusBadge status={item.status} label={item.status_label} />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button asChild variant="ghost" size="icon-sm" aria-label="Lihat surat">
                                                            <Link href={`/surat-masuk/${item.surat_masuk_id}`}>
                                                                <Eye className="opacity-60" />
                                                            </Link>
                                                        </Button>
                                                        {canDelete && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                aria-label="Hapus disposisi"
                                                                onClick={() => setDeleting(item)}
                                                            >
                                                                <Trash2 className="text-destructive opacity-60" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <PaginationLinks meta={disposisi} />

            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Hapus disposisi?"
                description={`Disposisi untuk surat "${deleting?.perihal}" akan dihapus permanen.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
