import HomeLayout from "@/app/(main)/layout"

interface ChatInterface {
    children: React.ReactNode
}

export default function ChatLayout({ children } : ChatInterface) {
    return <HomeLayout>{children}</HomeLayout>
}