<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\OrganizationalUnit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $foundation = OrganizationalUnit::query()->where('slug', 'yayasan')->firstOrFail();
        $isFoundationAdmin = $request->user()->isAdmin() && $request->user()->unit_id === $foundation->id;
        $unitIds = $isFoundationAdmin
            ? $foundation->children()->pluck('id')
            : collect();
        $assignedAdminUnitIds = $isFoundationAdmin
            ? User::query()->whereIn('unit_id', $unitIds)->where('role', User::ROLE_ADMIN)->pluck('unit_id')
            : collect();

        return Inertia::render('users/index', [
            'users' => User::query()
                ->with('organizationalUnit:id,name')
                ->where(function ($query) use ($request, $isFoundationAdmin, $unitIds) {
                    $query->where(fn ($unitUsers) => $unitUsers
                        ->where('unit_id', $request->user()->unit_id)
                        ->whereIn('role', [User::ROLE_PIMPINAN, User::ROLE_STAF]));

                    if ($isFoundationAdmin) {
                        $query->orWhere(fn ($unitAdmins) => $unitAdmins
                            ->whereIn('unit_id', $unitIds)
                            ->where('role', User::ROLE_ADMIN));
                    }
                })
                ->when($request->filled('q'), function ($q) use ($request) {
                    $term = '%'.$request->input('q').'%';

                    return $q->where(fn ($w) => $w
                        ->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term)
                        ->orWhere('jabatan', 'like', $term));
                })
                ->when($request->filled('role'), fn ($q) => $q->where('role', $request->input('role')))
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString()
                ->through(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'jabatan' => $user->jabatan,
                    'created_at' => $user->created_at,
                    'unit_id' => $user->unit_id,
                    'unit_name' => $user->organizationalUnit?->name,
                ]),
            'filters' => $request->only(['q', 'role']),
            'canAssignUnitAdmins' => $isFoundationAdmin,
            'units' => $isFoundationAdmin
                ? $foundation->children()->orderBy('name')->get(['id', 'name'])->map(fn (OrganizationalUnit $unit) => [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'has_admin' => $assignedAdminUnitIds->contains($unit->id),
                ])->values()
                : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $foundation = OrganizationalUnit::query()->where('slug', 'yayasan')->firstOrFail();
        $isFoundationAdmin = $request->user()->isAdmin() && $request->user()->unit_id === $foundation->id;
        $allowedRoles = $isFoundationAdmin
            ? [User::ROLE_ADMIN, User::ROLE_PIMPINAN, User::ROLE_STAF]
            : [User::ROLE_PIMPINAN, User::ROLE_STAF];

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in($allowedRoles)],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'unit_id' => [
                'exclude_unless:role,'.User::ROLE_ADMIN,
                'required',
                'integer',
                Rule::exists('organizational_units', 'id')->where('parent_id', $foundation->id),
            ],
        ]);

        if ($data['role'] === User::ROLE_ADMIN) {
            if (User::query()->where('unit_id', $data['unit_id'])->where('role', User::ROLE_ADMIN)->exists()) {
                throw ValidationException::withMessages([
                    'unit_id' => 'Unit ini sudah memiliki Admin.',
                ]);
            }
        } else {
            $data['unit_id'] = $request->user()->unit_id;
        }

        User::create([
            ...$data,
        ]);

        return back()->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $foundation = OrganizationalUnit::query()->where('slug', 'yayasan')->firstOrFail();
        $isFoundationAdmin = $request->user()->isAdmin() && $request->user()->unit_id === $foundation->id;
        $isUnitAdmin = $user->role === User::ROLE_ADMIN
            && (int) $user->organizationalUnit?->parent_id === $foundation->id;
        $isOwnUnitStaff = $user->unit_id === $request->user()->unit_id
            && in_array($user->role, [User::ROLE_PIMPINAN, User::ROLE_STAF], true);

        abort_unless(($isFoundationAdmin && $isUnitAdmin) || $isOwnUnitStaff, 404);

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'jabatan' => ['nullable', 'string', 'max:255'],
        ];
        $rules['role'] = $isUnitAdmin
            ? ['prohibited']
            : ['required', Rule::in([User::ROLE_PIMPINAN, User::ROLE_STAF])];

        $data = $request->validate($rules);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return back()->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_unless($user->unit_id === $request->user()->unit_id, 404);

        abort_if($user->id === $request->user()->id, 422, 'Anda tidak dapat menghapus akun sendiri.');
        abort_unless(in_array($user->role, [User::ROLE_PIMPINAN, User::ROLE_STAF], true), 404);

        $user->delete();

        return back()->with('success', 'Pengguna berhasil dihapus.');
    }
}
