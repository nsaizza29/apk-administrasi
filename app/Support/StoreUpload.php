<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class StoreUpload
{
    /**
     * Simpan unggahan tanpa getRealPath().
     * Di Windows, file sementara di C:\Windows\Temp sering membuat getRealPath() kosong,
     * lalu Laravel melempar "Path cannot be empty".
     */
    public static function public(UploadedFile $file, string $directory): string
    {
        $source = $file->getPathname();
        $originalName = basename(str_replace('\\', '/', $file->getClientOriginalName()));
        $filename = preg_replace('/[\x00-\x1F\/:*?"<>|]+/u', '_', $originalName) ?? '';
        $filename = trim($filename, ". \t\n\r\0\x0B");

        if ($filename === '' || preg_match('/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i', $filename)) {
            $filename = 'dokumen'.($file->guessExtension() ? '.'.$file->guessExtension() : '');
        }

        $uniqueDirectory = pathinfo($file->hashName(), PATHINFO_FILENAME);
        $path = trim($directory, '/').'/'.$uniqueDirectory.'/'.$filename;

        $stream = @fopen($source, 'rb');

        if ($stream === false) {
            $contents = @file_get_contents($source);

            if ($contents === false) {
                throw new RuntimeException('Berkas unggahan tidak dapat dibaca.');
            }

            $stored = Storage::disk('public')->put($path, $contents);
        } else {
            $stored = Storage::disk('public')->put($path, $stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        if ($stored === false) {
            throw new RuntimeException('Berkas gagal disimpan.');
        }

        return $path;
    }
}
