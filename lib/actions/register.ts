"use server"

import { z } from "zod"
import { db } from "../db"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcrypt"
import { encode } from "../helpers/jwt-helper"
import { cookies } from "next/headers"

const registerSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi").min(3, "Nama minimal 3 karakter"),
    email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
    password: z.string().min(1, "Password wajib diisi").min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"], // error ditempel ke field ini
  })

export type RegisterState = {
  success: boolean
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
    confirmPassword?: string[]
    _form?: string[]
  }
}

export async function RegisterAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }

  const parsed = registerSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const { name, email, password } = parsed.data

  try {
    const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

    if (existing.length > 0) {
        return {success: false, errors: { email: ["Email sudah terdaftar"] }}
    }

    const saltRound = 10
    const hashedPassword = await bcrypt.hash(password, saltRound)
    const uuid = crypto.randomUUID()
    await db.insert(users).values({
        id: uuid,
        name: name,
        email: email,
        password: hashedPassword
    })

    const sessionToken = encode(
        {id: uuid, name, email},
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
    return {
      success: false,
      errors: { _form: [`Terjadi kesalahan: ${err}`] },
    }
  }
}