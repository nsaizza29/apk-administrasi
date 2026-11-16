<?php

namespace App\Models;

use App\Support\TemplateContent;
use Illuminate\Database\Eloquent\Model;

class TemplateSurat extends Model
{
    protected $table = 'template_surat';

    protected $fillable = [
        'nama',
        'slug',
        'deskripsi',
        'isi',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function render(?string $slug, array $context): string
    {
        $body = static::where('slug', $slug)->value('isi')
            ?? static::where('slug', 'umum')->value('isi')
            ?? '';
        $body = TemplateContent::sanitize((string) $body);

        return (string) preg_replace_callback(
            '/\{(\w+)\}/',
            fn (array $match) => isset($context[$match[1]])
                ? nl2br(e((string) $context[$match[1]]), false)
                : '',
            $body,
        );
    }

    /**
     * @return array<int, array{value: string, label: string, description: string, body: string}>
     */
    public static function options(bool $onlyActive = true): array
    {
        return static::query()
            ->when($onlyActive, fn ($query) => $query->where('is_active', true))
            ->orderBy('nama')
            ->get()
            ->map(fn (self $template) => [
                'value' => $template->slug,
                'label' => $template->nama,
                'description' => $template->deskripsi ?? '',
                'body' => TemplateContent::sanitize($template->isi),
            ])
            ->all();
    }
}
