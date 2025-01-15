import BinEditor from "@/components/bin/BinEditor";
import { getBin } from "@/db/actions/bin";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export default async function SingleBinPage({ params }: {
    params: Promise<{ uid: string }>
}) {
    const { uid } = await params
    const session = await getServerSession(authOptions)

    const bin = await getBin(uid)
    const isOwner = bin?.userId === session?.user.id

    if (!bin) return notFound()

    return (
        <BinEditor bin={bin} isOwner={isOwner} />
    )

}
