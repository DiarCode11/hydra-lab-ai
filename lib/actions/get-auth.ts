"use server"

import { cookies } from "next/headers"
import { decode } from "../helpers/jwt-helper"

export async function GetSessionAction() {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (!token) {
        return { success: false, user: null }
    }

    const result = decode(token)

    if (!result.success) {
        return { success: false, user: null }
    }

    return { success: true, user: result.data }
}

export async function LogoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete("session")
    return { success: true }
}