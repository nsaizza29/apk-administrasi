import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { FormField, FormSelect } from '@/components/form-field';
import { errorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { KlasifikasiOption } from '@/types';

export interface PengajuanFormData {
    tujuan: string;
    perihal: string;
    isi: string;
    klasifikasi_id: string;
    sifat: string;
    catatan_pengaju: string;
    lampiran: File | null;
}

interface PengajuanFormProps {
    klasifikasi: KlasifikasiOption[];
    initial?: Partial<PengajuanFormData>;
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

export function PengajuanForm({
    klasifikasi,
    initial,
    existingLampiran,
    submitUrl,
    method,
    submitLabel,
}: PengajuanFormProps) {
    const { data, setData, post, transform, processing, errors } = useForm<PengajuanFormData>({
        tujuan: initial?.tujuan ?? '',
        perihal: initial?.perihal ?? '',
        isi: initial?.isi ?? '',
        klasifikasi_id: initial?.klasifikasi_id ?? '',
        sifat: initial?.sifat ?? 'biasa',
        catatan_pengaju: initial?.catatan_pengaju ?? '',
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

    return (
        <form onSubmit={submit} className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Data Pengajuan Dokumen</CardTitle>
                    <CardDescription>
                        Jelaskan dokumen yang dibutuhkan. Admin akan membuat surat resminya dan pimpinan akan memeriksa.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Tujuan / Penerima" htmlFor="tujuan" required error={errorMessage(errors.tujuan)}>
                        <Input
                            id="tujuan"
                            value={data.tujuan}
                            onChange={(event) => setData('tujuan', event.target.value)}
                            placeholder="cth. Dinas Kesehatan"
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

                    <FormField label="Perihal" htmlFor="perihal" required error={errorMessage(errors.perihal)} className="space-y-1.5 sm:col-span-2">
                        <Input
                            id="perihal"
                            value={data.perihal}
                            onChange={(event) => setData('perihal', event.target.value)}
                            placeholder="cth. Permohonan Data Statistik"
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

                    <FormField label="Lampiran Pendukung" htmlFor="lampiran" error={errorMessage(errors.lampiran)}>
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

                    <FormField
                        label="Isi / Ringkasan yang Diminta"
                        htmlFor="isi"
                        error={errorMessage(errors.isi)}
                        className="space-y-1.5 sm:col-span-2"
                    >
                        <Textarea
                            id="isi"
                            rows={5}
                            value={data.isi}
                            onChange={(event) => setData('isi', event.target.value)}
                            placeholder="Jelaskan isi atau maksud dokumen yang diajukan (opsional)"
                        />
                    </FormField>

                    <FormField
                        label="Catatan untuk Admin"
                        htmlFor="catatan_pengaju"
                        error={errorMessage(errors.catatan_pengaju)}
                        className="space-y-1.5 sm:col-span-2"
                    >
                        <Textarea
                            id="catatan_pengaju"
                            rows={3}
                            value={data.catatan_pengaju}
                            onChange={(event) => setData('catatan_pengaju', event.target.value)}
                            placeholder="cth. Mohon diterbitkan sebelum tanggal 20 (opsional)"
                        />
                    </FormField>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Batal
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing && <Loader2 className="animate-spin" />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
