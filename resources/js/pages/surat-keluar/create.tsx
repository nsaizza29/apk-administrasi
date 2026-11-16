import { Head, Link } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { SuratKeluarForm, type SuratKeluarFormData } from '@/components/forms/surat-keluar-form';
import { Button } from '@/components/ui/button';
import type { SuratTemplate } from '@/lib/surat-templates';
import type { KlasifikasiOption } from '@/types';

interface SuratKeluarCreateProps {
    klasifikasi: KlasifikasiOption[];
    templates: SuratTemplate[];
    defaults: Partial<SuratKeluarFormData>;
}

export default function SuratKeluarCreate({ klasifikasi, templates, defaults }: SuratKeluarCreateProps) {
    return (
        <AppShell title="Buat Surat Keluar">
            <Head title="Buat Surat Keluar" />

            <PageHeader title="Buat Surat Keluar" description="Pilih template dan susun isi surat langsung di aplikasi.">
                <Button asChild variant="outline" size="sm">
                    <Link href="/surat-keluar">Kembali</Link>
                </Button>
            </PageHeader>

            <SuratKeluarForm
                klasifikasi={klasifikasi}
                templates={templates}
                initial={defaults}
                submitUrl="/surat-keluar"
                method="post"
                submitLabel="Simpan Surat"
            />
        </AppShell>
    );
}
