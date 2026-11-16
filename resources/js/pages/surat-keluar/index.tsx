import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Pencil, Plus, Printer, Send, Trash2 } from 'lucide-react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { applyFilter } from '@/lib/filter';
import type { KlasifikasiOption, Paginated, SharedProps, SuratKeluarRow } from '@/types';

interface SuratKeluarIndexProps {
    surat: Paginated<SuratKeluarRow>;
    filters: {
        q?: string;
        status?: string;
        klasifikasi_id?: string;
        sifat?: string;
    };
    klasifikasi: KlasifikasiOption[];
    statusCounts: Record<string, number>;
}

const statusTabs = [
    { key: 'semua', label: 'Semua' },
    { key: 'draft', label: 'Draft' },
    { key: 'dikirim', label: 'Dikirim' },
    { key: 'diterima', label: 'Diterima' },
    { key: 'diarsipkan', label: 'Diarsipkan' },
];

export default function SuratKeluarIndex({ surat, filters, klasifikasi, statusCounts }: SuratKeluarIndexProps) {
    const { auth } = usePage<SharedProps>().props;
    const isAdmin = auth.user?.role === 'admin';
    const [deleting, setDeleting] = useState<SuratKeluarRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const hasFilter = Boolean(filters.q || filters.status || filters.klasifikasi_id || filters.sifat);

    function handleDelete() {
        if (!deleting) return;

        setProcessing(true);
        router.delete(`/surat-keluar/${deleting.id}`, {
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    }

    return (
        <AppShell title="Surat Keluar">
            <Head title="Surat Keluar" />

            <PageHeader
                title="Surat Keluar"
                description={isAdmin ? 'Kelola surat yang dikirim keluar dari instansi.' : 'Pantau surat keluar yang telah dibuat dari pengajuan.'}
            >
                {isAdmin && (
                    <Button asChild>
                        <Link href="/surat-keluar/create">
                            <Plus />
                            Buat Surat
                        </Link>
                    </Button>
                )}
            </PageHeader>

            <div className="flex flex-wrap gap-2">
                {statusTabs.map((tab) => {
                    const active = (filters.status ?? 'semua') === tab.key || (!filters.status && tab.key === 'semua');

                    return (
                        <Button
                            key={tab.key}
                            variant={active ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() =>
                                applyFilter('/surat-keluar', { ...filters, status: tab.key === 'semua' ? '' : tab.key })
                            }
                        >
                            {tab.label}
                            <span className="ml-1 text-muted-foreground">{statusCounts[tab.key] ?? 0}</span>
                        </Button>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                    value={filters.q ?? ''}
                    onSubmit={(value) => applyFilter('/surat-keluar', { ...filters, q: value })}
                    placeholder="Cari nomor, perihal, tujuan..."
                />
                <FilterSelect
                    value={filters.klasifikasi_id ?? ''}
                    onChange={(value) => applyFilter('/surat-keluar', { ...filters, klasifikasi_id: value })}
                    placeholder="Klasifikasi"
                    options={klasifikasi.map((item) => ({ value: String(item.id), label: `${item.kode} — ${item.nama}` }))}
                />
                <FilterSelect
                    value={filters.sifat ?? ''}
                    onChange={(value) => applyFilter('/surat-keluar', { ...filters, sifat: value })}
                    placeholder="Sifat"
                    options={[
                        { value: 'biasa', label: 'Biasa' },
                        { value: 'penting', label: 'Penting' },
                        { value: 'segera', label: 'Segera' },
                    ]}
                />
                {hasFilter && (
                    <Button variant="ghost" size="sm" onClick={() => router.get('/surat-keluar')}>
                        Reset Filter
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {surat.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Send}
                                title="Tidak ada surat keluar ditemukan"
                                description="Ubah filter pencarian atau buat surat keluar baru."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor Surat</TableHead>
                                        <TableHead>Perihal</TableHead>
                                        <TableHead className="hidden md:table-cell">Tujuan</TableHead>
                                        <TableHead className="hidden lg:table-cell">Klasifikasi</TableHead>
                                        <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                                        <TableHead>Sifat</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-10 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {surat.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <Link href={`/surat-keluar/${row.id}`} className="font-medium hover:underline">
                                                    {row.nomor_surat}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="max-w-56">
                                                <p className="truncate">{row.perihal}</p>
                                            </TableCell>
                                            <TableCell className="hidden max-w-40 truncate md:table-cell">
                                                {row.tujuan}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{row.klasifikasi}</TableCell>
                                            <TableCell className="hidden whitespace-nowrap lg:table-cell">
                                                {row.tanggal_surat}
                                            </TableCell>
                                            <TableCell>
                                                <SifatBadge sifat={row.sifat} />
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={row.status} label={row.status_label} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon-sm" aria-label="Aksi">
                                                            <Eye className="opacity-60" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/surat-keluar/${row.id}`}>
                                                                <Eye /> Lihat detail
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <a href={`/surat-keluar/${row.id}/cetak`} target="_blank" rel="noreferrer">
                                                                <Printer /> Cetak surat
                                                            </a>
                                                        </DropdownMenuItem>
                                                        {isAdmin && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/surat-keluar/${row.id}/edit`}>
                                                                    <Pencil /> Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {isAdmin && (
                                                            <DropdownMenuItem
                                                                onClick={() => setDeleting(row)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 /> Hapus
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <PaginationLinks meta={surat} />

            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Hapus surat keluar?"
                description={`Surat "${deleting?.perihal}" akan dihapus permanen.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
