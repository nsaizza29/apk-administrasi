import { Head, Link, usePage } from '@inertiajs/react';
import { Archive, ClipboardList, FilePlus2, FileSignature, Inbox, Plus, Send } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { BarChart } from '@/components/bar-chart';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { SifatBadge, StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AuthUser, DisposisiRow, SharedProps, SuratKeluarRow, SuratMasukRow } from '@/types';

interface DashboardProps {
    stats: {
        surat_masuk: number;
        surat_keluar: number;
        masuk_bulan_ini: number;
        keluar_bulan_ini: number;
        disposisi_pending: number;
        disposisi_selesai: number;
        surat_diproses: number;
        surat_arsip: number;
        pengajuan_saya: number;
        pengajuan_perlu_tindakan: number;
    };
    chart: {
        labels: string[];
        masuk: number[];
        keluar: number[];
    };
    statusMasuk: Record<string, number>;
    disposisiSaya: (Omit<DisposisiRow, 'surat_masuk_id' | 'kepada' | 'dari' | 'catatan' | 'created_at'> & {
        dari: string;
        catatan: string;
    })[];
    recentSuratMasuk: SuratMasukRow[];
    recentSuratKeluar: SuratKeluarRow[];
    recentPengajuan: {
        id: number;
        nomor_pengajuan: string;
        perihal: string;
        tujuan: string;
        pengaju: string | null;
        status: string;
        status_label: string;
    }[];
    role: string;
}

const statusMeta = [
    { key: 'diterima', label: 'Diterima', color: 'bg-emerald-500' },
    { key: 'diproses', label: 'Diproses', color: 'bg-blue-500' },
    { key: 'selesai', label: 'Selesai', color: 'bg-teal-500' },
    { key: 'diarsipkan', label: 'Diarsipkan', color: 'bg-zinc-400' },
];

