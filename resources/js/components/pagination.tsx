import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

export function PaginationLinks<T>({ meta, className }: { meta: Paginated<T>; className?: string }) {
    if (!meta.links || meta.links.length <= 2) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
            <p className="text-sm text-muted-foreground">
                Menampilkan {meta.from ?? 0}–{meta.to ?? 0} dari {meta.total} data
            </p>
            <div className="flex items-center gap-1">
                {meta.links.map((link, index) => {
                    const isFirst = index === 0;
                    const isLast = index === meta.links.length - 1;
                    const isEllipsis = !link.url;

                    return (
                        <Button
                            key={`${index}-${link.label}`}
                            variant={link.active ? 'default' : isEllipsis ? 'ghost' : 'outline'}
                            size={isFirst || isLast ? 'sm' : 'icon-sm'}
                            disabled={!link.url}
                            aria-label={isFirst ? 'Sebelumnya' : isLast ? 'Berikutnya' : undefined}
                            onClick={() =>
                                link.url &&
                                router.get(link.url, {}, { preserveState: true, preserveScroll: true })
                            }
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
