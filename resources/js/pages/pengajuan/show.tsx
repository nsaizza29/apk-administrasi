import { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    Download,
    Edit,
    FileText,
    Loader2,
    Printer,
    Send,
    Trash2,
    XCircle,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField, FormSelect } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { SifatBadge, StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/errors';
import { buildTemplateBody, formatTanggalIndo, getTemplateFields, humanizeTemplateField, type SuratTemplate } from '@/lib/surat-templates';
import type { KlasifikasiOption, PengajuanDetail, PengajuanPermissions, Sifat } from '@/types';

interface PengajuanShowProps {
    pengajuan: PengajuanDetail;
    klasifikasi: KlasifikasiOption[];
    templates: SuratTemplate[];
    can: PengajuanPermissions;
    role: 'admin' | 'pimpinan' | 'staf';
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 text-sm">
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <span className="text-right font-medium break-words">{children}</span>
        </div>
    );
}

function ProcessDocumentDialog({
    pengajuan,
    klasifikasi,
    templates,
    onOpenChange,
}: {
    pengajuan: PengajuanDetail;
    klasifikasi: KlasifikasiOption[];
    templates: SuratTemplate[];
    onOpenChange: (open: boolean) => void;
}) {
    const defaultTemplate = templates[0]?.value ?? 'umum';

    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        tanggal_surat: new Date().toISOString().slice(0, 10),
        tempat_surat: '',
        tujuan: pengajuan.tujuan,
        perihal: pengajuan.perihal,
        jumlah_lampiran: '',
        template: defaultTemplate,
        details: {} as Record<string, string>,
        klasifikasi_id: String(pengajuan.klasifikasi?.id ?? ''),
        sifat: pengajuan.sifat,
        catatan_admin: '',
        penandatangan_nama: '',
        penandatangan_jabatan: '',
        tembusan: '',
        lampiran: null as File | null,
    });

    useEffect(() => {
        if (wasSuccessful) {
            onOpenChange(false);
        }
    }, [wasSuccessful, onOpenChange]);

    const selectedTemplate = templates.find((template) => template.value === data.template) ?? templates[0];
    const templateFields = getTemplateFields(selectedTemplate);
    const preview = buildTemplateBody(
        data.template,
        {
            perihal: data.perihal,
            tujuan: data.tujuan,
            tanggal: formatTanggalIndo(data.tanggal_surat),
            tempat: data.tempat_surat,
            ...data.details,
        },
        templates,
    );

    function applyTemplate(value: string) {
        setData('template', value);
    }

    function setDetail(key: string, value: string) {
        setData('details', { ...data.details, [key]: value });
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        post(`/pengajuan/${pengajuan.id}/dokumen`, { forceFormData: true });
    }

    return (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <form onSubmit={submit}>
                <DialogHeader>
                    <DialogTitle>Buat Dokumen Surat Keluar</DialogTitle>
                    <DialogDescription>
                        Lengkapi data surat. Nomor surat dibuat otomatis oleh sistem dan dokumen akan dikirim ke pimpinan
                        untuk diperiksa.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2 sm:grid-cols-2">
                    <FormField
                        label="Template Surat"
                        error={errorMessage(errors.template)}
                        hint="Isi surat mengikuti template. Field tambahan muncul otomatis sesuai placeholder di template."
                        className="space-y-1.5 sm:col-span-2"
                    >
                        <FormSelect
                            value={data.template}
                            onChange={applyTemplate}
                            placeholder="Pilih template"
                            options={templates.map((template) => ({
                                value: template.value,
                                label: template.label,
                            }))}
                        />
                    </FormField>

                    <FormField label="Tanggal Surat" htmlFor="tanggal_surat" required error={errorMessage(errors.tanggal_surat)}>
                        <Input
                            id="tanggal_surat"
                            type="date"
                            value={data.tanggal_surat}
                            onChange={(event) => setData('tanggal_surat', event.target.value)}
                        />
                    </FormField>

                    <FormField
                        label="Tempat Surat"
                        htmlFor="tempat_surat"
                        error={errorMessage(errors.tempat_surat)}
                        hint="Kosongkan untuk memakai kota dari pengaturan."
                    >
                        <Input
                            id="tempat_surat"
                            value={data.tempat_surat}
                            onChange={(event) => setData('tempat_surat', event.target.value)}
                            placeholder="cth. Bandung"
                        />
                    </FormField>

                    <FormField label="Tujuan" htmlFor="tujuan" required error={errorMessage(errors.tujuan)}>
                        <Input
                            id="tujuan"
                            value={data.tujuan}
                            onChange={(event) => setData('tujuan', event.target.value)}
                        />
                    </FormField>

                    <FormField label="Perihal" htmlFor="perihal" required error={errorMessage(errors.perihal)} className="space-y-1.5 sm:col-span-2">
                        <Input
                            id="perihal"
                            value={data.perihal}
                            onChange={(event) => setData('perihal', event.target.value)}
                        />
                    </FormField>

                    <FormField
                        label="Jumlah Lampiran"
                        htmlFor="jumlah_lampiran"
                        error={errorMessage(errors.jumlah_lampiran)}
                        hint="cth. 1 (satu) berkas"
                    >
                        <Input
                            id="jumlah_lampiran"
                            value={data.jumlah_lampiran}
                            onChange={(event) => setData('jumlah_lampiran', event.target.value)}
                            placeholder="1 (satu) berkas"
                        />
                    </FormField>

                    <FormField label="Klasifikasi" required error={errorMessage(errors.klasifikasi_id)}>
                        <FormSelect
                            value={data.klasifikasi_id}
                            onChange={(value) => setData('klasifikasi_id', value)}
                            placeholder="Pilih klasifikasi"
                            options={klasifikasi.map((item) => ({
                                value: String(item.id),
                                label: `${item.kode} — ${item.nama}`,
                            }))}
                        />
                    </FormField>

                    <FormField label="Sifat Surat" required error={errorMessage(errors.sifat)}>
                        <FormSelect
                            value={data.sifat}
                            onChange={(value) => setData('sifat', value as Sifat)}
                            placeholder="Pilih sifat"
                            options={[
                                { value: 'biasa', label: 'Biasa' },
                                { value: 'penting', label: 'Penting' },
                                { value: 'segera', label: 'Segera' },
                            ]}
                        />
                    </FormField>

                    {templateFields.map((key) => (
                        <FormField
                            key={key}
                            label={humanizeTemplateField(key)}
                            htmlFor={`detail_${key}`}
                            error={errorMessage(errors[`details.${key}`])}
                        >
                            <Input
                                id={`detail_${key}`}
                                value={data.details[key] ?? ''}
                                onChange={(event) => setDetail(key, event.target.value)}
                                placeholder={humanizeTemplateField(key)}
                            />
                        </FormField>
                    ))}

                    <FormField
                        label="Pratinjau Isi Surat"
                        hint="Isi surat dibuat otomatis dari template dan detail di atas."
                        className="space-y-1.5 sm:col-span-2"
                    >
                        <div className="min-h-40 rounded-lg border bg-muted/30 p-4 font-serif text-sm leading-relaxed [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6">
                            {preview ? (
                                <div dangerouslySetInnerHTML={{ __html: preview }} />
                            ) : (
                                'Pilih template untuk melihat pratinjau isi surat.'
                            )}
                        </div>
                    </FormField>

                    <FormField
                        label="Nama Penandatangan"
                        htmlFor="penandatangan_nama"
                        error={errorMessage(errors.penandatangan_nama)}
                        hint="Kosongkan untuk memakai pengaturan instansi."
                    >
                        <Input
                            id="penandatangan_nama"
                            value={data.penandatangan_nama}
                            onChange={(event) => setData('penandatangan_nama', event.target.value)}
                            placeholder="Nama lengkap"
                        />
                    </FormField>

                    <FormField
                        label="Jabatan Penandatangan"
                        htmlFor="penandatangan_jabatan"
                        error={errorMessage(errors.penandatangan_jabatan)}
                    >
                        <Input
                            id="penandatangan_jabatan"
                            value={data.penandatangan_jabatan}
                            onChange={(event) => setData('penandatangan_jabatan', event.target.value)}
                            placeholder="cth. Kepala Kantor"
                        />
                    </FormField>

                    <FormField
                        label="Tembusan"
                        htmlFor="tembusan"
                        error={errorMessage(errors.tembusan)}
                        hint="Satu penerima per baris (opsional)."
                        className="space-y-1.5 sm:col-span-2"
                    >
                        <Textarea
                            id="tembusan"
                            rows={3}
                            value={data.tembusan}
                            onChange={(event) => setData('tembusan', event.target.value)}
                            placeholder={'1. Arsip\n2. ...'}
                        />
                    </FormField>

                    <FormField label="Lampiran" htmlFor="admin_lampiran" error={errorMessage(errors.lampiran)} className="space-y-1.5 sm:col-span-2">
                        <Input
                            id="admin_lampiran"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            onChange={(event) => setData('lampiran', event.target.files?.[0] ?? null)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Kosongkan untuk memakai lampiran dari pengaju. Maks 5 MB.
                        </p>
                    </FormField>

                    <FormField label="Catatan Admin" htmlFor="catatan_admin" error={errorMessage(errors.catatan_admin)} className="space-y-1.5 sm:col-span-2">
                        <Textarea
                            id="catatan_admin"
                            rows={3}
                            value={data.catatan_admin}
                            onChange={(event) => setData('catatan_admin', event.target.value)}
                            placeholder="Catatan untuk pimpinan pemeriksa (opsional)"
                        />
                    </FormField>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing && <Loader2 className="animate-spin" />}
                        Buat & Kirim ke Pimpinan
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

export default function PengajuanShow({ pengajuan, klasifikasi, templates, can, role }: PengajuanShowProps) {
    const [showDelete, setShowDelete] = useState(false);
    const [showProcess, setShowProcess] = useState(false);
    const [showReview, setShowReview] = useState(can.review);
    const [catatanPemeriksa, setCatatanPemeriksa] = useState('');
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    function handleDelete() {
        setProcessing(true);
        router.delete(`/pengajuan/${pengajuan.id}`, {
            onFinish: () => setProcessing(false),
        });
    }

    function submitReview(keputusan: 'setujui' | 'revisi' | 'tolak') {
        if (keputusan !== 'setujui' && catatanPemeriksa.trim() === '') {
            setReviewError('Catatan pemeriksaan wajib diisi untuk revisi atau penolakan.');
            return;
        }

        setReviewError(null);
        setProcessing(true);
        router.post(
            `/pengajuan/${pengajuan.id}/periksa`,
            { keputusan, catatan_pemeriksa: catatanPemeriksa },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setShowReview(false);
                },
            },
        );
    }

    function handleFinalize() {
        setProcessing(true);
        router.post(
            `/pengajuan/${pengajuan.id}/selesai`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <AppShell title="Detail Pengajuan">
            <Head title={`Pengajuan ${pengajuan.nomor_pengajuan}`} />

            <PageHeader
                title={pengajuan.perihal}
                description={`${pengajuan.nomor_pengajuan} · Diajukan oleh ${pengajuan.pengaju.name}`}
            >
                <Button asChild variant="outline" size="sm">
                    <Link href="/pengajuan">
                        <ArrowLeft />
                        Kembali
                    </Link>
                </Button>
                {can.edit && (
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/pengajuan/${pengajuan.id}/edit`}>
                            <Edit />
                            Edit
                        </Link>
                    </Button>
                )}
                {can.delete && (
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
                            <CardTitle>Data Pengajuan</CardTitle>
                            <CardDescription>Informasi dokumen yang diajukan.</CardDescription>
                        </CardHeader>
                        <CardContent className="divide-y">
                            <InfoRow label="Nomor Pengajuan">{pengajuan.nomor_pengajuan}</InfoRow>
                            <InfoRow label="Tujuan / Penerima">{pengajuan.tujuan}</InfoRow>
                            <InfoRow label="Perihal">{pengajuan.perihal}</InfoRow>
                            <InfoRow label="Klasifikasi">
                                {pengajuan.klasifikasi
                                    ? `${pengajuan.klasifikasi.kode} — ${pengajuan.klasifikasi.nama}`
                                    : '-'}
                            </InfoRow>
                            <InfoRow label="Pengaju">
                                {pengajuan.pengaju.name}
                                {pengajuan.pengaju.jabatan ? ` · ${pengajuan.pengaju.jabatan}` : ''}
                            </InfoRow>
                            <InfoRow label="Diajukan pada">{pengajuan.diajukan_at ?? pengajuan.created_at}</InfoRow>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Isi / Ringkasan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pengajuan.isi ? (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{pengajuan.isi}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground">Tidak ada isi/ringkasan.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan Proses</CardTitle>
                            <CardDescription>Riwayat catatan dari pengaju, admin, dan pemeriksa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Catatan Pengaju
                                </p>
                                <p className="mt-1 text-sm">{pengajuan.catatan_pengaju || '—'}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Catatan Admin
                                </p>
                                <p className="mt-1 text-sm">{pengajuan.catatan_admin || '—'}</p>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Catatan Pemeriksa
                                </p>
                                <p className="mt-1 text-sm">{pengajuan.catatan_pemeriksa || '—'}</p>
                                {pengajuan.pemeriksa && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Diperiksa oleh {pengajuan.pemeriksa}
                                        {pengajuan.diperiksa_at ? ` pada ${pengajuan.diperiksa_at}` : ''}
                                    </p>
                                )}
                            </div>
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
                                <span className="text-sm text-muted-foreground">Status pengajuan</span>
                                <StatusBadge status={pengajuan.status} label={pengajuan.status_label} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Sifat</span>
                                <SifatBadge sifat={pengajuan.sifat} />
                            </div>
                            <Separator />
                            <InfoRow label="Pengaju">{pengajuan.pengaju.name}</InfoRow>
                            <InfoRow label="Pemeriksa">{pengajuan.pemeriksa ?? '-'}</InfoRow>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dokumen Surat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pengajuan.surat_keluar ? (
                                <div className="space-y-3">
                                    <div className="rounded-lg border p-3 text-sm">
                                        <p className="font-medium">{pengajuan.surat_keluar.nomor_surat}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {pengajuan.surat_keluar.tanggal_surat} ·{' '}
                                            {pengajuan.surat_keluar.status_label}
                                        </p>
                                    </div>
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href={`/surat-keluar/${pengajuan.surat_keluar.id}`}>
                                            <FileText />
                                            Lihat Surat Keluar
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full">
                                        <a
                                            href={`/surat-keluar/${pengajuan.surat_keluar.id}/cetak`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Printer />
                                            Cetak Surat
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Dokumen belum dibuat oleh admin.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Lampiran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pengajuan.lampiran ? (
                                <Button asChild variant="outline" className="w-full">
                                    <a href={pengajuan.lampiran.url} target="_blank" rel="noreferrer">
                                        <Download />
                                        {pengajuan.lampiran.nama}
                                    </a>
                                </Button>
                            ) : (
                                <p className="text-sm text-muted-foreground">Tidak ada lampiran.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {can.process && (
                <Card>
                    <CardHeader>
                        <CardTitle>Proses Admin</CardTitle>
                        <CardDescription>Buat dokumen surat keluar dari pengajuan ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setShowProcess(true)}>
                            <FileText />
                            Buat Dokumen & Kirim ke Pimpinan
                        </Button>
                    </CardContent>
                </Card>
            )}

            {can.review && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pemeriksaan Pimpinan</CardTitle>
                        <CardDescription>Periksa dokumen, lalu setujui atau minta revisi.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {!showReview ? (
                            <Button onClick={() => setShowReview(true)}>
                                <ClipboardCheck />
                                Mulai Pemeriksaan
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <Textarea
                                    rows={4}
                                    value={catatanPemeriksa}
                                    onChange={(event) => setCatatanPemeriksa(event.target.value)}
                                    placeholder="Catatan pemeriksaan (wajib untuk revisi/penolakan)"
                                />
                                {reviewError && <p className="text-xs text-destructive">{reviewError}</p>}
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={() => submitReview('setujui')} disabled={processing}>
                                        <CheckCircle2 />
                                        Setujui
                                    </Button>
                                    <Button variant="outline" onClick={() => submitReview('revisi')} disabled={processing}>
                                        <Edit />
                                        Minta Revisi
                                    </Button>
                                    <Button variant="destructive" onClick={() => submitReview('tolak')} disabled={processing}>
                                        <XCircle />
                                        Tolak
                                    </Button>
                                    <Button variant="ghost" onClick={() => setShowReview(false)} disabled={processing}>
                                        Batal
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {role === 'pimpinan' && !can.review && !pengajuan.surat_keluar && (
                <Card>
                    <CardHeader>
                        <CardTitle>Belum dapat diperiksa</CardTitle>
                        <CardDescription>
                            Tombol pemeriksaan muncul setelah Admin membuat dokumen dan mengirimkannya kepada Pimpinan.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {can.finalize && (
                <Card>
                    <CardHeader>
                        <CardTitle>Penerbitan Dokumen</CardTitle>
                        <CardDescription>
                            Dokumen sudah disetujui pimpinan. Tandai selesai untuk menerbitkan surat keluar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleFinalize} disabled={processing}>
                            <Send />
                            Tandai Selesai & Terbitkan
                        </Button>
                    </CardContent>
                </Card>
            )}

            {showProcess && (
                <Dialog open onOpenChange={setShowProcess}>
                    <ProcessDocumentDialog
                        pengajuan={pengajuan}
                        klasifikasi={klasifikasi}
                        templates={templates}
                        onOpenChange={setShowProcess}
                    />
                </Dialog>
            )}

            <ConfirmDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                title="Hapus pengajuan?"
                description={`Pengajuan "${pengajuan.perihal}" akan dihapus permanen.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
