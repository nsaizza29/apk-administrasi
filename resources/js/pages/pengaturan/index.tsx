import { Head, useForm } from '@inertiajs/react';
import { Loader2, Save } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { FormField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/errors';

interface PengaturanData {
    nama_instansi: string;
    alamat: string;
    telepon: string;
    email: string;
    website: string;
    kota: string;
    nama_pimpinan: string;
    jabatan_pimpinan: string;
    nip_pimpinan: string;
    logo: { url: string; nama: string } | null;
}

interface PengaturanIndexProps {
    pengaturan: PengaturanData;
}

export default function PengaturanIndex({ pengaturan }: PengaturanIndexProps) {
    const { data, setData, post, processing, errors, transform } = useForm({
        nama_instansi: pengaturan.nama_instansi ?? '',
        alamat: pengaturan.alamat ?? '',
        telepon: pengaturan.telepon ?? '',
        email: pengaturan.email ?? '',
        website: pengaturan.website ?? '',
        kota: pengaturan.kota ?? '',
        nama_pimpinan: pengaturan.nama_pimpinan ?? '',
        jabatan_pimpinan: pengaturan.jabatan_pimpinan ?? '',
        nip_pimpinan: pengaturan.nip_pimpinan ?? '',
        logo: null as File | null,
    });

    transform((data) => ({ ...data, _method: 'put' }));

    function submit(event: React.FormEvent) {
        event.preventDefault();
        post('/pengaturan', { forceFormData: true, preserveScroll: true });
    }

    return (
        <AppShell title="Pengaturan Surat">
            <Head title="Pengaturan Surat" />

            <PageHeader
                title="Pengaturan Surat"
                description="Identitas instansi dan penandatangan yang dipakai pada kop dan tanda tangan surat."
            />

            <form onSubmit={submit} className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Kop Surat</CardTitle>
                        <CardDescription>Tampil di bagian paling atas surat saat dicetak.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label="Nama Instansi"
                            htmlFor="nama_instansi"
                            required
                            error={errorMessage(errors.nama_instansi)}
                            className="space-y-1.5 sm:col-span-2"
                        >
                            <Input
                                id="nama_instansi"
                                value={data.nama_instansi}
                                onChange={(event) => setData('nama_instansi', event.target.value)}
                                placeholder="cth. PEMERINTAH KOTA BANDUNG"
                            />
                        </FormField>

                        <FormField
                            label="Alamat"
                            htmlFor="alamat"
                            error={errorMessage(errors.alamat)}
                            className="space-y-1.5 sm:col-span-2"
                        >
                            <Textarea
                                id="alamat"
                                rows={2}
                                value={data.alamat}
                                onChange={(event) => setData('alamat', event.target.value)}
                                placeholder="Jl. ... No. ... Kota ..."
                            />
                        </FormField>

                        <FormField label="Telepon" htmlFor="telepon" error={errorMessage(errors.telepon)}>
                            <Input
                                id="telepon"
                                value={data.telepon}
                                onChange={(event) => setData('telepon', event.target.value)}
                                placeholder="(021) 123456"
                            />
                        </FormField>

                        <FormField label="Email" htmlFor="email" error={errorMessage(errors.email)}>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                placeholder="admin@instansi.go.id"
                            />
                        </FormField>

                        <FormField label="Website" htmlFor="website" error={errorMessage(errors.website)}>
                            <Input
                                id="website"
                                value={data.website}
                                onChange={(event) => setData('website', event.target.value)}
                                placeholder="www.instansi.go.id"
                            />
                        </FormField>

                        <FormField label="Kota Surat" htmlFor="kota" error={errorMessage(errors.kota)}>
                            <Input
                                id="kota"
                                value={data.kota}
                                onChange={(event) => setData('kota', event.target.value)}
                                placeholder="Bandung"
                            />
                        </FormField>

                        <FormField
                            label="Logo Instansi"
                            htmlFor="logo"
                            error={errorMessage(errors.logo)}
                            hint="PNG/JPG/WEBP, maks 2 MB. Kosongkan jika tidak memakai logo."
                            className="space-y-1.5 sm:col-span-2"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                {pengaturan.logo && (
                                    <img
                                        src={pengaturan.logo.url}
                                        alt="Logo instansi"
                                        className="h-16 w-16 rounded border object-contain p-1"
                                    />
                                )}
                                <Input
                                    id="logo"
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.webp"
                                    onChange={(event) => setData('logo', event.target.files?.[0] ?? null)}
                                    className="max-w-sm"
                                />
                            </div>
                        </FormField>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Penandatangan</CardTitle>
                        <CardDescription>Data ini otomatis dipakai pada bagian tanda tangan surat.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label="Nama Penandatangan"
                            htmlFor="nama_pimpinan"
                            required
                            error={errorMessage(errors.nama_pimpinan)}
                        >
                            <Input
                                id="nama_pimpinan"
                                value={data.nama_pimpinan}
                                onChange={(event) => setData('nama_pimpinan', event.target.value)}
                                placeholder="Nama lengkap pimpinan"
                            />
                        </FormField>

                        <FormField label="Jabatan" htmlFor="jabatan_pimpinan" error={errorMessage(errors.jabatan_pimpinan)}>
                            <Input
                                id="jabatan_pimpinan"
                                value={data.jabatan_pimpinan}
                                onChange={(event) => setData('jabatan_pimpinan', event.target.value)}
                                placeholder="cth. Kepala Kantor"
                            />
                        </FormField>

                        <FormField label="NIP" htmlFor="nip_pimpinan" error={errorMessage(errors.nip_pimpinan)}>
                            <Input
                                id="nip_pimpinan"
                                value={data.nip_pimpinan}
                                onChange={(event) => setData('nip_pimpinan', event.target.value)}
                                placeholder="NIP (opsional)"
                            />
                        </FormField>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={processing}>
                        {processing ? <Loader2 className="animate-spin" /> : <Save />}
                        Simpan Pengaturan
                    </Button>
                </div>
            </form>
        </AppShell>
    );
}
