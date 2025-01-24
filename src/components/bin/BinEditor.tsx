
'use client'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Save,
    Clock,
    Trash2,
    AlertCircle,
    CopyIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
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

import { TypographyMuted } from '@/components/Typography';
import { toast } from 'sonner';
import { ShareButton } from './ShareButton';


interface BinEditorProps {
    bin: Bin,
    isOwner: boolean
}
const BinEditor = ({ bin: initalBin, isOwner }: BinEditorProps) => {
    const router = useRouter()
    const [bin, setBin] = useState<Bin>(initalBin)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const handleDeleteBin = () => {
        fetch(`/api/bin?uid=${bin.uid}`, {
            method: 'DELETE',
        }).then((res) => {
            if (!res.ok) {
                toast('Failed to delete budget, Try again!')
                return
            }
            router.push('/bin')
        })
    }

    const handleUpdateBin = () => {

        setIsSaving(true);
        fetch("/api/bin", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bin),
        }).then((res) => {
            if (!res.ok) {
                toast('Failed to update budget, Try again!')
                return
            }
            setHasUnsavedChanges(false);
            router.refresh()
        }).finally(() => setIsSaving(false))

    }

    const handleChange = (field: keyof Bin, value: string) => {
        setBin((prev) => ({ ...prev, [field]: value }));
        setHasUnsavedChanges(true); // Set unsaved changes to true on any change
    }

    return (
        <Card className="lg:m-4">
            <CardHeader className='pb-3'>
                <CardTitle className="flex flex-row items-center justify-between">
                    <Input
                        type="text"
                        value={bin.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Bin title..."
                        className="mr-2 lg:w-3/5"
                        disabled={!isOwner}

                    />

                    <div className="flex items-center gap-3">

                        <ShareButton uid={bin.uid} />


                        <AlertDialog>
                            <AlertDialogTrigger asChild disabled={!isOwner}>
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
                                    <AlertDialogAction onClick={handleDeleteBin}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardTitle>
                <div className={`m-0 p-0 flex justify-end ${hasUnsavedChanges ? 'opacity-100' : 'opacity-0'}`}>
                    <TypographyMuted className='flex items-center text-xs' >
                        <AlertCircle size='12' className='mr-1' />
                        Unsaved changes
                    </TypographyMuted>
                </div>
            </CardHeader>

            <CardContent className='relative'>
                <Button
                    onClick={() => {
                        copy(bin.content);
                        toast('Content copied to clipboard!');
                    }}
                    variant='outline'
                    className="absolute top-2 right-8 z-10"
                >
                    <CopyIcon className="w-4 h-4" />
                </Button>
                <Textarea
                    value={bin.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="Start writing your note here..."
                    className="min-h-[500px] bg-gray-50"
                    disabled={!isOwner}
                />

                <div className="flex items-center justify-between pt-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <TypographyMuted className="flex items-center  text-xs hover:text-gray-700 transition-colors duration-200 lg:text-sm">
                                    <Clock className="w-3 mr-0.5 lg:w-4 lg:mr-2" />
                                    {format(new Date(bin?.updatedAt), 'MMMM d, yyyy h:mm a')}
                                </TypographyMuted>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Last updated</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>


                    <Button
                        onClick={handleUpdateBin}
                        disabled={!isOwner}
                    >
                        {isSaving ? (
                            <span className="flex items-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                <span className='text-xs'>Commiting...</span>
                            </span>
                        ) : (
                            <span className='flex items-center'>
                                <Save className="w-1 h-1 mr-1" />
                                <span className='text-xs'>Commit changes</span>
                            </span>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default BinEditor;