'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Share2,
    Save,
    Clock,
    Check,
    Trash2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useBinActions, useBins } from '@/store/useBinStore';
import { Bin } from '@/types/bin';
import { format } from 'date-fns';
import copy from 'clipboard-copy';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// import { useBinOperations } from '@/service/binService';
import { useUser } from '@/store/useUserStore';
import { binApi } from '@/service/binService';
import { toast } from 'sonner';
import { TypographyMuted } from '@/components/Typography';

const BinEditor = () => {
    const user = useUser();
    const router = useRouter();
    const pathname = usePathname();
    // const { updateBin, deleteBin, fetchSingleBin } = useBinOperations();
    const { bins } = useBins()
    const { addBin, updateBin, removeBin } = useBinActions()

    const [bin, setBin] = useState<Bin>();
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    // const [isError, setIsError] = useState(false);

    useEffect(() => {
        const bin_uid = pathname.split('/').pop()
        if (!bin_uid) return
        const bin = bins.find(bin => bin.uid === bin_uid)
        if (bin) {
            setBin(bin)
            setIsLoading(false)
            return
        }

        binApi.fetchSingleBin(bin_uid)
            .then((bin) => {
                console.log(bin, 12313)
                setBin(bin)
                addBin(bin)
            }).catch(() => {
                router.back()
                toast('Something went wrong. Please try later')
                // return notFound()
            })
            .finally(() => setIsLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const handleUpdateBin = async () => {
        setSaving(true);
        if (bin?.uid && hasUnsavedChanges) {
            updateBin(bin.uid, { ...bin, updatedAt: new Date() })
            binApi.updateBin(bin).then((binResponse) => {
                updateBin(bin.uid, binResponse)
                setBin({ ...bin, updatedAt: new Date() })
                toast('Changes saved')
            }).catch(() => {
                toast('Something went wrong. Try again')
            }).finally(() => {
                setHasUnsavedChanges(false);
                setSaving(false);
            })
        }
        //     await updateBin(bin.uid, bin);
    };

    const handleDelete = async () => {
        if (bin?.uid) {
            removeBin(bin.uid)
            binApi.deleteBin(bin.uid).then(() => {
                router.push('/bin')
                toast('Deleted!')
            }).catch(() => {
                toast('Something went wrong. Try again')
            })
        }        // await deleteBin(bin_uid).then(() => router.back());
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/bin/${bin?.uid}`;
        await copy(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast('Link Copied!')
    };

    const handleBinChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>, key: string) => {
        setBin(prev => {
            if (!prev) return undefined;
            return { ...prev, [key]: e.target.value } as Bin;
        });
        setHasUnsavedChanges(true);
    };

    if (isLoading) {
        return (
            <div className="w-full h-[70vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!bin?.uid) return null;

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="w-3/5">
                        <Input
                            value={bin.name}
                            onChange={(e) => handleBinChange(e, 'name')}
                            className="text-xl font-medium border-0 bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            placeholder="Untitled Note"
                            disabled={user?.id !== bin.userId}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="transition-all duration-200 hover:bg-gray-100"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Share2 className="w-4 h-4" />
                            )}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild disabled={user?.id !== bin.userId}>
                                <Button variant="outline"><Trash2 /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        note and remove it from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">

                    {hasUnsavedChanges && (
                        <div className='m-0 p-0 flex justify-end'>
                            <TypographyMuted className='flex items-center' >
                                <AlertCircle size='16' className='mr-1' />
                                Unsaved changes
                            </TypographyMuted>
                        </div>
                    )}
                    <Textarea
                        value={bin.content}
                        onChange={(e) => handleBinChange(e, 'content')}
                        className="min-h-[400px] p-4 font-mono text-base leading-relaxed border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        placeholder="Start writing your content here..."
                        disabled={user?.id !== bin.userId}
                    />

                    <div className="flex items-center justify-between pt-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <TypographyMuted className="flex items-center  hover:text-gray-700 transition-colors duration-200">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {format(new Date(bin?.updatedAt ?? 0), 'MMMM d, yyyy h:mm a')}
                                    </TypographyMuted>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>Last updated</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>


                        <Button
                            onClick={handleUpdateBin}
                            className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                            disabled={saving || !hasUnsavedChanges || user?.id !== bin.userId}
                        >
                            {saving ? (
                                <span className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Saving...
                                </span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default BinEditor;