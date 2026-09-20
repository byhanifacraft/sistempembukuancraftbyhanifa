"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Server Action untuk memproses login pengguna via Supabase Auth
 */
export async function loginAction(formData: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const email = formData.email?.trim().toLowerCase();
  const password = formData.password;

  if (!email || !password) {
    return {
      success: false,
      error: "Email dan password wajib diisi.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.warn(`Gagal login untuk email: ${email}`, error?.message);
      return {
        success: false,
        error: "Email atau password salah. Silakan periksa kembali kredensial Anda.",
      };
    }

    const authUser = await getCurrentAuthUser();
    revalidatePath("/", "layout");

    return {
      success: true,
      user: authUser
        ? {
            id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            role: authUser.role,
          }
        : undefined,
    };
  } catch (err: any) {
    console.error("Error pada loginAction:", err);
    return {
      success: false,
      error: err.message || "Terjadi kesalahan pada sistem autentikasi.",
    };
  }
}

/**
 * Server Action untuk logout pengguna
 */
export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error pada logoutAction:", err);
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Server Action untuk membaca sesi aktif
 */
export async function getSessionUserAction() {
  return await getCurrentAuthUser();
}

export interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Server Action untuk pemulihan kata sandi akun Owner menggunakan PIN Rahasia
 */
export async function resetOwnerPasswordAction(formData: {
  email: string;
  recoveryPin: string;
  newPassword: string;
}): Promise<ResetPasswordResult> {
  const email = formData.email?.trim().toLowerCase();
  const pin = formData.recoveryPin?.trim();
  const newPassword = formData.newPassword;

  if (!email || !pin || !newPassword) {
    return {
      success: false,
      error: "Email, PIN Pemulihan, dan Kata Sandi Baru wajib diisi.",
    };
  }

  if (newPassword.length < 6) {
    return {
      success: false,
      error: "Kata sandi baru minimal harus 6 karakter.",
    };
  }

  const expectedPin = process.env.OWNER_RECOVERY_PIN || "992026";
  if (pin !== expectedPin) {
    return {
      success: false,
      error: "PIN Pemulihan Pemilik salah. Silakan periksa kembali kode rahasia Anda.",
    };
  }

  try {
    // Pastikan user terdaftar dan memiliki wewenang OWNER
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== "OWNER") {
      return {
        success: false,
        error: "Akun dengan email ini tidak ditemukan atau bukan merupakan akun Owner.",
      };
    }

    // Update password di tabel auth.users Supabase dengan bcrypt hash
    const hashRes: any = await prisma.$queryRaw`
      SELECT crypt(${newPassword}, gen_salt('bf', 10)) as hashed;
    `;
    const hashed = hashRes[0]?.hashed;

    if (!hashed) {
      return {
        success: false,
        error: "Gagal mengenkripsi kata sandi baru.",
      };
    }

    await prisma.$queryRaw`
      UPDATE auth.users 
      SET encrypted_password = ${hashed}, updated_at = NOW() 
      WHERE email = ${email};
    `;

    return {
      success: true,
      message: "Kata sandi Owner berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.",
    };
  } catch (err: any) {
    console.error("Error pada resetOwnerPasswordAction:", err);
    return {
      success: false,
      error: err.message || "Gagal memperbarui kata sandi.",
    };
  }
}

