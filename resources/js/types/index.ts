import type { PageProps } from '@inertiajs/core';

export type Role = 'admin' | 'pimpinan' | 'staf';

export type Sifat = 'biasa' | 'penting' | 'segera';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: Role;
    role_label: string;
    jabatan: string | null;
    unit_id: number;
    unit_name: string | null;
}

export interface NotificationItem {
    id: string;
    data: {
        judul: string;
        pesan: string;
        url: string;
    };
    read_at: string | null;
    created_at: string;
}

export interface SharedProps extends PageProps {
    auth: {
        user: AuthUser | null;
    };
    flash: {
        success?: string | null;
        error?: string | null;
    };
    notifications: {
        unread_count: number;
        items: NotificationItem[];
    };
}

export interface PaginatedLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginatedLink[];
}

export interface KlasifikasiOption {
    id: number;
    kode: string;
    nama: string;
    deskripsi?: string | null;
    surat_masuk_count?: number;
    surat_keluar_count?: number;
}

export interface SuratMasukRow {
    id: number;
    nomor_agenda: string;
    tanggal_surat: string;
    tanggal_diterima: string;
    asal: string;
    perihal: string;
    sifat: Sifat;
    status: string;
    status_label: string;
    klasifikasi: string | null;
    dicatat_oleh: string | null;
}

export interface SuratKeluarRow {
    id: number;
    nomor_surat: string;
    tanggal_surat: string;
    tujuan: string;
    perihal: string;
    sifat: Sifat;
    status: string;
    status_label: string;
    klasifikasi: string | null;
    dicatat_oleh: string | null;
}

export interface DisposisiRow {
    id: number;
    surat_masuk_id: number;
    nomor_agenda: string;
    perihal: string;
    klasifikasi: string | null;
    dari: string;
    kepada: string;
    catatan: string;
    sifat: Sifat;
    batas_waktu: string | null;
    terlambat: boolean;
    status: 'pending' | 'diproses' | 'selesai';
    status_label: string;
    created_at: string;
}

export interface Petugas {
    id: number;
    name: string;
    role: Role;
    jabatan: string | null;
}

export type PengajuanStatus =
    | 'diajukan'
    | 'diproses'
    | 'menunggu_pemeriksaan'
    | 'revisi'
    | 'disetujui'
    | 'ditolak'
    | 'selesai';

export interface PengajuanRow {
    id: number;
    nomor_pengajuan: string;
    pengaju: string | null;
    tujuan: string;
    perihal: string;
    sifat: Sifat;
    status: PengajuanStatus;
    status_label: string;
    klasifikasi: string | null;
    pemeriksa: string | null;
    tanggal: string;
    can_edit: boolean;
    can_delete: boolean;
    can_review: boolean;
}

export interface PengajuanDetail {
    id: number;
    nomor_pengajuan: string;
    tujuan: string;
    perihal: string;
    isi: string | null;
    sifat: Sifat;
    status: PengajuanStatus;
    status_label: string;
    catatan_pengaju: string | null;
    catatan_admin: string | null;
    catatan_pemeriksa: string | null;
    klasifikasi: { id: number; kode: string; nama: string } | null;
    pengaju: {
        name: string;
        jabatan: string | null;
        role_label: string;
    };
    pemeriksa: string | null;
    surat_keluar: {
        id: number;
        nomor_surat: string;
        status: string;
        status_label: string;
        tanggal_surat: string;
    } | null;
    lampiran: { url: string; nama: string } | null;
    created_at: string;
    diajukan_at: string | null;
    diperiksa_at: string | null;
}

export interface PengajuanPermissions {
    edit: boolean;
    delete: boolean;
    process: boolean;
    review: boolean;
    finalize: boolean;
}
