"use server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { db } from "../db"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"
import { encode } from "../helpers/jwt-helper"
import { cookies } from "next/headers"

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}


export async function GoogleLoginAction(idToken: string) {
  try {
    const decoded = await getAuth().verifyIdToken(idToken)
    const { email, name, uid, picture } = decoded

    let existing = await db.select().from(users).where(eq(users.email, email!)).limit(1)
    let user = existing[0]

    if (!user) {
      const newUuid = crypto.randomUUID()
      await db.insert(users).values({
        id: newUuid,
        name: name ?? "",
        email: email!,
        password: null,
        avatarUrl: picture ?? null,
        platform: "google"
      })
      user = { id: newUuid, name: name ?? "", email: email! } as typeof user
    }

    const sessionToken = encode({ id: user.id, name: user.name, email: user.email, avatar_url: user.avatarUrl }, 60 * 60 * 24 * 7)

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
    return { success: false, errors: { _form: ["Login gagal, coba lagi"] } }
  }
}