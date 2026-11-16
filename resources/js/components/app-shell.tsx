import * as React from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { FlashMessages } from '@/components/flash-messages';

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <>
            <Toaster position="top-right" richColors closeButton />
            <FlashMessages />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="min-w-0">
                    <AppHeader title={title} />
                    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
