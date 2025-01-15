import Link from "next/link"
import { TypographyP } from "@/components/Typography"
import { SidebarTrigger } from "./ui/sidebar"
import { APP_NAME } from "@/constant"

export default function AppNavbar() {

    return (
        <>
            <div className="flex justify-between items-center border-b p-2">
                <Link href='/'>
                    <TypographyP className="font-bold lg:text-2xl">{APP_NAME}</TypographyP>
                </Link>
                <SidebarTrigger />
            </div >
        </>
    )
}