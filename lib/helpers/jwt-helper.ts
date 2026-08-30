import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken"

export function encode(payload: object, expiresIn: number) {
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET!,
        { expiresIn: expiresIn }
    )

    return token
}


type DecodeResult =
  | { success: true; data: jwt.JwtPayload | string }
  | { success: false; error: "expired" | "invalid" | "unknown" }

export function decode(token: string): DecodeResult {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)
        return { success: true, data: decoded }
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            return { success: false, error: "expired" }
        }
        if (err instanceof JsonWebTokenError) {
            return { success: false, error: "invalid" }
        }
        return { success: false, error: "unknown" }
    }
}