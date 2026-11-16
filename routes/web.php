<?php

use App\Http\Controllers\ArsipController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DisposisiController;
use App\Http\Controllers\KaryawanController;
use App\Http\Controllers\KlasifikasiController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PengajuanSuratController;
use App\Http\Controllers\PengaturanController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\SuratKeluarController;
use App\Http\Controllers\SuratMasukController;
use App\Http\Controllers\TemplateSuratController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard');

Route::get('/login', [SessionController::class, 'create'])->name('login')->middleware('guest');
Route::post('/login', [SessionController::class, 'store'])->middleware('guest');
Route::post('/logout', [SessionController::class, 'destroy'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/karyawan', [KaryawanController::class, 'getKaryawan']);
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.readAll');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');

    // Semua role dapat melihat surat masuk, tetapi pencatatan/ubah data hanya admin.
    // Route admin didahulukan agar /surat-masuk/create tidak tertangkap route show.
    Route::middleware('role:admin')->group(function () {
        Route::get('/surat-masuk/create', [SuratMasukController::class, 'create'])->name('surat-masuk.create');
        Route::post('/surat-masuk', [SuratMasukController::class, 'store'])->name('surat-masuk.store');
        Route::get('/surat-masuk/{surat}/edit', [SuratMasukController::class, 'edit'])->name('surat-masuk.edit');
        Route::put('/surat-masuk/{surat}', [SuratMasukController::class, 'update'])->name('surat-masuk.update');
        Route::delete('/surat-masuk/{surat}', [SuratMasukController::class, 'destroy'])->name('surat-masuk.destroy');
    });
    Route::resource('surat-masuk', SuratMasukController::class)
        ->parameters(['surat-masuk' => 'surat'])
        ->except(['create', 'store', 'edit', 'update', 'destroy']);

    // Surat keluar dibuat oleh admin; staf/pimpinan mengajukan lewat menu Pengajuan.
    Route::middleware('role:admin')->group(function () {
        Route::get('/surat-keluar/create', [SuratKeluarController::class, 'create'])->name('surat-keluar.create');
        Route::post('/surat-keluar', [SuratKeluarController::class, 'store'])->name('surat-keluar.store');
        Route::get('/surat-keluar/{surat}/edit', [SuratKeluarController::class, 'edit'])->name('surat-keluar.edit');
        Route::put('/surat-keluar/{surat}', [SuratKeluarController::class, 'update'])->name('surat-keluar.update');
        Route::delete('/surat-keluar/{surat}', [SuratKeluarController::class, 'destroy'])->name('surat-keluar.destroy');
    });
    Route::get('/surat-keluar/{surat}/cetak', [SuratKeluarController::class, 'cetak'])->name('surat-keluar.cetak');
    Route::resource('surat-keluar', SuratKeluarController::class)
        ->parameters(['surat-keluar' => 'surat'])
        ->except(['create', 'store', 'edit', 'update', 'destroy']);

    // Pengaju dapat mengelola pengajuan miliknya yang masih dapat diedit; surat resmi tetap admin-only.
    // Admin membuat dokumen, sedangkan pimpinan memeriksa pengajuan.
    Route::resource('pengajuan', PengajuanSuratController::class)
        ->parameters(['pengajuan' => 'pengajuan']);
    Route::post('/pengajuan/{pengajuan}/dokumen', [PengajuanSuratController::class, 'storeDocument'])
        ->name('pengajuan.dokumen')
        ->middleware('role:admin');
    Route::post('/pengajuan/{pengajuan}/periksa', [PengajuanSuratController::class, 'review'])
        ->name('pengajuan.periksa')
        ->middleware('role:pimpinan');
    Route::post('/pengajuan/{pengajuan}/selesai', [PengajuanSuratController::class, 'finalize'])
        ->name('pengajuan.selesai')
        ->middleware('role:admin');

    Route::get('/disposisi', [DisposisiController::class, 'index'])->name('disposisi.index');
    Route::post('/disposisi', [DisposisiController::class, 'store'])
        ->name('disposisi.store')
        ->middleware('role:pimpinan,admin');
    Route::patch('/disposisi/{disposisi}', [DisposisiController::class, 'update'])->name('disposisi.update');
    Route::delete('/disposisi/{disposisi}', [DisposisiController::class, 'destroy'])->name('disposisi.destroy');

    Route::get('/arsip', [ArsipController::class, 'index'])->name('arsip.index');
    Route::patch('/arsip/{jenis}/{id}', [ArsipController::class, 'toggle'])
        ->name('arsip.toggle')
        ->middleware('role:admin');

    Route::get('/klasifikasi', [KlasifikasiController::class, 'index'])->name('klasifikasi.index');
    Route::middleware('role:admin')->group(function () {
        Route::post('/klasifikasi', [KlasifikasiController::class, 'store'])->name('klasifikasi.store');
        Route::put('/klasifikasi/{klasifikasi}', [KlasifikasiController::class, 'update'])->name('klasifikasi.update');
        Route::delete('/klasifikasi/{klasifikasi}', [KlasifikasiController::class, 'destroy'])->name('klasifikasi.destroy');
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/template-surat', [TemplateSuratController::class, 'index'])->name('template-surat.index');
        Route::post('/template-surat', [TemplateSuratController::class, 'store'])->name('template-surat.store');
        Route::put('/template-surat/{templateSurat}', [TemplateSuratController::class, 'update'])->name('template-surat.update');
        Route::delete('/template-surat/{templateSurat}', [TemplateSuratController::class, 'destroy'])->name('template-surat.destroy');

        Route::get('/pengaturan', [PengaturanController::class, 'edit'])->name('pengaturan.edit');
        Route::put('/pengaturan', [PengaturanController::class, 'update'])->name('pengaturan.update');
    });

    Route::resource('users', UserController::class)
        ->except(['show'])
        ->middleware('role:admin');

});
