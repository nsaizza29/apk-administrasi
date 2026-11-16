import { Head, router } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PaginationLinks } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NotificationItem, Paginated } from '@/types';

interface NotificationsIndexProps {
    notifications: Paginated<NotificationItem>;
}

export default function NotificationsIndex({ notifications }: NotificationsIndexProps) {
    const unreadCount = notifications.data.filter((item) => !item.read_at).length;

    function openNotification(item: NotificationItem) {
        router.patch(`/notifications/${item.id}/read`, {}, { preserveScroll: true });
    }

    return (
        <AppShell title="Notifikasi">
            <Head title="Notifikasi" />

            <PageHeader
                title="Notifikasi"
                description={
                    unreadCount > 0
                        ? `Anda memiliki ${unreadCount} notifikasi yang belum dibaca.`
                        : 'Semua notifikasi sudah dibaca.'
                }
            >
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={() => router.patch('/notifications/read-all')}>
                        <CheckCheck />
                        Tandai Semua Dibaca
                    </Button>
                )}
            </PageHeader>

            <Card>
                <CardContent className="p-0">
                    {notifications.data.length === 0 ? (
                        <div className="p-6">
                            <EmptyState
                                icon={Bell}
                                title="Belum ada notifikasi"
                                description="Notifikasi surat baru dan disposisi akan muncul di sini."
                            />
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.data.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => openNotification(item)}
                                    className={cn(
                                        'flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-muted/60',
                                        !item.read_at && 'bg-muted/40',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'mt-1.5 size-2 shrink-0 rounded-full',
                                            item.read_at ? 'bg-muted-foreground/30' : 'bg-blue-500',
                                        )}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium">{item.data.judul}</span>
                                            <span className="text-xs text-muted-foreground">{item.created_at}</span>
                                        </span>
                                        <span className="mt-0.5 block text-sm text-muted-foreground">
                                            {item.data.pesan}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <PaginationLinks meta={notifications} />
        </AppShell>
    );
}
