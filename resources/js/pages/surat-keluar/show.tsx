import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, Edit, Printer, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PageHeader } from '@/components/page-header';
import { SifatBadge, StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { SharedProps } from '@/types';

interface SuratKeluarDetail {
    id: number;
    nomor_surat: string;
    tanggal_surat: string;
    tempat_surat: string | null;
    tujuan: string;
    perihal: string;
    jumlah_lampiran: string | null;
    isi: string | null;
    template: string;
    template_label: string;
    sifat: string;
    status: string;
    status_label: string;
    is_archived: boolean;
    penandatangan_nama: string | null;
    penandatangan_jabatan: string | null;
    tembusan: string | null;
    lampiran: { url: string; nama: string } | null;
    klasifikasi: { id: number; kode: string; nama: string } | null;
    dicatat_oleh: string;
    created_at: string;
    pengajuan: {
        id: number;
        nomor_pengajuan: string;
        pengaju: string | null;
    } | null;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 text-sm">
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <span className="text-right font-medium break-words">{children}</span>
        </div>
    );
}

export default function SuratKeluarShow({ surat }: { surat: SuratKeluarDetail }) {
    const { auth } = usePage<SharedProps>().props;
    const isAdmin = auth.user?.role === 'admin';
    const [showDelete, setShowDelete] = useState(false);
    const [processing, setProcessing] = useState(false);

    function handleDelete() {
        setProcessing(true);
        router.delete(`/surat-keluar/${surat.id}`, {
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AppShell title="Detail Surat Keluar">
            <Head title={`Surat ${surat.nomor_surat}`} />

            <PageHeader title={surat.perihal} description={`Nomor ${surat.nomor_surat} · ${surat.tujuan}`}>
                <Button asChild variant="outline" size="sm">
                    <Link href="/surat-keluar">
                        <ArrowLeft />
                        Kembali
                    </Link>
                </Button>
                <Button asChild size="sm">
                    <a href={`/surat-keluar/${surat.id}/cetak`} target="_blank" rel="noreferrer">
                        <Printer />
                        Cetak Surat
                    </a>
                </Button>
                {isAdmin && (
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/surat-keluar/${surat.id}/edit`}>
                            <Edit />
                            Edit
                        </Link>
                    </Button>
                )}
                {isAdmin && (
                    <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                        <Trash2 />
                        Hapus
                    </Button>
                )}
            </PageHeader>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Surat</CardTitle>
                            <CardDescription>Informasi lengkap surat keluar.</CardDescription>
                        </CardHeader>
                        <CardContent className="divide-y">
                            <InfoRow label="Nomor Surat">{surat.nomor_surat}</InfoRow>
                            <InfoRow label="Tujuan">{surat.tujuan}</InfoRow>
                            <InfoRow label="Perihal">{surat.perihal}</InfoRow>
                            <InfoRow label="Tanggal Surat">{surat.tanggal_surat}</InfoRow>
                            <InfoRow label="Template">{surat.template_label}</InfoRow>
                            {surat.jumlah_lampiran && <InfoRow label="Jumlah Lampiran">{surat.jumlah_lampiran}</InfoRow>}
                            <InfoRow label="Klasifikasi">
                                {surat.klasifikasi ? `${surat.klasifikasi.kode} — ${surat.klasifikasi.nama}` : '-'}
                            </InfoRow>
                            {surat.pengajuan && (
                                <InfoRow label="Dari pengajuan">
                                    <Link
                                        href={`/pengajuan/${surat.pengajuan.id}`}
                                        className="underline underline-offset-2"
                                    >
                                        {surat.pengajuan.nomor_pengajuan}
                                    </Link>
                                    {surat.pengajuan.pengaju ? ` · ${surat.pengajuan.pengaju}` : ''}
                                </InfoRow>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Isi Surat</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {surat.isi ? (
                                <div
                                    className="text-sm leading-relaxed [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                                    dangerouslySetInnerHTML={{ __html: surat.isi }}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">Tidak ada isi/ ringkasan surat.</p>
                            )}
                            {surat.tembusan && (
                                <div className="border-t pt-3">
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Tembusan
                                    </p>
                                    <p className="mt-1 text-sm whitespace-pre-wrap">{surat.tembusan}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Status surat</span>
                                <StatusBadge status={surat.status} label={surat.status_label} />
                            </div>
                            {surat.is_archived && (
                                <p className="text-xs text-muted-foreground">
                                    Surat ini otomatis masuk arsip setelah dikirim.
                                </p>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Sifat</span>
                                <SifatBadge sifat={surat.sifat} />
                            </div>
                            <Separator />
                            <InfoRow label="Dicatat oleh">{surat.dicatat_oleh}</InfoRow>
                            <InfoRow label="Dicatat pada">{surat.created_at}</InfoRow>
                            <InfoRow label="Penandatangan">
                                {surat.penandatangan_nama ?? '-'}
                                {surat.penandatangan_jabatan ? ` · ${surat.penandatangan_jabatan}` : ''}
                            </InfoRow>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Lampiran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {surat.lampiran ? (
                                <Button asChild variant="outline" className="w-full">
                                    <a href={surat.lampiran.url} target="_blank" rel="noreferrer">
                                        <Download />
                                        {surat.lampiran.nama}
                                    </a>
                                </Button>
                            ) : (
                                <p className="text-sm text-muted-foreground">Tidak ada lampiran.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                title="Hapus surat keluar?"
                description={`Surat "${surat.perihal}" akan dihapus permanen.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
