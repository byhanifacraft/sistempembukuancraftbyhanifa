"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loginAction,
  quickLoginAction,
  resetOwnerPasswordAction,
} from "@/actions/auth.actions";
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
  KeyRound,
  CheckCircle2,
  X,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/";

  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState<"OWNER" | "STAFF" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Recovery modal states
  const [showRecoveryModal, setShowRecoveryModal] = useState(
    searchParams.get("recovery") === "true"
  );
  const [recoveryEmail, setRecoveryEmail] = useState(
    searchParams.get("email") || "owner@craftbyhanifa.com"
  );
  const [recoveryPin, setRecoveryPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await loginAction({ email, password });
      if (!result.success) {
        setErrorMessage(result.error || "Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.");
        setLoading(false);
      } else {
        router.push(redirectedFrom);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan pada server saat memproses login.");
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: "OWNER" | "STAFF") => {
    setErrorMessage("");
    setQuickLoadingRole(role);
    setLoading(true);

    if (role === "OWNER") {
      setEmail("owner@craftbyhanifa.com");
      setPassword("OwnerHanifa2026!");
    } else {
      setEmail("karyawan@craftbyhanifa.com");
      setPassword("KaryawanHanifa2026!");
    }

    try {
      const result = await quickLoginAction(role);
      if (!result.success) {
        setErrorMessage(result.error || "Gagal masuk menggunakan akses cepat.");
        setLoading(false);
        setQuickLoadingRole(null);
      } else {
        router.push(redirectedFrom);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses login cepat.");
      setLoading(false);
      setQuickLoadingRole(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoverySuccess("");

    if (newPassword !== confirmPassword) {
      setRecoveryError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setRecoveryError("Kata sandi baru minimal harus 6 karakter.");
      return;
    }

    setRecoveryLoading(true);

    try {
      const result = await resetOwnerPasswordAction({
        email: recoveryEmail,
        recoveryPin,
        newPassword,
      });

      if (!result.success) {
        setRecoveryError(result.error || "Gagal memperbarui kata sandi.");
        setRecoveryLoading(false);
      } else {
        setRecoverySuccess(result.message || "Kata sandi berhasil diperbarui!");
        setRecoveryLoading(false);
        // Pre-fill email di form login
        setEmail(recoveryEmail);
        setPassword("");
        // Bersihkan form pemulihan
        setRecoveryPin("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setRecoveryError(err.message || "Terjadi kesalahan saat mereset kata sandi.");
      setRecoveryLoading(false);
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
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setRecoveryError("");
                    setRecoverySuccess("");
                    setRecoveryEmail(email || "owner@craftbyhanifa.com");
                    setShowRecoveryModal(true);
                  }}
                  className="text-[11px] font-semibold text-[#E0688A] hover:text-[#9B2C54] hover:underline cursor-pointer transition-colors"
                >
                  Lupa kata sandi?
                </button>
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
              {loading && !quickLoadingRole ? (
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

          {/* Opsi Login Cepat (Simple & Sesuai Desain Pembukuan) */}
          <div className="pt-4 border-t border-[#F2DBE3] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#75656B] uppercase tracking-wider">
                Login Cepat (1-Klik)
              </span>
              <span className="text-[10px] text-[#9B2C54] font-medium">
                Pilih Peran Akun
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Quick Login Owner */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("OWNER")}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF5F8]/80 hover:bg-[#FFF0F4] border border-[#F2DBE3] hover:border-[#E0688A] text-left transition-all cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-[#9B2C54] border border-pink-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {quickLoadingRole === "OWNER" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9B2C54]" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#E0688A]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1">
                      <p className="text-xs font-bold text-[#231C20] truncate group-hover:text-[#9B2C54] transition-colors">
                        Owner
                      </p>
                    </div>
                    <p className="text-[10px] text-[#75656B] truncate">
                      Akses Penuh
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#75656B] group-hover:text-[#E0688A] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Quick Login Karyawan */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("STAFF")}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF5F8]/80 hover:bg-emerald-50/70 border border-[#F2DBE3] hover:border-emerald-300 text-left transition-all cursor-pointer group disabled:opacity-60"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {quickLoadingRole === "STAFF" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1">
                      <p className="text-xs font-bold text-[#231C20] truncate group-hover:text-emerald-800 transition-colors">
                        Karyawan
                      </p>
                    </div>
                    <p className="text-[10px] text-[#75656B] truncate">
                      Kasir & Stok
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#75656B] group-hover:text-emerald-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Info note */}
          <div className="pt-3 border-t border-[#F2DBE3] flex items-center justify-center space-x-1.5 text-[11px] text-[#75656B]">
            <HelpCircle className="w-3.5 h-3.5 text-[#E0688A] shrink-0" />
            <span>Karyawan lupa sandi? Hubungi Owner untuk reset akun.</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#FFF5F8]/70 border-t border-[#F2DBE3] text-center text-[10px] text-[#75656B]">
          Sistem Pembukuan UMKM CraftByHanifa &bull; Magetan, Jawa Timur
        </div>
      </div>

      {/* MODAL PEMULIHAN KATA SANDI OWNER */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#F2DBE3] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#FFF0F4] p-5 border-b border-[#F2DBE3] flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#F2DBE3] flex items-center justify-center text-[#E0688A] shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#231C20]">
                    Pemulihan Kata Sandi Owner
                  </h3>
                  <p className="text-[11px] text-[#75656B] mt-0.5">
                    Gunakan PIN Rahasia Pemilik untuk membuat sandi baru
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="text-[#75656B] hover:text-[#231C20] p-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 md:p-6 space-y-4">
              {recoveryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>{recoveryError}</div>
                </div>
              )}

              {recoverySuccess ? (
                <div className="space-y-4 text-center py-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">
                      Kata Sandi Berhasil Diperbarui!
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {recoverySuccess}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Kembali ke Halaman Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#4A3B41]">
                      Email Akun Owner *
                    </label>
                    <Input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="owner@craftbyhanifa.com"
                      className="text-xs h-9 border-[#F2DBE3]"
                      disabled={recoveryLoading}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#4A3B41]">
                        PIN Pemulihan Pemilik (Master PIN) *
                      </label>
                      <span className="text-[10px] text-[#75656B]">Kode Rahasia</span>
                    </div>
                    <Input
                      type="password"
                      required
                      maxLength={12}
                      value={recoveryPin}
                      onChange={(e) => setRecoveryPin(e.target.value)}
                      placeholder="Masukkan PIN Pemulihan"
                      className="text-xs h-9 border-[#F2DBE3]"
                      disabled={recoveryLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4A3B41]">
                        Kata Sandi Baru *
                      </label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 karakter"
                          className="text-xs h-9 pr-8 border-[#F2DBE3]"
                          disabled={recoveryLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#75656B] hover:text-[#231C20] cursor-pointer"
                          tabIndex={-1}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4A3B41]">
                        Ulangi Sandi Baru *
                      </label>
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Konfirmasi"
                        className="text-xs h-9 border-[#F2DBE3]"
                        disabled={recoveryLoading}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#FFF0F4] rounded-xl border border-[#F2DBE3] text-[10px] text-[#9B2C54] leading-relaxed flex items-start space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#E0688A]" />
                    <span>
                      Fitur ini khusus untuk Pemilik (Owner). Jangan beritahukan PIN Pemulihan Rahasia kepada pihak manapun.
                    </span>
                  </div>

                  <div className="pt-2 flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRecoveryModal(false)}
                      disabled={recoveryLoading}
                      className="flex-1 h-9 text-xs border-stone-200 cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={recoveryLoading}
                      className="flex-1 h-9 bg-gradient-to-r from-[#E0688A] to-[#E87A9B] hover:from-[#D45679] hover:to-[#E0688A] text-white text-xs font-semibold cursor-pointer"
                    >
                      {recoveryLoading ? (
                        <div className="flex items-center space-x-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        <span>Simpan Sandi Baru</span>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
