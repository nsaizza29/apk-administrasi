import { useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { PaginationLinks } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { errorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { applyFilter } from '@/lib/filter';
import type { KlasifikasiOption, Paginated, SharedProps } from '@/types';

interface KlasifikasiIndexProps {
    klasifikasi: Paginated<KlasifikasiOption & { deskripsi: string | null; surat_masuk_count: number; surat_keluar_count: number }>;
    filters: {
        q?: string;
    };
}

type EditingState = (KlasifikasiOption & { deskripsi: string | null }) | null;

function KlasifikasiDialog({
    item,
    onClose,
}: {
    item: EditingState;
    onClose: () => void;
}) {
    const { data, setData, post, put, processing, errors, wasSuccessful } = useForm({
        kode: item?.kode ?? '',
        nama: item?.nama ?? '',
        deskripsi: item?.deskripsi ?? '',
    });

    useEffect(() => {
        if (wasSuccessful) {
            onClose();
        }
    }, [wasSuccessful, onClose]);

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (item) {
            put(`/klasifikasi/${item.id}`, { preserveScroll: true });
        } else {
            post('/klasifikasi', { preserveScroll: true });
        }
    }

    return (
        <DialogContent>
            <form onSubmit={submit}>
                <DialogHeader>
                    <DialogTitle>{item ? 'Edit Klasifikasi' : 'Tambah Klasifikasi'}</DialogTitle>
                    <DialogDescription>
                        Klasifikasi membantu pengelompokan dan pencarian surat.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <FormField label="Kode" htmlFor="kode" required error={errorMessage(errors.kode)} hint="cth. 001">
                        <Input
                            id="kode"
                            value={data.kode}
                            onChange={(event) => setData('kode', event.target.value)}
                            placeholder="001"
                        />
                    </FormField>

                    <FormField label="Nama Klasifikasi" htmlFor="nama" required error={errorMessage(errors.nama)}>
                        <Input
                            id="nama"
                            value={data.nama}
                            onChange={(event) => setData('nama', event.target.value)}
                            placeholder="cth. Kepegawaian"
                        />
                    </FormField>

                    <FormField label="Deskripsi" htmlFor="deskripsi" error={errorMessage(errors.deskripsi)}>
                        <Textarea
                            id="deskripsi"
                            rows={3}
                            value={data.deskripsi}
                            onChange={(event) => setData('deskripsi', event.target.value)}
                            placeholder="Deskripsi singkat klasifikasi (opsional)"
                        />
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

export default function KlasifikasiIndex({ klasifikasi, filters }: KlasifikasiIndexProps) {
    const { auth } = usePage<SharedProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<EditingState>(null);
    const [deleting, setDeleting] = useState<(KlasifikasiOption & { deskripsi: string | null }) | null>(null);
    const [processing, setProcessing] = useState(false);

    function openCreate() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(item: EditingState) {
        setEditing(item);
        setDialogOpen(true);
    }

    function handleDelete() {
        if (!deleting) return;

        setProcessing(true);
        router.delete(`/klasifikasi/${deleting.id}`, {
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    }

    return (
        <AppShell title="Klasifikasi Surat">
            <Head title="Klasifikasi Surat" />

            <PageHeader
                title="Klasifikasi Surat"
                description="Kelompokkan surat berdasarkan kode dan kategori."
            >
                {isAdmin && (
                    <Button size="sm" onClick={openCreate}>
                        <Plus />
                        Tambah Klasifikasi
                    </Button>
                )}
            </PageHeader>

            <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                    value={filters.q ?? ''}
                    onSubmit={(value) => applyFilter('/klasifikasi', { q: value })}
                    placeholder="Cari kode atau nama..."
                />
                {filters.q && (
                    <Button variant="ghost" size="sm" onClick={() => router.get('/klasifikasi')}>
                        Reset Filter
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {klasifikasi.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState icon={Tags} title="Tidak ada klasifikasi ditemukan" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">Kode</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                                        <TableHead className="text-right">Surat Masuk</TableHead>
                                        <TableHead className="text-right">Surat Keluar</TableHead>
                                        {isAdmin && <TableHead className="w-20 text-right">Aksi</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {klasifikasi.data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono font-medium">{item.kode}</TableCell>
                                            <TableCell className="font-medium">{item.nama}</TableCell>
                                            <TableCell className="hidden max-w-72 text-muted-foreground md:table-cell">
                                                <p className="line-clamp-2 text-sm">{item.deskripsi ?? '-'}</p>
                                            </TableCell>
                                            <TableCell className="text-right">{item.surat_masuk_count}</TableCell>
                                            <TableCell className="text-right">{item.surat_keluar_count}</TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label="Edit klasifikasi"
                                                            onClick={() => openEdit(item)}
                                                        >
                                                            <Pencil className="opacity-60" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label="Hapus klasifikasi"
                                                            onClick={() => setDeleting(item)}
                                                        >
                                                            <Trash2 className="text-destructive opacity-60" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <PaginationLinks meta={klasifikasi} />

            {dialogOpen && (
                <Dialog open onOpenChange={(open) => !open && setDialogOpen(false)}>
                    <KlasifikasiDialog
                        key={editing?.id ?? 'create'}
                        item={editing}
                        onClose={() => setDialogOpen(false)}
                    />
                </Dialog>
            )}

            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Hapus klasifikasi?"
                description={`Klasifikasi "${deleting?.nama}" akan dihapus. Klasifikasi yang masih dipakai surat tidak dapat dihapus.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
