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

export async function getSessionUserId() {
    const session = await GetSessionAction()

    if (!session.user || typeof session.user === "string") {
        return null
    }

    return typeof session.user.id === "string" ? session.user.id : null
}

export async function LogoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete("session")
    return { success: true }
}