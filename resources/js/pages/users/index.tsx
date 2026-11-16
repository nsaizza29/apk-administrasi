import { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Loader2, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FilterSelect } from '@/components/filter-select';
import { FormField, FormSelect } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { PaginationLinks } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { errorMessage } from '@/lib/errors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { applyFilter } from '@/lib/filter';
import { cn } from '@/lib/utils';
import type { Paginated, Role, SharedProps } from '@/types';
import { usePage } from '@inertiajs/react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: Role;
    jabatan: string | null;
    created_at: string;
    unit_id: number;
    unit_name: string | null;
}

interface UnitOption {
    id: number;
    name: string;
    has_admin: boolean;
}

interface UsersIndexProps {
    users: Paginated<UserRow>;
    canAssignUnitAdmins: boolean;
    units: UnitOption[];
    filters: {
        q?: string;
        role?: string;
    };
}

const roleOptions = [
    { value: 'admin', label: 'Admin Unit' },
    { value: 'pimpinan', label: 'Pimpinan' },
    { value: 'staf', label: 'Staf' },
];
const staffRoleOptions = roleOptions.filter((option) => option.value !== 'admin');

const roleBadgeStyles: Record<Role, string> = {
    admin: 'border-blue-200 bg-blue-50 text-blue-700',
    pimpinan: 'border-violet-200 bg-violet-50 text-violet-700',
    staf: 'border-border bg-muted text-muted-foreground',
};

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function UserDialog({
    item,
    units,
    canAssignUnitAdmins,
    onClose,
}: {
    item: UserRow | null;
    units: UnitOption[];
    canAssignUnitAdmins: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, put, transform, processing, errors, wasSuccessful, reset } = useForm({
        name: item?.name ?? '',
        email: item?.email ?? '',
        password: '',
        role: item?.role ?? 'staf',
        jabatan: item?.jabatan ?? '',
        unit_id: item ? String(item.unit_id) : '',
    });

    useEffect(() => {
        if (wasSuccessful) {
            reset();
            onClose();
        }
    }, [wasSuccessful, onClose, reset]);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        transform((formData) => {
            const { role, unit_id, ...account } = formData;

            if (item?.role === 'admin') {
                return account;
            }

            if (item) {
                return { ...account, role };
            }

            return role === 'admin' ? { ...account, role, unit_id } : { ...account, role };
        });

        if (item) {
            put(`/users/${item.id}`, { preserveScroll: true });
        } else {
            post('/users', { preserveScroll: true });
        }
    }

    return (
        <DialogContent>
            <form onSubmit={submit}>
                <DialogHeader>
                    <DialogTitle>{item ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
                    <DialogDescription>
                        {item?.role === 'admin'
                            ? 'Perbarui akun Admin unit yang ditetapkan Yayasan.'
                            : item
                              ? 'Perbarui data dan peran Staf atau Pimpinan.'
                              : data.role === 'admin'
                                ? 'Yayasan menetapkan Admin untuk unit yang belum memiliki Admin.'
                                : 'Tambahkan akun Staf atau Pimpinan untuk unit ini.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2 sm:grid-cols-2">
                    <FormField label="Nama Lengkap" htmlFor="name" required error={errorMessage(errors.name)} className="space-y-1.5 sm:col-span-2">
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            placeholder="cth. Budi Santoso"
                        />
                    </FormField>

                    <FormField label="Email" htmlFor="email" required error={errorMessage(errors.email)}>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                            placeholder="nama@surat.test"
                        />
                    </FormField>

                    <FormField
                        label="Password"
                        htmlFor="password"
                        required={!item}
                        error={errorMessage(errors.password)}
                        hint={item ? 'Kosongkan jika tidak ingin mengubah password.' : 'Minimal 8 karakter.'}
                    >
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                            placeholder={item ? '••••••••' : 'Minimal 8 karakter'}
                        />
                    </FormField>

                    <FormField label="Peran" required error={errorMessage(errors.role)}>
                        {item?.role === 'admin' ? (
                            <Input value="Admin Unit" disabled />
                        ) : (
                            <FormSelect
                                value={data.role}
                                onChange={(value) => setData('role', value as Role)}
                                placeholder="Pilih peran"
                                options={!item && canAssignUnitAdmins && units.some((unit) => !unit.has_admin)
                                    ? roleOptions
                                    : staffRoleOptions}
                            />
                        )}
                    </FormField>

                    <FormField label="Jabatan" htmlFor="jabatan" error={errorMessage(errors.jabatan)}>
                        <Input
                            id="jabatan"
                            value={data.jabatan}
                            onChange={(event) => setData('jabatan', event.target.value)}
                            placeholder="cth. Staf Tata Usaha"
                        />
                    </FormField>

                    {item?.role === 'admin' && (
                        <FormField label="Unit" htmlFor="unit_name">
                            <Input id="unit_name" value={item.unit_name ?? ''} disabled />
                        </FormField>
                    )}

                    {!item && data.role === 'admin' && canAssignUnitAdmins && (
                        <FormField
                            label="Unit"
                            required
                            error={errorMessage(errors.unit_id)}
                            hint={!units.some((unit) => !unit.has_admin) ? 'Semua unit sudah memiliki Admin.' : undefined}
                        >
                            <FormSelect
                                value={data.unit_id}
                                onChange={(value) => setData('unit_id', value)}
                                placeholder="Pilih unit"
                                options={units
                                    .filter((unit) => !unit.has_admin)
                                    .map((unit) => ({ value: String(unit.id), label: unit.name }))}
                            />
                        </FormField>
                    )}
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

export default function UsersIndex({ users, filters, canAssignUnitAdmins, units }: UsersIndexProps) {
    const { auth } = usePage<SharedProps>().props;
    const currentUserId = auth.user?.id;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [deleting, setDeleting] = useState<UserRow | null>(null);
    const [processing, setProcessing] = useState(false);

    const hasFilter = Boolean(filters.q || filters.role);

    function openCreate() {
        setEditing(null);
        setDialogOpen(true);
    }

    function handleDelete() {
        if (!deleting) return;

        setProcessing(true);
        router.delete(`/users/${deleting.id}`, {
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
    }

    return (
        <AppShell title="Manajemen Pengguna">
            <Head title="Manajemen Pengguna" />

            <PageHeader
                title="Manajemen Pengguna"
                description={canAssignUnitAdmins
                    ? 'Yayasan menetapkan Admin unit di halaman ini. Admin unit mengelola akun Staf dan Pimpinan di unitnya.'
                    : `Atur akun Staf dan Pimpinan untuk unit ${auth.user?.unit_name ?? 'Anda'} saja.`}
            >
                <Button size="sm" onClick={openCreate}>
                    <Plus />
                    Tambah Pengguna
                </Button>
            </PageHeader>

            <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                    value={filters.q ?? ''}
                    onSubmit={(value) => applyFilter('/users', { ...filters, q: value })}
                    placeholder="Cari nama, email, jabatan..."
                />
                <FilterSelect
                    value={filters.role ?? ''}
                    onChange={(value) => applyFilter('/users', { ...filters, role: value })}
                    placeholder="Peran"
                    options={canAssignUnitAdmins ? roleOptions : staffRoleOptions}
                />
                {hasFilter && (
                    <Button variant="ghost" size="sm" onClick={() => router.get('/users')}>
                        Reset Filter
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {users.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState icon={UserRound} title="Tidak ada pengguna ditemukan" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pengguna</TableHead>
                                        {canAssignUnitAdmins && <TableHead>Unit</TableHead>}
                                        <TableHead className="hidden md:table-cell">Jabatan</TableHead>
                                        <TableHead>Peran</TableHead>
                                        <TableHead className="hidden lg:table-cell">Terdaftar</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <p className="font-medium">{row.name}</p>
                                                <p className="text-xs text-muted-foreground">{row.email}</p>
                                            </TableCell>
                                            {canAssignUnitAdmins && (
                                                <TableCell>{row.unit_name ?? '-'}</TableCell>
                                            )}
                                            <TableCell className="hidden md:table-cell">{row.jabatan ?? '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn('font-medium', roleBadgeStyles[row.role])}>
                                                    {roleOptions.find((option) => option.value === row.role)?.label ?? row.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
                                                {formatDate(row.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label="Edit pengguna"
                                                        onClick={() => {
                                                            setEditing(row);
                                                            setDialogOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="opacity-60" />
                                                    </Button>
                                                    {row.role !== 'admin' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label="Hapus pengguna"
                                                            disabled={row.id === currentUserId}
                                                            onClick={() => setDeleting(row)}
                                                        >
                                                            <Trash2 className="text-destructive opacity-60" />
                                                        </Button>
                                                    )}
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

            <PaginationLinks meta={users} />

            {dialogOpen && (
                <Dialog open onOpenChange={(open) => !open && setDialogOpen(false)}>
                    <UserDialog
                        key={editing?.id ?? 'create'}
                        item={editing}
                        units={units}
                        canAssignUnitAdmins={canAssignUnitAdmins}
                        onClose={() => setDialogOpen(false)}
                    />
                </Dialog>
            )}

            <ConfirmDialog
                open={Boolean(deleting)}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Hapus pengguna?"
                description={`Akun "${deleting?.name}" akan dihapus permanen dari sistem.`}
                processing={processing}
                onConfirm={handleDelete}
            />
        </AppShell>
    );
}
