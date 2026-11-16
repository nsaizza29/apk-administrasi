import { Head, Link } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { PengajuanForm, type PengajuanFormData } from '@/components/forms/pengajuan-form';
import { Button } from '@/components/ui/button';
import type { KlasifikasiOption } from '@/types';

interface PengajuanEditProps {
    pengajuan: PengajuanFormData & {
        id: number;
        nomor_pengajuan: string;
        lampiran: { url: string; nama: string } | null;
    };
    klasifikasi: KlasifikasiOption[];
}

export default function PengajuanEdit({ pengajuan, klasifikasi }: PengajuanEditProps) {
    return (
        <AppShell title="Edit Pengajuan">
            <Head title="Edit Pengajuan" />

            <PageHeader
                title="Edit Pengajuan Dokumen"
                description={`Perbarui pengajuan ${pengajuan.nomor_pengajuan}.`}
            >
                <Button asChild variant="outline" size="sm">
                    <Link href={`/pengajuan/${pengajuan.id}`}>Kembali</Link>
                </Button>
            </PageHeader>

            <PengajuanForm
                klasifikasi={klasifikasi}
                initial={pengajuan}
                existingLampiran={pengajuan.lampiran}
                submitUrl={`/pengajuan/${pengajuan.id}`}
                method="put"
                submitLabel="Simpan Perubahan"
            />
        </AppShell>
    );
}
