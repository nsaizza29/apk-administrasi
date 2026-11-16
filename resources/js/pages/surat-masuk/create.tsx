import { Head } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { SuratMasukForm } from '@/components/forms/surat-masuk-form';
import type { KlasifikasiOption } from '@/types';

export default function SuratMasukCreate({ klasifikasi }: { klasifikasi: KlasifikasiOption[] }) {
    return (
        <AppShell title="Tambah Surat Masuk">
            <Head title="Tambah Surat Masuk" />

            <PageHeader
                title="Catat Surat Masuk"
                description="Isi data surat masuk. Nomor surat dibuat otomatis sama dengan nomor agenda."
            />

            <SuratMasukForm
                klasifikasi={klasifikasi}
                submitUrl="/surat-masuk"
                method="post"
                submitLabel="Simpan Surat"
                cancelUrl="/surat-masuk"
            />
        </AppShell>
    );
}
