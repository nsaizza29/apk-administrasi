import { Head, Link } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { SuratKeluarForm, type SuratKeluarFormData } from '@/components/forms/surat-keluar-form';
import { Button } from '@/components/ui/button';
import type { SuratTemplate } from '@/lib/surat-templates';
import type { KlasifikasiOption } from '@/types';

interface SuratKeluarEditProps {
    surat: SuratKeluarFormData & {
        id: number;
        nomor_surat: string;
        lampiran: { url: string; nama: string } | null;
    };
    klasifikasi: KlasifikasiOption[];
    templates: SuratTemplate[];
}

export default function SuratKeluarEdit({ surat, klasifikasi, templates }: SuratKeluarEditProps) {
    return (
        <AppShell title="Edit Surat Keluar">
            <Head title="Edit Surat Keluar" />

            <PageHeader
                title="Edit Surat Keluar"
                description={`Perbarui surat dengan nomor ${surat.nomor_surat}.`}
            >
                <Button asChild variant="outline" size="sm">
                    <Link href={`/surat-keluar/${surat.id}`}>Kembali</Link>
                </Button>
            </PageHeader>

            <SuratKeluarForm
                klasifikasi={klasifikasi}
                templates={templates}
                initial={surat}
                existingLampiran={surat.lampiran}
                submitUrl={`/surat-keluar/${surat.id}`}
                method="put"
                submitLabel="Simpan Perubahan"
            />
        </AppShell>
    );
}
