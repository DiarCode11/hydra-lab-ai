"use server"

import { z } from "zod"
import { db } from "../db"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcrypt"
import { encode } from "../helpers/jwt-helper"
import { cookies } from "next/headers"

const loginSchema = z.object({
  email:z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

export type LoginState = {
  success: boolean
  errors?: {
    email?: string[]
    password?: string[]
    _form?: string[]
  }
}

export async function LoginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const parsed = loginSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const { email, password } = parsed.data

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const user = existing[0]

    if (!user) {
      return { success: false, errors: { _form: ["Email atau password salah"] } }
    }

    const isValid = await bcrypt.compare(password, user.password ?? '')

    if (!isValid) {
      return { success: false, errors: { _form: ["Email atau password salah"] } }
    }

    const sessionToken = encode(
      { id: user.id, name: user.name, email: user.email },
      60 * 60 * 24 * 7
    )

    const cookieStore = await cookies()
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return { success: true }
  } catch (err) {
    console.error("Login error:", err)
    return {
      success: false,
      errors: { _form: ["Terjadi kesalahan, coba lagi"] },
    }
  }
}