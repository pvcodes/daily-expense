import { cn } from "@/lib/utils"
import React, { ReactNode } from "react"

const TypographyH1 = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"h1">
>(({ children, ...props }, ref) => {
    return (
        <h1
            ref={ref}
            {...props}
            className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            {children}
        </h1>
    )
})
TypographyH1.displayName = "TypographyH1"

const TypographyH3 = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"h1">
>(({ children, ...props }, ref) => {
    return (
        <h1
            ref={ref}
            {...props}
            className="scroll-m-20 text-2xl font-semibold tracking-tight">
            {children}
        </h1>
    )
})
TypographyH3.displayName = "TypographyH3"


const TypographyP = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"p">
>(({ children, className, ...props }, ref) => {
    return (
        <p
            ref={ref}
            {...props}
            className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}>
            {children}
        </p>
    )
})
TypographyP.displayName = "TypographyP"


const TypographyH4 = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"h4">
>(({ children, ...props }, ref) => {
    return (
        <h4
            ref={ref}
            {...props}
            className="scroll-m-20 text-xl font-semibold tracking-tight">
            {children}
        </h4>
    )
})
TypographyH4.displayName = "TypographyH4"


function TypographySmall({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <small className={cn("text-sm font-medium leading-none", className)}>{children}</small>
    )
}

function TypographyMuted({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <small className={cn("text-sm text-muted-foreground text-gray-500", className)}>{children}</small>
    )

}



export {
    TypographyH1,
    TypographyH3,
    TypographyH4,
    TypographyP,
    TypographySmall,
    TypographyMuted
}