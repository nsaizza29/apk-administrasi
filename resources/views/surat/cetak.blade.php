<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cetak Surat {{ $surat->nomor_surat }}</title>
    <style>
        :root {
            color-scheme: light;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            background: #e5e7eb;
            color: #111827;
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.55;
        }

        .toolbar {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 12px 16px;
            background: #111827;
        }

        .toolbar a,
        .toolbar button {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid #374151;
            border-radius: 6px;
            padding: 8px 14px;
            background: #1f2937;
            color: #f9fafb;
            font-family: Arial, sans-serif;
            font-size: 13px;
            text-decoration: none;
            cursor: pointer;
        }

        .toolbar button:hover,
        .toolbar a:hover {
            background: #374151;
        }

        .paper {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            padding: 20mm 25mm;
            background: #ffffff;
            box-shadow: 0 10px 30px rgb(0 0 0 / 0.15);
        }

        .kop {
            display: flex;
            align-items: center;
            gap: 18px;
            text-align: center;
        }

        .kop-logo {
            width: 84px;
            max-height: 92px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .kop-text {
            flex: 1;
            padding-right: 84px;
        }

        .kop-text.no-logo {
            padding-right: 0;
        }

        .instansi {
            font-size: 16pt;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        .alamat,
        .kontak {
            font-size: 10.5pt;
            line-height: 1.35;
        }

        .garis-kop {
            margin-top: 10px;
            border-top: 3px solid #111827;
            border-bottom: 1px solid #111827;
            height: 3px;
        }

        .tanggal {
            margin-top: 22px;
            text-align: right;
        }

        .meta {
            margin-top: 16px;
        }

        .meta table {
            border-collapse: collapse;
        }

        .meta td {
            padding: 1px 0;
            vertical-align: top;
        }

        .meta .label {
            width: 72px;
        }

        .meta .colon {
            width: 12px;
        }

        .penerima {
            margin-top: 20px;
        }

        .isi {
            margin-top: 18px;
            text-align: justify;
            text-indent: 1.5cm;
        }

        .isi p {
            margin: 0 0 0.6em;
        }

        .isi ol,
        .isi ul {
            margin: 0.4em 0;
            padding-left: 1.2cm;
        }

        .isi li {
            padding-left: 0.1cm;
        }

        .isi table {
            border-collapse: collapse;
            margin: 0.4em 0;
            text-align: left;
            text-indent: 0;
        }

        .isi td,
        .isi th {
            padding: 0 0.35em 0 0;
            vertical-align: top;
        }

        .isi td:first-child {
            white-space: nowrap;
            padding-right: 0.45cm;
        }

        .isi td:nth-child(2) {
            white-space: nowrap;
            padding-right: 0.25cm;
        }

        .isi blockquote {
            margin: 0.6em 0 0.6em 1cm;
        }

        .ttd {
            margin-top: 42px;
            margin-left: auto;
            width: 78mm;
            text-align: left;
        }

        .ttd-space {
            height: 26mm;
        }

        .ttd-nama {
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 3px;
        }

        .tembusan {
            margin-top: 34px;
            font-size: 10.5pt;
        }

        .tembusan-title {
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 2px;
        }

        @media print {
            body {
                background: #ffffff;
            }

            .toolbar {
                display: none;
            }

            .paper {
                width: auto;
                min-height: auto;
                margin: 0;
                padding: 0;
                box-shadow: none;
            }

            @page {
                size: A4;
                margin: 20mm 25mm;
            }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <a href="{{ route('surat-keluar.show', $surat) }}">Kembali ke Detail</a>
        <button type="button" onclick="window.print()">Cetak / Simpan PDF</button>
    </div>

    @php
        $namaInstansi = $pengaturan->nama_instansi ?: 'NAMA INSTANSI';
        $alamatInstansi = $pengaturan->alamat;
        $kontakInstansi = collect([
            $pengaturan->telepon ? 'Telp. '.$pengaturan->telepon : null,
            $pengaturan->email ? 'Email: '.$pengaturan->email : null,
            $pengaturan->website ? $pengaturan->website : null,
        ])->filter()->implode(' | ');
        $tempatSurat = $surat->tempat_surat ?: ($pengaturan->kota ?: '');
        $jabatanTtd = $surat->penandatangan_jabatan ?: ($pengaturan->jabatan_pimpinan ?: '');
        $namaTtd = $surat->penandatangan_nama ?: ($pengaturan->nama_pimpinan ?: '');
    @endphp

    <main class="paper">
        <header class="kop">
            @if ($logoUrl)
                <img src="{{ $logoUrl }}" alt="Logo instansi" class="kop-logo">
            @endif
            <div class="kop-text {{ $logoUrl ? '' : 'no-logo' }}">
                <div class="instansi">{{ $namaInstansi }}</div>
                @if ($alamatInstansi)
                    <div class="alamat">{{ $alamatInstansi }}</div>
                @endif
                @if ($kontakInstansi)
                    <div class="kontak">{{ $kontakInstansi }}</div>
                @endif
            </div>
        </header>

        <div class="garis-kop"></div>

        <div class="tanggal">
            {{ trim($tempatSurat !== '' ? $tempatSurat.', ' : '') }}{{ $surat->tanggal_surat->translatedFormat('d F Y') }}
        </div>

        <div class="meta">
            <table>
                <tr>
                    <td class="label">Nomor</td>
                    <td class="colon">:</td>
                    <td>{{ $surat->nomor_surat }}</td>
                </tr>
                @if ($surat->jumlah_lampiran)
                    <tr>
                        <td class="label">Lampiran</td>
                        <td class="colon">:</td>
                        <td>{{ $surat->jumlah_lampiran }}</td>
                    </tr>
                @endif
                <tr>
                    <td class="label">Perihal</td>
                    <td class="colon">:</td>
                    <td>{{ $surat->perihal }}</td>
                </tr>
            </table>
        </div>

        <div class="penerima">
            <div>Kepada Yth.</div>
            <div><strong>{{ $surat->tujuan }}</strong></div>
            <div>di Tempat</div>
        </div>

        <p style="margin-top: 18px;">Dengan hormat,</p>

        <div class="isi">
            {!! $isiHtml !!}
        </div>

        <div class="ttd">
            <div>{{ $jabatanTtd }}</div>
            <div class="ttd-space"></div>
            <div class="ttd-nama">{{ $namaTtd }}</div>
            @if ($pengaturan->nip_pimpinan && $namaTtd === $pengaturan->nama_pimpinan)
                <div>NIP. {{ $pengaturan->nip_pimpinan }}</div>
            @endif
        </div>

        @if ($surat->tembusan)
            <div class="tembusan">
                <div class="tembusan-title">Tembusan:</div>
                <div>{!! nl2br(e($surat->tembusan)) !!}</div>
            </div>
        @endif
    </main>
</body>
</html>
