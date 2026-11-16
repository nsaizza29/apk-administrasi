<?php

namespace App\Http\Controllers;

use App\Models\SuratKeluar;
use App\Models\TemplateSurat;
use App\Support\TemplateContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TemplateSuratController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('template-surat/index', [
            'templates' => TemplateSurat::orderBy('nama')
                ->get(['id', 'nama', 'slug', 'deskripsi', 'isi', 'is_active', 'updated_at'])
                ->map(fn (TemplateSurat $template) => [
                    'id' => $template->id,
                    'nama' => $template->nama,
                    'slug' => $template->slug,
                    'deskripsi' => $template->deskripsi,
                    'isi' => TemplateContent::sanitize($template->isi),
                    'is_active' => $template->is_active,
                    'updated_at' => $template->updated_at?->format('d M Y'),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        TemplateSurat::create($this->validated($request));

        return back()->with('success', 'Template surat berhasil ditambahkan.');
    }

    public function update(Request $request, TemplateSurat $templateSurat): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $oldSlug = $templateSurat->slug;
        $data = $this->validated($request, $templateSurat->id);

        $templateSurat->update($data);

        if ($oldSlug !== $data['slug']) {
            SuratKeluar::withoutGlobalScope('organizational_unit')
                ->where('template', $oldSlug)
                ->update(['template' => $data['slug']]);
        }

        return back()->with('success', 'Template surat berhasil diperbarui.');
    }

    public function destroy(Request $request, TemplateSurat $templateSurat): RedirectResponse
    {
        $this->authorizeAdmin($request);

        abort_if(
            SuratKeluar::withoutGlobalScope('organizational_unit')
                ->where('template', $templateSurat->slug)
                ->exists(),
            422,
            'Template tidak dapat dihapus karena masih digunakan oleh surat. Nonaktifkan saja jika tidak ingin ditampilkan.',
        );

        $templateSurat->delete();

        return back()->with('success', 'Template surat berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable', 'string', 'max:255', 'alpha_dash',
                Rule::unique('template_surat', 'slug')->ignore($ignoreId),
            ],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'isi' => ['required', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);

        $data['slug'] = $this->uniqueSlug($data['slug'] ?? null, $data['nama'], $ignoreId);
        $data['isi'] = TemplateContent::sanitize($data['isi']);

        return $data;
    }

    private function uniqueSlug(?string $slug, string $nama, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug ?: $nama) ?: 'template';
        $candidate = $base;
        $counter = 2;

        while (
            TemplateSurat::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $candidate = $base.'-'.$counter++;
        }

        return $candidate;
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->isAdmin(), 403, 'Hanya admin yang dapat mengelola template surat.');
    }
}
