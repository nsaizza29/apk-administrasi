import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Inbox, Pencil, Plus, Trash2 } from 'lucide-react';
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
import type { KlasifikasiOption, Paginated, SharedProps, SuratMasukRow } from '@/types';

interface SuratMasukIndexProps {
    surat: Paginated<SuratMasukRow>;
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
    { key: 'diterima', label: 'Diterima' },
    { key: 'diproses', label: 'Diproses' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'diarsipkan', label: 'Diarsipkan' },
];

export default function SuratMasukIndex({ surat, filters, klasifikasi, statusCounts }: SuratMasukIndexProps) {
    const { auth } = usePage<SharedProps>().props;
    const isAdmin = auth.user?.role === 'admin';
    const [deleting, setDeleting] = useState<SuratMasukRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const hasFilter = Boolean(filters.q || filters.status || filters.klasifikasi_id || filters.sifat);

    function handleDelete() {
        if (!deleting) return;

        setProcessing(true);
        router.delete(`/surat-masuk/${deleting.id}`, {
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    }

    return (
        <AppShell title="Surat Masuk">
            <Head title="Surat Masuk" />

            <PageHeader
                title="Surat Masuk"
                description="Catat, telusuri, dan kelola surat yang masuk."
            >
                {isAdmin && (
                    <Button asChild>
                        <Link href="/surat-masuk/create">
                            <Plus />
                            Tambah Surat
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
                                applyFilter('/surat-masuk', { ...filters, status: tab.key === 'semua' ? '' : tab.key })
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
                    onSubmit={(value) => applyFilter('/surat-masuk', { ...filters, q: value })}
                    placeholder="Cari nomor, perihal, asal..."
                />
                <FilterSelect
                    value={filters.klasifikasi_id ?? ''}
                    onChange={(value) => applyFilter('/surat-masuk', { ...filters, klasifikasi_id: value })}
                    placeholder="Klasifikasi"
                    options={klasifikasi.map((item) => ({ value: String(item.id), label: `${item.kode} — ${item.nama}` }))}
                />
                <FilterSelect
                    value={filters.sifat ?? ''}
                    onChange={(value) => applyFilter('/surat-masuk', { ...filters, sifat: value })}
                    placeholder="Sifat"
                    options={[
                        { value: 'biasa', label: 'Biasa' },
                        { value: 'penting', label: 'Penting' },
                        { value: 'segera', label: 'Segera' },
                    ]}
                />
                {hasFilter && (
                    <Button variant="ghost" size="sm" onClick={() => router.get('/surat-masuk')}>
                        Reset Filter
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {surat.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Inbox}
                                title="Tidak ada surat masuk ditemukan"
                                description="Ubah filter pencarian atau catat surat masuk baru."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor Agenda</TableHead>
                                        <TableHead>Perihal</TableHead>
                                        <TableHead className="hidden md:table-cell">Asal</TableHead>
                                        <TableHead className="hidden lg:table-cell">Klasifikasi</TableHead>
                                        <TableHead className="hidden lg:table-cell">Diterima</TableHead>
                                        <TableHead>Sifat</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-10 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {surat.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <Link href={`/surat-masuk/${row.id}`} className="font-medium hover:underline">
                                                    {row.nomor_agenda}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="max-w-56">
                                                <p className="truncate">{row.perihal}</p>
                                            </TableCell>
                                            <TableCell className="hidden max-w-40 truncate md:table-cell">
                                                {row.asal}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{row.klasifikasi}</TableCell>
                                            <TableCell className="hidden whitespace-nowrap lg:table-cell">
                                                {row.tanggal_diterima}
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
                                                            <Link href={`/surat-masuk/${row.id}`}>
                                                                <Eye /> Lihat detail
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        {isAdmin && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/surat-masuk/${row.id}/edit`}>
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
                title="Hapus surat masuk?"
                description={`Surat "${deleting?.perihal}" beserta disposisinya akan dihapus permanen.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
