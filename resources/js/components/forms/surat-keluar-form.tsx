import { useForm } from '@inertiajs/react';
import { FileText, Loader2, Wand2 } from 'lucide-react';
import { FormField, FormSelect } from '@/components/form-field';
import { errorMessage } from '@/lib/errors';
import {
    buildTemplateBody,
    formatTanggalIndo,
    getTemplateFields,
    humanizeTemplateField,
    type SuratTemplate,
} from '@/lib/surat-templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { KlasifikasiOption } from '@/types';

export interface SuratKeluarFormData {
    tanggal_surat: string;
    tempat_surat: string;
    tujuan: string;
    perihal: string;
    jumlah_lampiran: string;
    template: string;
    details: Record<string, string>;
    klasifikasi_id: string;
    sifat: string;
    status: string;
    penandatangan_nama: string;
    penandatangan_jabatan: string;
    tembusan: string;
    lampiran: File | null;
}

interface SuratKeluarFormProps {
    klasifikasi: KlasifikasiOption[];
    templates: SuratTemplate[];
    initial?: Partial<SuratKeluarFormData>;
    existingLampiran?: { url: string; nama: string } | null;
    submitUrl: string;
    method: 'post' | 'put';
    submitLabel: string;
}

const sifatOptions = [
    { value: 'biasa', label: 'Biasa' },
    { value: 'penting', label: 'Penting' },
    { value: 'segera', label: 'Segera' },
];

const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'dikirim', label: 'Dikirim' },
    { value: 'diterima', label: 'Diterima' },
];

export function SuratKeluarForm({
    klasifikasi,
    templates,
    initial,
    existingLampiran,
    submitUrl,
    method,
    submitLabel,
}: SuratKeluarFormProps) {
    const { data, setData, post, transform, processing, errors } = useForm<SuratKeluarFormData>({
        tanggal_surat: initial?.tanggal_surat ?? new Date().toISOString().slice(0, 10),
        tempat_surat: initial?.tempat_surat ?? '',
        tujuan: initial?.tujuan ?? '',
        perihal: initial?.perihal ?? '',
        jumlah_lampiran: initial?.jumlah_lampiran ?? '',
        template: initial?.template ?? 'umum',
        details: initial?.details ?? {},
        klasifikasi_id: initial?.klasifikasi_id ?? '',
        sifat: initial?.sifat ?? 'biasa',
        status: initial?.status ?? 'draft',
        penandatangan_nama: initial?.penandatangan_nama ?? '',
        penandatangan_jabatan: initial?.penandatangan_jabatan ?? '',
        tembusan: initial?.tembusan ?? '',
        lampiran: null,
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();

        const options = { forceFormData: true as const };

        if (method === 'post') {
            post(submitUrl, options);
        } else {
            transform((formData) => ({ ...formData, _method: 'put' }));
            post(submitUrl, options);
        }
    }

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

    return (
        <form onSubmit={submit} className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Susun Surat</CardTitle>
                    <CardDescription>
                        Pilih template, lengkapi detail surat, lalu simpan. Nomor surat dan isi surat dibuat otomatis.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
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
                            placeholder="cth. Dinas Kesehatan"
                        />
                    </FormField>

                    <FormField label="Perihal" htmlFor="perihal" required error={errorMessage(errors.perihal)}>
                        <Input
                            id="perihal"
                            value={data.perihal}
                            onChange={(event) => setData('perihal', event.target.value)}
                            placeholder="cth. Permohonan Data Statistik"
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
                            onChange={(value) => setData('sifat', value)}
                            placeholder="Pilih sifat"
                            options={sifatOptions}
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

                    <FormField label="Status" error={errorMessage(errors.status)}>
                        <FormSelect
                            value={data.status}
                            onChange={(value) => setData('status', value)}
                            placeholder="Pilih status"
                            options={statusOptions}
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

                    <FormField label="Lampiran Berkas" htmlFor="lampiran" error={errorMessage(errors.lampiran)} className="space-y-1.5 sm:col-span-2">
                        <Input
                            id="lampiran"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            onChange={(event) => setData('lampiran', event.target.files?.[0] ?? null)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Format: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX. Maks 5 MB.
                            {existingLampiran && (
                                <>
                                    {' '}
                                    Lampiran saat ini:{' '}
                                    <a
                                        href={existingLampiran.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-medium text-foreground underline underline-offset-2"
                                    >
                                        {existingLampiran.nama}
                                    </a>
                                    . Pilih file baru untuk menggantinya.
                                </>
                            )}
                        </p>
                    </FormField>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Tanda Tangan & Tembusan</CardTitle>
                    <CardDescription>
                        Data penandatangan otomatis terisi dari pengaturan instansi dan bisa diubah per surat.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        label="Nama Penandatangan"
                        htmlFor="penandatangan_nama"
                        error={errorMessage(errors.penandatangan_nama)}
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
                </CardContent>
            </Card>

            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 size-4 shrink-0" />
                    <p>
                        Setelah surat disimpan, buka detail surat lalu klik <strong>Cetak Surat</strong> untuk melihat
                        pratinjau format resmi dan menyimpan sebagai PDF melalui dialog cetak browser.
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Batal
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
