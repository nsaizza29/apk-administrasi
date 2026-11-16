import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { FormField, FormSelect } from '@/components/form-field';
import { errorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { KlasifikasiOption } from '@/types';

export interface SuratMasukFormData {
    tanggal_surat: string;
    tanggal_diterima: string;
    asal: string;
    perihal: string;
    isi: string;
    klasifikasi_id: string;
    sifat: string;
    status: string;
    lampiran: File | null;
}

interface SuratMasukFormProps {
    klasifikasi: KlasifikasiOption[];
    initial?: Partial<SuratMasukFormData>;
    existingLampiran?: { url: string; nama: string } | null;
    submitUrl: string;
    method: 'post' | 'put';
    submitLabel: string;
    cancelUrl: string;
}

const sifatOptions = [
    { value: 'biasa', label: 'Biasa' },
    { value: 'penting', label: 'Penting' },
    { value: 'segera', label: 'Segera' },
];

const statusOptions = [
    { value: 'diterima', label: 'Diterima' },
    { value: 'diproses', label: 'Diproses' },
    { value: 'selesai', label: 'Selesai' },
];

export function SuratMasukForm({
    klasifikasi,
    initial,
    existingLampiran,
    submitUrl,
    method,
    submitLabel,
    cancelUrl,
}: SuratMasukFormProps) {
    const { data, setData, post, transform, processing, errors } = useForm<SuratMasukFormData>({
        tanggal_surat: initial?.tanggal_surat ?? '',
        tanggal_diterima: initial?.tanggal_diterima ?? '',
        asal: initial?.asal ?? '',
        perihal: initial?.perihal ?? '',
        isi: initial?.isi ?? '',
        klasifikasi_id: initial?.klasifikasi_id ?? '',
        sifat: initial?.sifat ?? 'biasa',
        status: initial?.status ?? 'diterima',
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
                    <CardTitle>Data Surat</CardTitle>
                    <CardDescription>Nomor surat dibuat otomatis sama dengan nomor agenda (SM/tahun/urut).</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Asal / Pengirim" htmlFor="asal" required error={errorMessage(errors.asal)}>
                        <Input
                            id="asal"
                            value={data.asal}
                            onChange={(event) => setData('asal', event.target.value)}
                            placeholder="cth. Dinas Pendidikan"
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
                        label="Tanggal Diterima"
                        htmlFor="tanggal_diterima"
                        required
                        error={errorMessage(errors.tanggal_diterima)}
                    >
                        <Input
                            id="tanggal_diterima"
                            type="date"
                            value={data.tanggal_diterima}
                            onChange={(event) => setData('tanggal_diterima', event.target.value)}
                        />
                    </FormField>

                    <FormField label="Perihal" htmlFor="perihal" required error={errorMessage(errors.perihal)} className="space-y-1.5 sm:col-span-2">
                        <Input
                            id="perihal"
                            value={data.perihal}
                            onChange={(event) => setData('perihal', event.target.value)}
                            placeholder="cth. Undangan Rapat Koordinasi"
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

                    <FormField label="Status" error={errorMessage(errors.status)}>
                        <FormSelect
                            value={data.status}
                            onChange={(value) => setData('status', value)}
                            placeholder="Pilih status"
                            options={statusOptions}
                        />
                    </FormField>

                    <FormField label="Lampiran" htmlFor="lampiran" error={errorMessage(errors.lampiran)} className="space-y-1.5 sm:col-span-2">
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
                        label="Isi / Ringkasan"
                        htmlFor="isi"
                        error={errorMessage(errors.isi)}
                        className="space-y-1.5 sm:col-span-2"
                    >
                        <Textarea
                            id="isi"
                            rows={5}
                            value={data.isi}
                            onChange={(event) => setData('isi', event.target.value)}
                            placeholder="Ringkasan isi surat (opsional)"
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
