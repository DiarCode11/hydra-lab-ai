import { z } from "zod"

export const registerSchema = z
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