"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAuthUser } from "@/lib/auth";
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
