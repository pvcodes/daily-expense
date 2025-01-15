import { AddBinForm } from "@/components/bin/AddBinForm";
import { ShareButton } from "@/components/bin/ShareButton";
import { TypographyH4, TypographyMuted, TypographyP } from "@/components/Typography";
import { getBinsInPagination } from "@/db/actions/bin";
import { authOptions } from "@/lib/auth";
import Link from 'next/link';
import { getServerSession } from "next-auth";

export default async function BinPage() {
    const session = await getServerSession(authOptions)
    const { bins } = await getBinsInPagination(10, session?.user.id as number, 1)

    return (
        <div className="max-w-4xl mx-auto p-2 space-y-8 lg:p-6">
            <AddBinForm />


            {/* Bin List */}
            <div className="flex flex-col items-start justify-between md:flex-row">
                <TypographyH4>
                    Your Bins
                </TypographyH4>
            </div>
            <div className="space-y-3">
                {bins?.length === 0 ? (
                    <TypographyMuted >
                        No notes found. Create your first note above!
                    </TypographyMuted>
                ) : (
                    bins?.map((bin, index) => (
                        <Link href={`/bin/${bin.uid}`} key={bin.id ?? index + 1}>
                            <div className="flex items-center justify-between p-3 rounded-md bg-gray-100 hover:bg-gray-200 transition group mb-2">
                                <div className="w-full">
                                    <TypographyP className="font-medium">{bin.name}</TypographyP>
                                    <TypographyMuted className="text-sm line-clamp-1 break-all">
                                        {bin.content}
                                    </TypographyMuted>
                                </div>
                                <ShareButton
                                    uid={bin.uid}
                                    className="lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                />
                            </div>
                        </Link>

                    ))
                )}
            </div>
        </div >
    )
}