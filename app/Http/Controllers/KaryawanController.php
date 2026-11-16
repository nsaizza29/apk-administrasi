<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;

class KaryawanController extends Controller
{
    public function getKaryawan()
    {
        $response = Http::withOptions([
            'verify' => false,
        ])
            ->withToken(config('services.gevano.token'))
            ->get(config('services.gevano.url').'/karyawan');

        if ($response->failed()) {
            return response()->json([
                'message' => 'Gagal mengambil data karyawan',
                'status' => $response->status(),
                'error' => $response->json(),
            ], $response->status());
        }

        return response()->json($response->json());
    }
}
