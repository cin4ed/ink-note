import { cn } from "@/utils/cn"

export const Button = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    return (
        <button type="button" className={cn("bg-foreground text-background px-4 py-2 select-none", className)}>
            {children}
        </button>
    )
}