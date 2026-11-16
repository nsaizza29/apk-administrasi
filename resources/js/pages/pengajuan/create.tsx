import { Head, Link } from '@inertiajs/react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { PengajuanForm } from '@/components/forms/pengajuan-form';
import { Button } from '@/components/ui/button';
import type { KlasifikasiOption } from '@/types';

export default function PengajuanCreate({ klasifikasi }: { klasifikasi: KlasifikasiOption[] }) {
    return (
        <AppShell title="Ajukan Dokumen">
            <Head title="Ajukan Dokumen" />

            <PageHeader
                title="Ajukan Dokumen"
                description="Isi kebutuhan dokumen. Pengajuan akan diproses admin lalu diperiksa pimpinan."
            >
                <Button asChild variant="outline" size="sm">
                    <Link href="/pengajuan">Kembali</Link>
                </Button>
            </PageHeader>

            <PengajuanForm
                klasifikasi={klasifikasi}
                submitUrl="/pengajuan"
                method="post"
                submitLabel="Kirim Pengajuan"
            />
        </AppShell>
    );
}
