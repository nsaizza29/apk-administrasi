import * as React from 'react';

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
            <span className="rounded-full bg-muted p-3">
                <Icon className="size-5 text-muted-foreground" />
            </span>
            <p className="mt-3 text-sm font-medium">{title}</p>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
    );
}