export default function Dashboard({
    stats,
    chart,
    statusMasuk,
    disposisiSaya,
    recentSuratMasuk,
    recentSuratKeluar,
    recentPengajuan,
    role,
}: DashboardProps) {
    const { auth } = usePage<SharedProps>().props;
    const user: AuthUser | null = auth.user;

    const statusTotal = Object.values(statusMasuk).reduce((total, value) => total + value, 0) || 1;
    const isAdmin = role === 'admin';
    const isPimpinan = role === 'pimpinan';

    const tindakanLabel =
        role === 'admin'
            ? 'Pengajuan menunggu dibuat/diproses'
            : role === 'pimpinan'
              ? 'Dokumen menunggu pemeriksaan Anda'
              : 'Pengajuan Anda yang perlu revisi';

    return (
        <AppShell title="Dashboard">
            <Head title="Dashboard" />

            <PageHeader
                title="Dashboard"
                description={`Selamat datang${user ? `, ${user.name}` : ''} — ringkasan aktivitas surat menyurat.`}
            >
                {isAdmin && (
                    <Button asChild variant="outline">
                        <Link href="/surat-masuk/create">
                            <Plus />
                            Catat Surat Masuk
                        </Link>
                    </Button>
                )}
                {isAdmin && (
                    <Button asChild variant="outline">
                        <Link href="/surat-keluar/create">
                            <Send />
                            Buat Surat Keluar
                        </Link>
                    </Button>
                )}
                {isPimpinan && (
                    <Button asChild variant="outline">
                        <Link href="/pengajuan?tab=periksa">
                            <ClipboardList />
                            Periksa Pengajuan
                        </Link>
                    </Button>
                )}
                <Button asChild>
                    <Link href="/pengajuan/create">
                        <FilePlus2 />
                        Ajukan Dokumen
                    </Link>
                </Button>
            </PageHeader>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                    title="Pengajuan Aktif Saya"
                    value={stats.pengajuan_saya}
                    icon={FilePlus2}
                    description="Pengajuan yang masih berjalan"
                />
                <StatCard
                    title="Perlu Tindakan"
                    value={stats.pengajuan_perlu_tindakan}
                    icon={ClipboardList}
                    description={tindakanLabel}
                />
                <StatCard
                    title="Surat Masuk"
                    value={stats.surat_masuk}
                    icon={Inbox}
                    description={`${stats.masuk_bulan_ini} dicatat bulan ini`}
                />
                <StatCard
                    title="Surat Keluar"
                    value={stats.surat_keluar}
                    icon={Send}
                    description={`${stats.keluar_bulan_ini} dibuat bulan ini`}
                />
                <StatCard
                    title="Disposisi Menunggu"
                    value={stats.disposisi_pending}
                    icon={FileSignature}
                    description={`${stats.disposisi_selesai} sudah diselesaikan`}
                />
                <StatCard
                    title="Surat Diarsip"
                    value={stats.surat_arsip}
                    icon={Archive}
                    description={`${stats.surat_diproses} surat sedang diproses`}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Grafik Surat 6 Bulan Terakhir</CardTitle>
                        <CardDescription>Perbandingan surat masuk dan surat keluar per bulan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BarChart
                            labels={chart.labels}
                            series={[
                                { name: 'Surat Masuk', color: 'var(--chart-1)', data: chart.masuk },
                                { name: 'Surat Keluar', color: 'var(--chart-2)', data: chart.keluar },
                            ]}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status Surat Masuk</CardTitle>
                        <CardDescription>Distribusi status seluruh surat masuk.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {statusMeta.map((item) => {
                            const value = statusMasuk[item.key] ?? 0;
                            const percent = Math.round((value / statusTotal) * 100);

                            return (
                                <div key={item.key} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <span className={`size-2.5 rounded-sm ${item.color}`} />
                                            {item.label}
                                        </span>
                                        <span className="font-medium">
                                            {value}{' '}
                                            <span className="font-normal text-muted-foreground">({percent}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={`h-full rounded-full ${item.color}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            {disposisiSaya.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Disposisi Saya</CardTitle>
                            <CardDescription>Disposisi yang perlu Anda tindaklanjuti.</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/disposisi">Lihat Semua</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {disposisiSaya.map((item) => (
                            <div
                                key={item.id}
                                className="space-y-2 rounded-lg border p-3.5"
                                aria-label={`Disposisi ${item.perihal}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 space-y-0.5">
                                        <p className="truncate text-sm font-medium">{item.perihal}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.nomor_agenda} · dari {item.dari}
                                        </p>
                                    </div>
                                    <SifatBadge sifat={item.sifat} />
                                </div>
                                <p className="line-clamp-2 text-xs text-muted-foreground">“{item.catatan}”</p>
                                <div className="flex items-center justify-between gap-2">
                                    <StatusBadge status={item.status} label={item.status_label} />
                                    <span
                                        className={`text-xs ${item.terlambat ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
                                    >
                                        {item.terlambat ? 'Terlambat · ' : 'Batas: '}
                                        {item.batas_waktu ?? '-'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Pengajuan Dokumen Terbaru</CardTitle>
                        <CardDescription>
                            {isAdmin ? 'Pengajuan terakhir yang masuk.' : 'Pengajuan terbaru yang relevan untuk Anda.'}
                        </CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/pengajuan">Lihat Semua</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentPengajuan.length === 0 ? (
                        <EmptyState
                            icon={FilePlus2}
                            title="Belum ada pengajuan dokumen"
                            description="Ajukan dokumen baru untuk memulai alur pembuatan surat."
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Perihal</TableHead>
                                    <TableHead className="hidden sm:table-cell">Pengaju</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentPengajuan.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Link
                                                href={`/pengajuan/${item.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {item.perihal}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">
                                                {item.nomor_pengajuan} · {item.tujuan}
                                            </p>
                                        </TableCell>
                                        <TableCell className="hidden max-w-40 truncate sm:table-cell">
                                            {item.pengaju ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <StatusBadge status={item.status} label={item.status_label} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Surat Masuk Terbaru</CardTitle>
                            <CardDescription>5 surat masuk terakhir yang dicatat.</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/surat-masuk">Lihat Semua</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentSuratMasuk.length === 0 ? (
                            <EmptyState icon={Inbox} title="Belum ada surat masuk" />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Perihal</TableHead>
                                        <TableHead className="hidden sm:table-cell">Asal</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentSuratMasuk.map((surat) => (
                                        <TableRow key={surat.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/surat-masuk/${surat.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {surat.perihal}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">{surat.nomor_agenda}</p>
                                            </TableCell>
                                            <TableCell className="hidden max-w-40 truncate sm:table-cell">
                                                {surat.asal}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <StatusBadge status={surat.status} label={surat.status_label} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>Surat Keluar Terbaru</CardTitle>
                            <CardDescription>5 surat keluar terakhir yang dibuat.</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/surat-keluar">Lihat Semua</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentSuratKeluar.length === 0 ? (
                            <EmptyState icon={Send} title="Belum ada surat keluar" />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Perihal</TableHead>
                                        <TableHead className="hidden sm:table-cell">Tujuan</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentSuratKeluar.map((surat) => (
                                        <TableRow key={surat.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/surat-keluar/${surat.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {surat.perihal}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">{surat.nomor_surat}</p>
                                            </TableCell>
                                            <TableCell className="hidden max-w-40 truncate sm:table-cell">
                                                {surat.tujuan}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <StatusBadge status={surat.status} label={surat.status_label} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
