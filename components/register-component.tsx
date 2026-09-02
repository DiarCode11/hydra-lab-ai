"use client"
import { useActionState, useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { RegisterAction, RegisterState } from "@/lib/actions/register" 
import { firebaseApp } from "@/lib/firebase/firebase"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { GoogleLoginAction } from "@/lib/actions/google-auth"

const initialState: RegisterState = { success: false }

interface RegisterComponentProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showTrigger?: boolean;
}

export default function RegisterComponent({
    open: controlledOpen,
    onOpenChange,
    showTrigger = true,
}: RegisterComponentProps) {
    const [state, formAction, isPending] = useActionState(RegisterAction, initialState)
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [googleError, setGoogleError] = useState<string | null>(null)
    const open = controlledOpen ?? uncontrolledOpen
    const setOpen = onOpenChange ?? setUncontrolledOpen
    
    useEffect(() => {
        console.log("state berubah:", state)
        if (state.success) {
            setOpen(false)
            window.location.reload()
        }
    }, [state.success])

    async function handleGoogleLogin() {
        setIsGoogleLoading(true)
        setGoogleError(null)
    
        try {
          const auth = getAuth(firebaseApp)
          const provider = new GoogleAuthProvider()
    
          const result = await signInWithPopup(auth, provider)
          const idToken = await result.user.getIdToken()
    
          const res = await GoogleLoginAction(idToken)
    
          if (res.success) {
            setOpen(false)
            window.location.reload()
          } else {
            setGoogleError("Login dengan Google gagal, coba lagi")
          }
        } catch (err) {
          console.error("Google login error:", err)
          setGoogleError("Login dengan Google gagal, coba lagi")
        } finally {
          setIsGoogleLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {showTrigger && (
                <DialogTrigger>
                    <div className="bg-neutral-200 text-black px-4 py-1 font-semibold rounded-md">
                        Daftar
                    </div>
                </DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Daftar Akun</DialogTitle>
                <form action={formAction}>
                    <div className="mt-4">
                    <Label className="mb-2">Nama</Label>
                    <Input type="text" name="name" />
                    {state.errors?.name && (
                        <p className="text-red-500 text-sm mt-1">{state.errors.name[0]}</p>
                    )}
                    </div>

                    <div className="mt-4">
                    <Label className="mb-2">Email</Label>
                    <Input type="email" name="email" />
                    {state.errors?.email && (
                        <p className="text-red-500 text-sm mt-1">{state.errors.email[0]}</p>
                    )}
                    </div>

                    <div className="mt-4">
                    <Label className="mb-2">Password</Label>
                    <Input type="password" name="password" />
                    {state.errors?.password && (
                        <p className="text-red-500 text-sm mt-1">{state.errors.password[0]}</p>
                    )}
                    </div>

                    <div className="my-6">
                    <Label className="mb-2">Konfirmasi Password</Label>
                    <Input type="password" name="confirmPassword" />
                    {state.errors?.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{state.errors.confirmPassword[0]}</p>
                    )}
                    </div>

                    {state.errors?._form && (
                    <p className="text-red-500 text-sm mb-3">{state.errors._form[0]}</p>
                    )}

                    <Button type="submit" disabled={isPending} className="w-full py-4 cursor-pointer">
                        {isPending ? "Memproses..." : "Masuk"}
                    </Button>

                    <p className="text-center text-sm py-3">Atau</p>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full py-4 cursor-pointer"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-google" viewBox="0 0 16 16">
                            <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z"/>
                        </svg>
                        {isGoogleLoading ? "Memproses..." : "Lanjutkan dengan Google"}
                    </Button>

                    {googleError && (
                        <p className="text-red-500 text-sm text-center mt-2">{googleError}</p>
                    )}
                </form>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}