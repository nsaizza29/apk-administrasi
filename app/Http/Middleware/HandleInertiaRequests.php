<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'role_label' => $user->roleLabel(),
                    'jabatan' => $user->jabatan,
                    'unit_id' => $user->unit_id,
                    'unit_name' => $user->organizationalUnit?->name,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => fn () => $user ? static::notifications($user) : ['unread_count' => 0, 'items' => []],
        ];
    }

    /**
     * @return array{unread_count: int, items: array<int, array<string, mixed>>}
     */
    protected static function notifications(User $user): array
    {
        $items = $user->notifications()
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                'type' => $notification->type,
                'data' => $notification->data,
                'read_at' => $notification->read_at?->toIso8601String(),
                'created_at' => $notification->created_at->diffForHumans(),
            ])->values()->all();

        return [
            'unread_count' => $user->unreadNotifications()->count(),
            'items' => $items,
        ];
    }
}
