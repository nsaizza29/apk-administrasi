import { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTheme } from 'next-themes';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function NotificationBell() {
    const { notifications } = usePage<SharedProps>().props;
    const unread = notifications?.unread_count ?? 0;
    const items = notifications?.items ?? [];

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['notifications'] });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell />
                    {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                    <span className="sr-only">Notifikasi</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-sm font-semibold">Notifikasi</p>
                    {unread > 0 && (
                        <Button variant="ghost" size="xs" onClick={() => router.patch('/notifications/read-all')}>
                            Tandai semua dibaca
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                    {items.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                            Belum ada notifikasi.
                        </p>
                    ) : (
                        items.map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                onClick={() => router.patch(`/notifications/${notification.id}/read`)}
                                className={cn(
                                    'flex w-full flex-col gap-0.5 border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/60',
                                    !notification.read_at && 'bg-muted/40',
                                )}
                            >
                                <span className="flex items-center gap-1.5 text-sm font-medium">
                                    {!notification.read_at && <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />}
                                    {notification.data.judul}
                                </span>
                                <span className="line-clamp-2 text-xs text-muted-foreground">
                                    {notification.data.pesan}
                                </span>
                                <span className="text-[11px] text-muted-foreground/70">{notification.created_at}</span>
                            </button>
                        ))
                    )}
                </div>
                <DropdownMenuSeparator />
                <Link
                    href="/notifications"
                    className="block px-3 py-2 text-center text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                    Lihat semua notifikasi
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <Button variant="ghost" size="icon" className="opacity-0" aria-hidden />;
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Ganti tema"
        >
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
        </Button>
    );
}

function UserMenu() {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;

    if (!user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 pr-2 pl-1.5">
                    <Avatar className="size-6">
                        <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium md:inline">{user.name}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Peran:{' '}
                    <span className="font-medium text-foreground">{user.role_label}</span>
                    {user.jabatan && (
                        <>
                            <br />
                            {user.jabatan}
                        </>
                    )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => router.post('/logout')}
                    className="text-destructive focus:text-destructive"
                >
                    <LogOut />
                    Keluar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function AppHeader({ title }: { title: string }) {
    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <h1 className="text-sm font-semibold tracking-tight sm:text-base">{title}</h1>
            <div className="ml-auto flex items-center gap-1">
                <NotificationBell />
                <ThemeToggle />
                <Separator orientation="vertical" className="mx-1 h-4" />
                <UserMenu />
            </div>
        </header>
    );
}
