import { useEffect, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, Edit, FileSignature, Loader2, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField, FormSelect } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { SifatBadge, StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/errors';
import type { Petugas, SharedProps } from '@/types';

interface SuratMasukDetail {
    id: number;
    nomor_agenda: string;
    tanggal_surat: string;
    tanggal_diterima: string;
    asal: string;
    perihal: string;
    isi: string | null;
    sifat: string;
    status: string;
    status_label: string;
    is_archived: boolean;
    lampiran: { url: string; nama: string } | null;
    klasifikasi: { id: number; kode: string; nama: string } | null;
    dicatat_oleh: string;
    created_at: string;
    disposisi: {
        id: number;
        dari: string;
        kepada: string;
        catatan: string;
        sifat: string;
        batas_waktu: string | null;
        status: string;
        status_label: string;
        created_at: string;
    }[];
}

interface SuratMasukShowProps {
    surat: SuratMasukDetail;
    petugas: Petugas[];
    canDisposisi: boolean;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 text-sm">
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <span className="text-right font-medium break-words">{children}</span>
        </div>
    );
}

function DisposisiDialog({
    suratMasukId,
    petugas,
    onOpenChange,
}: {
    suratMasukId: number;
    petugas: Petugas[];
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        surat_masuk_id: String(suratMasukId),
        kepada_user_id: '',
        catatan: '',
        sifat: 'biasa',
        batas_waktu: '',
    });

    useEffect(() => {
        if (wasSuccessful) {
            onOpenChange(false);
        }
    }, [wasSuccessful, onOpenChange]);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        post('/disposisi', {
            preserveScroll: true,
        });
    }

    return (
        <DialogContent>
            <form onSubmit={submit}>
                <DialogHeader>
                    <DialogTitle>Buat Disposisi</DialogTitle>
                    <DialogDescription>
                        Teruskan surat ini kepada pimpinan atau staf beserta catatan tindak lanjut.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <FormField label="Disposisikan Kepada" required error={errorMessage(errors.kepada_user_id)}>
                        <FormSelect
                            value={data.kepada_user_id}
                            onChange={(value) => setData('kepada_user_id', value)}
                            placeholder="Pilih petugas"
                            options={petugas.map((item) => ({
                                value: String(item.id),
                                label: `${item.name}${item.jabatan ? ` — ${item.jabatan}` : ''}`,
                            }))}
                        />
                    </FormField>

                    <FormField label="Catatan Disposisi" required error={errorMessage(errors.catatan)}>
                        <Textarea
                            rows={3}
                            value={data.catatan}
                            onChange={(event) => setData('catatan', event.target.value)}
                            placeholder="cth. Mohon segera ditindaklanjuti dan laporkan hasilnya."
                        />
                    </FormField>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Sifat" required error={errorMessage(errors.sifat)}>
                            <FormSelect
                                value={data.sifat}
                                onChange={(value) => setData('sifat', value)}
                                placeholder="Pilih sifat"
                                options={[
                                    { value: 'biasa', label: 'Biasa' },
                                    { value: 'penting', label: 'Penting' },
                                    { value: 'segera', label: 'Segera' },
                                ]}
                            />
                        </FormField>

                        <FormField label="Batas Waktu" htmlFor="batas_waktu" error={errorMessage(errors.batas_waktu)}>
                            <Input
                                id="batas_waktu"
                                type="date"
                                value={data.batas_waktu}
                                onChange={(event) => setData('batas_waktu', event.target.value)}
                            />
                        </FormField>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing && <Loader2 className="animate-spin" />}
                        Kirim Disposisi
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

export default function SuratMasukShow({ surat, petugas, canDisposisi }: SuratMasukShowProps) {
    const { auth } = usePage<SharedProps>().props;
    const isAdmin = auth.user?.role === 'admin';
    const [showDelete, setShowDelete] = useState(false);
    const [showDisposisi, setShowDisposisi] = useState(false);
    const [processing, setProcessing] = useState(false);

    function handleDelete() {
        setProcessing(true);
        router.delete(`/surat-masuk/${surat.id}`, {
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AppShell title="Detail Surat Masuk">
            <Head title={`Surat ${surat.nomor_agenda}`} />

            <PageHeader title={surat.perihal} description={`Nomor ${surat.nomor_agenda} · ${surat.asal}`}>
                <Button asChild variant="outline" size="sm">
                    <Link href="/surat-masuk">
                        <ArrowLeft />
                        Kembali
                    </Link>
                </Button>
                {isAdmin && (
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/surat-masuk/${surat.id}/edit`}>
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
                            <CardDescription>Informasi lengkap surat masuk.</CardDescription>
                        </CardHeader>
                        <CardContent className="divide-y">
                            <InfoRow label="Nomor Surat">{surat.nomor_agenda}</InfoRow>
                            <InfoRow label="Asal / Pengirim">{surat.asal}</InfoRow>
                            <InfoRow label="Perihal">{surat.perihal}</InfoRow>
                            <InfoRow label="Tanggal Surat">{surat.tanggal_surat}</InfoRow>
                            <InfoRow label="Tanggal Diterima">{surat.tanggal_diterima}</InfoRow>
                            <InfoRow label="Klasifikasi">
                                {surat.klasifikasi ? `${surat.klasifikasi.kode} — ${surat.klasifikasi.nama}` : '-'}
                            </InfoRow>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Isi Surat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {surat.isi ? (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{surat.isi}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Tidak ada isi/ ringkasan surat.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileSignature className="size-4" />
                                    Disposisi
                                </CardTitle>
                                <CardDescription>Riwayat disposisi surat ini.</CardDescription>
                            </div>
                            {canDisposisi && !surat.is_archived && (
                                <Button size="sm" onClick={() => setShowDisposisi(true)}>
                                    <Plus />
                                    Buat Disposisi
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {surat.disposisi.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Belum ada disposisi untuk surat ini.</p>
                            ) : (
                                surat.disposisi.map((item) => (
                                    <div key={item.id} className="rounded-lg border p-3.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-medium">
                                                {item.dari} → {item.kepada}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <SifatBadge sifat={item.sifat} />
                                                <StatusBadge status={item.status} label={item.status_label} />
                                            </div>
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">{item.catatan}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            <span>{item.created_at}</span>
                                            <span>Batas: {item.batas_waktu ?? '-'}</span>
                                        </div>
                                    </div>
                                ))
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
                                    Surat ini otomatis masuk arsip setelah berstatus Selesai.
                                </p>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Sifat</span>
                                <SifatBadge sifat={surat.sifat} />
                            </div>
                            <Separator />
                            <InfoRow label="Dicatat oleh">{surat.dicatat_oleh}</InfoRow>
                            <InfoRow label="Dicatat pada">{surat.created_at}</InfoRow>
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

            {showDisposisi && (
                <Dialog open onOpenChange={setShowDisposisi}>
                    <DisposisiDialog
                        key={String(showDisposisi)}
                        suratMasukId={surat.id}
                        petugas={petugas}
                        onOpenChange={setShowDisposisi}
                    />
                </Dialog>
            )}

            <ConfirmDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                title="Hapus surat masuk?"
                description={`Surat "${surat.perihal}" beserta seluruh disposisinya akan dihapus permanen.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
