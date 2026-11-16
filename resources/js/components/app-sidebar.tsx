import * as React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Archive, Bell, ClipboardList, FileSignature, FileText, Inbox, LayoutDashboard, Mail, Send, Settings, Tags, Users } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import type { SharedProps } from '@/types';

interface NavItem {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: string[];
}

const groups: { label: string; items: NavItem[] }[] = [
    {
        label: 'Utama',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
            { title: 'Notifikasi', url: '/notifications', icon: Bell },
        ],
    },
    {
        label: 'Surat Menyurat',
        items: [
            { title: 'Pengajuan Dokumen', url: '/pengajuan', icon: ClipboardList },
            { title: 'Surat Masuk', url: '/surat-masuk', icon: Inbox },
            { title: 'Surat Keluar', url: '/surat-keluar', icon: Send },
            { title: 'Disposisi', url: '/disposisi', icon: FileSignature },
            { title: 'Arsip Surat', url: '/arsip', icon: Archive },
        ],
    },
    {
        label: 'Pengaturan',
        items: [
            { title: 'Klasifikasi', url: '/klasifikasi', icon: Tags },
            { title: 'Template Surat', url: '/template-surat', icon: FileText, roles: ['admin'] },
            { title: 'Pengaturan Surat', url: '/pengaturan', icon: Settings, roles: ['admin'] },
            { title: 'Pengguna', url: '/users', icon: Users, roles: ['admin'] },
        ],
    },
];

export function AppSidebar() {
    const { url, props } = usePage<SharedProps>();
    const current = url.split('?')[0];
    const role = props.auth.user?.role;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <Link href="/dashboard" className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:justify-center">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Mail className="size-4" />
                    </div>
                    <div className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate text-sm font-semibold">SIA Surat</span>
                        <span className="truncate text-xs text-muted-foreground">
                            {props.auth.user?.unit_name ?? 'Administrasi Surat'}
                        </span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => {
                    const items = group.items.filter((item) =>
                        !item.roles || (role && item.roles.includes(role)),
                    );

                    if (items.length === 0) {
                        return null;
                    }

                    return (
                        <SidebarGroup key={group.label}>
                            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {items.map((item) => {
                                        const isActive =
                                            item.url === '/dashboard' ? current === item.url : current.startsWith(item.url);

                                        return (
                                            <SidebarMenuItem key={item.url}>
                                                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                                                    <Link href={item.url}>
                                                        <item.icon />
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    );
                })}
            </SidebarContent>

            <SidebarFooter>
                <p className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                    v1.0.0 · Sistem Administrasi Surat
                </p>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
