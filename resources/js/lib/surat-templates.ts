export interface SuratTemplateContext {
    perihal?: string;
    tujuan?: string;
    pengaju?: string;
    jabatan?: string;
    tanggal?: string;
    tempat?: string;
    [key: string]: string | undefined;
}

export interface SuratTemplate {
    value: string;
    label: string;
    description: string;
    body: string;
}

export const SURAT_TEMPLATES: SuratTemplate[] = [
    {
        value: 'umum',
        label: 'Surat Umum',
        description: 'Susunan surat resmi untuk keperluan umum.',
        body: `Sehubungan dengan {perihal}, bersama ini kami sampaikan hal-hal sebagai berikut:

1. 
2. 
3. 

Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.`,
    },
    {
        value: 'undangan',
        label: 'Surat Undangan',
        description: 'Undangan rapat, kegiatan, atau acara resmi.',
        body: `Sehubungan dengan {perihal}, kami mengharapkan kehadiran Bapak/Ibu pada:

Hari/Tanggal : {hari_tanggal}
Waktu        : {waktu}
Tempat       : {tempat_acara}
Acara        : {acara}

Mengingat pentingnya acara tersebut, kami mohon Bapak/Ibu dapat hadir tepat waktu.

Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.`,
    },
    {
        value: 'pemberitahuan',
        label: 'Surat Pemberitahuan',
        description: 'Menyampaikan informasi atau kebijakan baru.',
        body: `Dengan ini kami beritahukan bahwa {perihal}.

Adapun ketentuan lebih lanjut adalah sebagai berikut:

1. 
2. 
3. 

Demikian pemberitahuan ini kami sampaikan untuk menjadi perhatian Bapak/Ibu.`,
    },
    {
        value: 'permohonan',
        label: 'Surat Permohonan',
        description: 'Mengajukan permohonan data, izin, atau bantuan.',
        body: `Sehubungan dengan {perihal}, kami mengajukan permohonan kepada Bapak/Ibu untuk:

1. 
2. 
3. 

Demikian permohonan ini kami sampaikan. Atas perhatian dan persetujuan Bapak/Ibu, kami ucapkan terima kasih.`,
    },
    {
        value: 'tugas',
        label: 'Surat Tugas',
        description: 'Menugaskan pegawai untuk melaksanakan kegiatan.',
        body: `Dalam rangka {perihal}, dengan ini kami menugaskan:

Nama    : {nama_petugas}
NIP     : {nip_petugas}
Jabatan : {jabatan_petugas}

Untuk melaksanakan tugas tersebut dengan penuh tanggung jawab dan melaporkan hasilnya kepada pimpinan.

Demikian surat tugas ini dibuat untuk dilaksanakan sebagaimana mestinya.`,
    },
    {
        value: 'keterangan',
        label: 'Surat Keterangan',
        description: 'Menerangkan status atau kondisi tertentu.',
        body: `Yang bertanda tangan di bawah ini menerangkan bahwa:

Nama    : {nama_petugas}
NIP     : {nip_petugas}
Jabatan : {jabatan_petugas}

benar-benar {status_keterangan}

Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.`,
    },
];

export function getSuratTemplate(value?: string | null, templates: SuratTemplate[] = SURAT_TEMPLATES): SuratTemplate {
    return templates.find((template) => template.value === value) ?? templates[0] ?? SURAT_TEMPLATES[0];
}

export function buildTemplateBody(
    value: string | null | undefined,
    context: SuratTemplateContext = {},
    templates: SuratTemplate[] = SURAT_TEMPLATES,
): string {
    const template = getSuratTemplate(value, templates);
    const replacements: Record<string, string> = {};

    for (const [key, replacement] of Object.entries(context)) {
        if (replacement !== undefined) {
            replacements[key] = String(replacement);
        }
    }

    return template.body.replace(/\{(\w+)\}/g, (match, key: string) => {
        const replacement = replacements[key];

        if (replacement === undefined) {
            return match;
        }

        return replacement
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;')
            .replace(/\r\n|\r|\n/g, '<br>');
    });
}

const AUTO_FIELDS = new Set(['perihal', 'tujuan', 'tanggal', 'tempat']);

const FIELD_LABELS: Record<string, string> = {
    hari_tanggal: 'Hari/Tanggal',
    tempat_acara: 'Tempat Acara',
    nama_petugas: 'Nama Petugas',
    nip_petugas: 'NIP Petugas',
    jabatan_petugas: 'Jabatan Petugas',
    status_keterangan: 'Status/Keterangan',
};

export function humanizeTemplateField(key: string): string {
    if (FIELD_LABELS[key]) {
        return FIELD_LABELS[key];
    }

    return key
        .split('_')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function getTemplateFields(template: SuratTemplate | undefined): string[] {
    if (!template) {
        return [];
    }

    const keys = new Set<string>();

    for (const match of template.body.matchAll(/\{(\w+)\}/g)) {
        if (!AUTO_FIELDS.has(match[1])) {
            keys.add(match[1]);
        }
    }

    return [...keys];
}

export function formatTanggalIndo(value: string): string {
    if (!value) {
        return '';
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
