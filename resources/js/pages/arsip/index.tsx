import { Head, Link, router, usePage } from '@inertiajs/react';
import { Archive, ArchiveRestore, ClipboardList, Eye, Inbox, Send } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { EmptyState } from '@/components/empty-state';
import { FilterSelect } from '@/components/filter-select';
import { PageHeader } from '@/components/page-header';
import { PaginationLinks } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { applyFilter } from '@/lib/filter';
import type { KlasifikasiOption, Paginated, SharedProps } from '@/types';

interface ArsipRow {
    id: number;
    nomor: string;
    tanggal: string;
    perihal: string;
    pihak: string;
    klasifikasi: string | null;
    dicatat_oleh: string | null;
    detail_url: string;
}

interface ArsipIndexProps {
    arsip: Paginated<ArsipRow>;
    filters: {
        q?: string;
        jenis?: 'surat_masuk' | 'surat_keluar' | 'pengajuan';
        klasifikasi_id?: string;
    };
    klasifikasi: KlasifikasiOption[];
    jumlahArsip: {
        surat_masuk: number;
        surat_keluar: number;
        pengajuan: number;
    };
}

export default function ArsipIndex({ arsip, filters, klasifikasi, jumlahArsip }: ArsipIndexProps) {
    const { auth } = usePage<SharedProps>().props;
    const isAdmin = auth.user?.role === 'admin';
    const jenis = filters.jenis ?? 'surat_masuk';
    const hasFilter = Boolean(filters.q || filters.klasifikasi_id);

    function restore(row: ArsipRow) {
        router.patch(`/arsip/${jenis}/${row.id}`, {}, { preserveScroll: true });
    }

    return (
        <AppShell title="Arsip Surat">
            <Head title="Arsip Surat" />

            <PageHeader
                title="Arsip Surat"
                description="Surat masuk, surat keluar, dan pengajuan yang sudah selesai otomatis tersimpan di sini."
            />

            <div className="flex flex-wrap gap-2">
                <Button
                    variant={jenis === 'surat_masuk' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => applyFilter('/arsip', { ...filters, jenis: 'surat_masuk' })}
                >
                    <Inbox />
                    Surat Masuk
                    <span className="ml-1 text-muted-foreground">{jumlahArsip.surat_masuk}</span>
                </Button>
                <Button
                    variant={jenis === 'surat_keluar' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => applyFilter('/arsip', { ...filters, jenis: 'surat_keluar' })}
                >
                    <Send />
                    Surat Keluar
                    <span className="ml-1 text-muted-foreground">{jumlahArsip.surat_keluar}</span>
                </Button>
                <Button
                    variant={jenis === 'pengajuan' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => applyFilter('/arsip', { ...filters, jenis: 'pengajuan' })}
                >
                    <ClipboardList />
                    Pengajuan
                    <span className="ml-1 text-muted-foreground">{jumlahArsip.pengajuan}</span>
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                    value={filters.q ?? ''}
                    onSubmit={(value) => applyFilter('/arsip', { ...filters, q: value })}
                    placeholder="Cari nomor, perihal, pihak, pengaju..."
                />
                <FilterSelect
                    value={filters.klasifikasi_id ?? ''}
                    onChange={(value) => applyFilter('/arsip', { ...filters, klasifikasi_id: value })}
                    placeholder="Klasifikasi"
                    options={klasifikasi.map((item) => ({ value: String(item.id), label: `${item.kode} — ${item.nama}` }))}
                />
                {hasFilter && (
                    <Button variant="ghost" size="sm" onClick={() => router.get('/arsip', { jenis })}>
                        Reset Filter
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {arsip.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Archive}
                                title="Belum ada arsip"
                                description="Dokumen akan muncul di sini otomatis setelah prosesnya selesai."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor</TableHead>
                                        <TableHead>Perihal</TableHead>
                                        <TableHead className="hidden md:table-cell">
                                            {jenis === 'surat_masuk' ? 'Asal' : jenis === 'surat_keluar' ? 'Tujuan' : 'Tujuan'}
                                        </TableHead>
                                        <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                                        <TableHead className="hidden lg:table-cell">Klasifikasi</TableHead>
                                        <TableHead className="hidden xl:table-cell">
                                            {jenis === 'pengajuan' ? 'Pengaju' : 'Dicatat Oleh'}
                                        </TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {arsip.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">{row.nomor}</TableCell>
                                            <TableCell className="max-w-56">
                                                <p className="truncate">{row.perihal}</p>
                                            </TableCell>
                                            <TableCell className="hidden max-w-40 truncate md:table-cell">
                                                {row.pihak}
                                            </TableCell>
                                            <TableCell className="hidden whitespace-nowrap lg:table-cell">
                                                {row.tanggal}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">{row.klasifikasi}</TableCell>
                                            <TableCell className="hidden xl:table-cell">{row.dicatat_oleh}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button asChild variant="ghost" size="icon-sm" aria-label="Lihat surat">
                                                        <Link href={row.detail_url}>
                                                            <Eye className="opacity-60" />
                                                        </Link>
                                                    </Button>
                                                    {isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => restore(row)}
                                                            title="Aktifkan kembali surat ini"
                                                        >
                                                            <ArchiveRestore />
                                                            Aktifkan
                                                        </Button>
                                                    )}
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

            <PaginationLinks meta={arsip} />
        </AppShell>
    );
}
