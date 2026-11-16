import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <span className="rounded-md bg-muted p-1.5">
                    <Icon className="size-4 text-muted-foreground" />
                </span>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
}
