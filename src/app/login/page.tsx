"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/actions/auth.actions";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await loginAction({ email, password });
      if (!result.success) {
        setErrorMessage(result.error || "Gagal masuk. Silakan cek data Anda.");
        setLoading(false);
      } else {
        router.push(redirectedFrom);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan pada server.");
      setLoading(false);
    }
  };

  const handleQuickFill = (role: "owner" | "karyawan") => {
    setErrorMessage("");
    if (role === "owner") {
      setEmail("owner@craftbyhanifa.com");
      setPassword("OwnerHanifa2026!");
    } else {
      setEmail("karyawan@craftbyhanifa.com");
      setPassword("KaryawanHanifa2026!");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FFF0F4] via-[#FCF8FA] to-[#FCEBF1] flex flex-col justify-center items-center p-4 md:p-8">
      {/* Container Box */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-pink-900/5 border border-[#F2DBE3] overflow-hidden">
        {/* Header Visual */}
        <div className="bg-gradient-to-r from-[#9B2C54] to-[#E0688A] p-6 text-center text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-pink-300/20 rounded-full blur-lg pointer-events-none" />

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 shadow-inner mb-3 p-2">
            <Image
              src="/logo.png"
              alt="CraftByHanifa Logo"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-xl font-bold tracking-tight">CraftByHanifa</h1>
          <p className="text-xs text-pink-100/90 mt-1 font-medium">
            Sistem Pembukuan & Manajemen HPP Kerajinan
          </p>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Greeting */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-[#231C20]">Selamat Datang Kembali</h2>
            <p className="text-xs text-[#75656B]">
              Silakan masukkan kredensial untuk mengakses sistem pembukuan
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A3B41]">
                Email Pengguna
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#75656B]">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@craftbyhanifa.com"
                  className="pl-9 text-xs h-10 border-[#F2DBE3] focus:border-[#E0688A] focus:ring-[#E0688A]"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#4A3B41]">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#75656B]">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="pl-9 pr-10 text-xs h-10 border-[#F2DBE3] focus:border-[#E0688A] focus:ring-[#E0688A]"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#75656B] hover:text-[#231C20] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#E0688A] to-[#E87A9B] hover:from-[#D45679] hover:to-[#E0688A] text-white font-semibold text-xs shadow-md shadow-pink-500/20 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Sesi...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Dashboard</span>
                </div>
              )}
            </Button>
          </form>

          {/* Quick Role Fill Section for Testing & Verification */}
          <div className="pt-2 border-t border-[#F2DBE3] space-y-2.5">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#9B2C54]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Akses Cepat Pengujian Role:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("owner")}
                className="p-2.5 bg-[#FFF0F4] hover:bg-[#FFE4EC] border border-[#F2DBE3] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#9B2C54]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E0688A]" />
                  <span>Akun Owner</span>
                </div>
                <p className="text-[10px] text-[#75656B] mt-0.5 truncate">
                  owner@craftbyhanifa.com
                </p>
                <span className="inline-block mt-1 text-[9px] font-semibold text-[#9B2C54] bg-white px-1.5 py-0.5 rounded border border-[#F2DBE3]">
                  Akses Penuh
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("karyawan")}
                className="p-2.5 bg-[#F8F9FA] hover:bg-[#F0F2F5] border border-stone-200 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-800">
                  <UserCheck className="w-3.5 h-3.5 text-stone-600" />
                  <span>Akun Karyawan</span>
                </div>
                <p className="text-[10px] text-[#75656B] mt-0.5 truncate">
                  karyawan@craftbyhanifa.com
                </p>
                <span className="inline-block mt-1 text-[9px] font-semibold text-stone-600 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                  Kasir & Stok
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#FFF5F8]/70 border-t border-[#F2DBE3] text-center text-[10px] text-[#75656B]">
          Sistem Pembukuan UMKM CraftByHanifa &bull; Magetan, Jawa Timur
        </div>
      </div>
    </div>
  );
}
