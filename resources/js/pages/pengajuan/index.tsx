import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardCheck, Eye, FilePlus2, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
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
import type { Paginated, PengajuanRow } from '@/types';

interface PengajuanIndexProps {
    pengajuan: Paginated<PengajuanRow>;
    filters: {
        q?: string;
        tab?: string;
    };
    tabs: string[];
    tabLabels: Record<string, string>;
    tab: string;
    tabCounts: Record<string, number>;
    role: 'admin' | 'pimpinan' | 'staf';
}

const descriptions: Record<string, string> = {
    staf: 'Ajukan kebutuhan dokumen Anda dan pantau proses pembuatannya.',
    pimpinan: 'Periksa dokumen yang diajukan serta kelola pengajuan Anda sendiri.',
    admin: 'Proses pengajuan dokumen menjadi surat resmi yang siap diperiksa pimpinan.',
};

export default function PengajuanIndex({ pengajuan, filters, tabs, tabLabels, tab, tabCounts, role }: PengajuanIndexProps) {
    const [deleting, setDeleting] = useState<PengajuanRow | null>(null);
    const [processing, setProcessing] = useState(false);

    function handleDelete() {
        if (!deleting) return;

        setProcessing(true);
        router.delete(`/pengajuan/${deleting.id}`, {
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    }

    return (
        <AppShell title="Pengajuan Dokumen">
            <Head title="Pengajuan Dokumen" />

            <PageHeader title="Pengajuan Dokumen" description={descriptions[role]}>
                <Button asChild>
                    <Link href="/pengajuan/create">
                        <Plus />
                        Ajukan Dokumen
                    </Link>
                </Button>
            </PageHeader>

            <div className="flex flex-wrap gap-2">
                {tabs.map((item) => (
                    <Button
                        key={item}
                        variant={tab === item ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => applyFilter('/pengajuan', { ...filters, tab: item })}
                    >
                        {tabLabels[item] ?? item}
                        <span className="ml-1 text-muted-foreground">{tabCounts[item] ?? 0}</span>
                    </Button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                    value={filters.q ?? ''}
                    onSubmit={(value) => applyFilter('/pengajuan', { ...filters, q: value, tab })}
                    placeholder="Cari nomor, perihal, tujuan, pengaju..."
                />
                {filters.q && (
                    <Button variant="ghost" size="sm" onClick={() => router.get('/pengajuan', { tab })}>
                        Reset Pencarian
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {pengajuan.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={FilePlus2}
                                title="Belum ada pengajuan dokumen"
                                description="Pengajuan yang masuk akan tampil di sini."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor Pengajuan</TableHead>
                                        <TableHead>Perihal</TableHead>
                                        <TableHead className="hidden md:table-cell">Pengaju</TableHead>
                                        <TableHead className="hidden lg:table-cell">Tujuan</TableHead>
                                        <TableHead className="hidden lg:table-cell">Klasifikasi</TableHead>
                                        <TableHead>Sifat</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden xl:table-cell">Tanggal</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pengajuan.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <Link href={`/pengajuan/${row.id}`} className="font-medium hover:underline">
                                                    {row.nomor_pengajuan}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="max-w-56">
                                                <p className="truncate">{row.perihal}</p>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{row.pengaju ?? '-'}</TableCell>
                                            <TableCell className="hidden max-w-40 truncate lg:table-cell">
                                                {row.tujuan}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">{row.klasifikasi ?? '-'}</TableCell>
                                            <TableCell>
                                                <SifatBadge sifat={row.sifat} />
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={row.status} label={row.status_label} />
                                            </TableCell>
                                            <TableCell className="hidden whitespace-nowrap xl:table-cell">
                                                {row.tanggal}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {row.can_review && (
                                                        <Button asChild size="sm" variant="outline">
                                                            <Link href={`/pengajuan/${row.id}`}>
                                                                <ClipboardCheck />
                                                                Periksa
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon-sm" aria-label="Aksi">
                                                                <Eye className="opacity-60" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/pengajuan/${row.id}`}>
                                                                    <Eye /> Lihat detail
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {row.can_edit && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/pengajuan/${row.id}/edit`}>
                                                                        <Pencil /> Edit
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            {row.can_delete && (
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeleting(row)}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 /> Hapus
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <PaginationLinks meta={pengajuan} />

            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Hapus pengajuan?"
                description={`Pengajuan "${deleting?.perihal}" akan dihapus permanen.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
