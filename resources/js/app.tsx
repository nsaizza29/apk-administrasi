import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import type { ResolvedComponent } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent<ResolvedComponent>(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx') as Record<string, () => Promise<ResolvedComponent>>,
        ),
    setup({ App, el, props }) {
        if (!el) {
            return;
        }

        return createRoot(el).render(
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                <TooltipProvider delayDuration={0}>
                    <App {...props} />
                </TooltipProvider>
            </ThemeProvider>,
        );
    },
});
