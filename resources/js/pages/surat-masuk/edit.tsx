import { Head } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { SuratMasukForm, type SuratMasukFormData } from '@/components/forms/surat-masuk-form';
import type { KlasifikasiOption } from '@/types';

interface SuratMasukEditProps {
    surat: SuratMasukFormData & {
        id: number;
        nomor_agenda: string;
        lampiran: { url: string; nama: string } | null;
    };
    klasifikasi: KlasifikasiOption[];
}

export default function SuratMasukEdit({ surat, klasifikasi }: SuratMasukEditProps) {
    return (
        <AppShell title="Edit Surat Masuk">
            <Head title="Edit Surat Masuk" />

            <PageHeader
                title="Edit Surat Masuk"
                description={`Perbarui data surat dengan nomor agenda ${surat.nomor_agenda}.`}
            />

            <SuratMasukForm
                klasifikasi={klasifikasi}
                initial={surat}
                existingLampiran={surat.lampiran}
                submitUrl={`/surat-masuk/${surat.id}`}
                method="put"
                submitLabel="Simpan Perubahan"
                cancelUrl="/surat-masuk"
            />
        </AppShell>
    );
}
