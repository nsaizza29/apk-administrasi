import { Head, Link, useForm } from '@inertiajs/react';
import { KeyRound, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { FlashMessages } from '@/components/flash-messages';
import { FieldError } from '@/components/form-field';
import { errorMessage } from '@/lib/errors';

interface LoginPageProps {
    email?: string;
}

const demoAccounts = [
    { role: 'Admin · Pembuat Dokumen', email: 'admin@surat.test' },
    { role: 'Pimpinan · Pemeriksa & Pengaju', email: 'pimpinan@surat.test' },
    { role: 'Staf · Pengaju Dokumen', email: 'staf@surat.test' },
];

export default function Login({ email: initialEmail }: LoginPageProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: initialEmail ?? '',
        password: '',
        remember: false as boolean,
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();
        post('/login');
    }

    return (
        <>
            <Head title="Masuk" />
            <Toaster position="top-right" richColors closeButton />
            <FlashMessages />

            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <div className="w-full max-w-md space-y-4">
                    <div className="space-y-1.5 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Mail className="size-6" />
                        </div>
                        <h1 className="text-xl font-semibold tracking-tight">SIA Surat</h1>
                        <p className="text-sm text-muted-foreground">
                            Sistem Administrasi Surat Menyurat
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Masuk ke akun Anda</CardTitle>
                            <CardDescription>
                                Gunakan email dan password yang terdaftar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                            placeholder="nama@contoh.com"
                                            className="pl-8"
                                            autoComplete="username"
                                            autoFocus
                                        />
                                    </div>
                                    <FieldError message={errorMessage(errors.email)} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <KeyRound className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(event) => setData('password', event.target.value)}
                                            placeholder="••••••••"
                                            className="pl-8"
                                            autoComplete="current-password"
                                        />
                                    </div>
                                    <FieldError message={errorMessage(errors.password)} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) => setData('remember', checked === true)}
                                    />
                                    <Label htmlFor="remember" className="text-sm font-normal">
                                        Ingat saya
                                    </Label>
                                </div>

                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing && <Loader2 className="animate-spin" />}
                                    Masuk
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed">
                        <CardHeader className="pb-2">
                            <CardDescription>Akun demo (password: password)</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-1.5">
                            {demoAccounts.map((account) => (
                                <button
                                    key={account.email}
                                    type="button"
                                    onClick={() => {
                                        setData('email', account.email);
                                        setData('password', 'password');
                                    }}
                                    className="flex items-center justify-between rounded-md border border-dashed px-3 py-1.5 text-left text-xs hover:bg-muted"
                                >
                                    <span className="font-medium">{account.role}</span>
                                    <span className="text-muted-foreground">{account.email}</span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-muted-foreground">
                        Lupa password? Hubungi administrator sistem.
                    </p>
                </div>
            </div>
        </>
    );
}
