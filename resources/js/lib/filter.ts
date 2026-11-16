import { router } from '@inertiajs/react';

type FilterValues = Record<string, string | number | null | undefined>;

export function applyFilter(url: string, values: FilterValues) {
    const query: Record<string, string | number> = {};

    Object.entries(values).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            query[key] = value;
        }
    });

    router.get(url, query, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });
}

export function visitPage(url: string) {
    router.get(url, {}, { preserveState: true, preserveScroll: true });
}
