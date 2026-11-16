import { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FormField, FormSelect } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TemplateRichEditor } from '@/components/template-rich-editor';
import { errorMessage } from '@/lib/errors';

interface TemplateRow {
    id: number;
    nama: string;
    slug: string;
    deskripsi: string | null;
    isi: string;
    is_active: boolean;
    updated_at: string | null;
}

interface TemplateSuratIndexProps {
    templates: TemplateRow[];
}

function TemplateDialog({ item, onClose }: { item: TemplateRow | null; onClose: () => void }) {
    const { data, setData, post, put, processing, errors, wasSuccessful } = useForm({
        nama: item?.nama ?? '',
        slug: item?.slug ?? '',
        deskripsi: item?.deskripsi ?? '',
        isi: item?.isi ?? '',
        is_active: item?.is_active ?? true,
    });

    useEffect(() => {
        if (wasSuccessful) {
            onClose();
        }
    }, [wasSuccessful, onClose]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (item) {
            put(`/template-surat/${item.id}`, { preserveScroll: true });
        } else {
            post('/template-surat', { preserveScroll: true });
        }
    }

    return (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <form onSubmit={submit}>
                <DialogHeader>
                    <DialogTitle>{item ? 'Edit Template Surat' : 'Tambah Template Surat'}</DialogTitle>
                    <DialogDescription>
                        Format isi surat dengan toolbar. Placeholder seperti {'{perihal}'} dan {'{tujuan}'} akan terisi
                        otomatis saat template dipakai.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2 sm:grid-cols-2">
                    <FormField label="Nama Template" htmlFor="nama" required error={errorMessage(errors.nama)}>
                        <Input
                            id="nama"
                            value={data.nama}
                            onChange={(event) => setData('nama', event.target.value)}
                            placeholder="cth. Surat Undangan"
                        />
                    </FormField>

                    <FormField
                        label="Kode Template"
                        htmlFor="slug"
                        error={errorMessage(errors.slug)}
                        hint="Opsional. Kosongkan untuk dibuat otomatis dari nama."
                    >
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(event) => setData('slug', event.target.value)}
                            placeholder="surat-undangan"
                        />
                    </FormField>

                    <FormField
                        label="Deskripsi"
                        htmlFor="deskripsi"
                        error={errorMessage(errors.deskripsi)}
                        className="space-y-1.5 sm:col-span-2"
                    >
                        <Input
                            id="deskripsi"
                            value={data.deskripsi}
                            onChange={(event) => setData('deskripsi', event.target.value)}
                            placeholder="Keterangan singkat template (opsional)"
                        />
                    </FormField>

                    <FormField label="Status" error={errorMessage(errors.is_active)}>
                        <FormSelect
                            value={data.is_active ? 'aktif' : 'nonaktif'}
                            onChange={(value) => setData('is_active', value === 'aktif')}
                            placeholder="Pilih status"
                            options={[
                                { value: 'aktif', label: 'Aktif (tampil saat buat surat)' },
                                { value: 'nonaktif', label: 'Nonaktif' },
                            ]}
                        />
                    </FormField>

                    <FormField
                        label="Isi Template"
                        htmlFor="isi"
                        required
                        error={errorMessage(errors.isi)}
                        hint="Gunakan tombol tabel untuk merapikan pasangan label dan isi. Di dalam tabel, Tab berpindah ke sel berikutnya. Placeholder seperti {perihal} tetap bisa dipakai."
                        className="space-y-1.5 sm:col-span-2"
                    >
                        <TemplateRichEditor value={data.isi} onChange={(isi) => setData('isi', isi)} />
                    </FormField>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing && <Loader2 className="animate-spin" />}
                        Simpan
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

export default function TemplateSuratIndex({ templates }: TemplateSuratIndexProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateRow | null>(null);
    const [deleting, setDeleting] = useState<TemplateRow | null>(null);
    const [processing, setProcessing] = useState(false);

    function openCreate() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(item: TemplateRow) {
        setEditing(item);
        setDialogOpen(true);
    }

    function handleDelete() {
        if (!deleting) return;

        setProcessing(true);
        router.delete(`/template-surat/${deleting.id}`, {
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    }

    return (
        <AppShell title="Template Surat">
            <Head title="Template Surat" />

            <PageHeader
                title="Template Surat"
                description="Kelola kerangka isi surat yang bisa dipakai admin saat membuat surat."
            >
                <Button size="sm" onClick={openCreate}>
                    <Plus />
                    Tambah Template
                </Button>
            </PageHeader>

            <Card>
                <CardContent className="p-0">
                    {templates.length === 0 ? (
                        <div className="p-6">
                            <EmptyState icon={FileText} title="Belum ada template surat" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead className="hidden md:table-cell">Kode</TableHead>
                                        <TableHead className="hidden lg:table-cell">Deskripsi</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden sm:table-cell">Diperbarui</TableHead>
                                        <TableHead className="w-20 text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.nama}</TableCell>
                                            <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                                                {item.slug}
                                            </TableCell>
                                            <TableCell className="hidden max-w-72 text-muted-foreground lg:table-cell">
                                                <p className="line-clamp-2 text-sm">{item.deskripsi ?? '-'}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.is_active ? 'default' : 'outline'}>
                                                    {item.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden text-muted-foreground sm:table-cell">
                                                {item.updated_at ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label="Edit template"
                                                        onClick={() => openEdit(item)}
                                                    >
                                                        <Pencil className="opacity-60" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label="Hapus template"
                                                        onClick={() => setDeleting(item)}
                                                    >
                                                        <Trash2 className="text-destructive opacity-60" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {dialogOpen && (
                <Dialog open onOpenChange={(open) => !open && setDialogOpen(false)}>
                    <TemplateDialog key={editing?.id ?? 'create'} item={editing} onClose={() => setDialogOpen(false)} />
                </Dialog>
            )}

            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Hapus template?"
                description={`Template "${deleting?.nama}" akan dihapus. Template yang sudah dipakai surat tidak dapat dihapus; nonaktifkan saja.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
