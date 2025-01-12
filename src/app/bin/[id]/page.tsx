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
    AlertCircle
} from 'lucide-react';
import { notFound, usePathname, useRouter } from 'next/navigation';
import { useBins } from '@/store/useBinStore';
import { Bin } from '@/types/bin';
import { format } from 'date-fns';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import copy from 'clipboard-copy';
import { useBinOperations } from '@/service/binService';
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


const BinEditor = () => {
    const router = useRouter()
    const pathname = usePathname();
    const bin_uid: string = pathname.split('/').pop() ?? '';
    const { updateBin, deleteBin } = useBinOperations();

    const [bin, setBin] = useState<Partial<Bin>>(useBins().find(binS => bin_uid && binS.uid === bin_uid) || {});
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    // const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleUpdateBin = async () => {
        setSaving(true);
        if (bin.uid) {
            await updateBin(bin.uid, bin);
            setHasUnsavedChanges(false);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        await deleteBin(bin_uid).then(() => router.back())
        // setShowDeleteDialog(false);
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/bin/${bin.uid}`;
        await copy(url)
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBin(prev => ({ ...prev, content: e.target.value }));
        setHasUnsavedChanges(true);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBin(prev => ({ ...prev, name: e.target.value }));
        setHasUnsavedChanges(true);
    };

    if (Object.keys(bin).length === 0) return notFound();

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="w-3/5">
                        <Input
                            value={bin.name}
                            onChange={handleTitleChange}
                            className="text-xl font-medium border-0 bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            placeholder="Untitled Note"
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
                            <AlertDialogTrigger asChild>
                                <Button variant="outline"><Trash2 /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data from our servers.
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
                    <Textarea
                        value={bin.content}
                        onChange={handleContentChange}
                        className="min-h-[400px] p-4 font-mono text-base leading-relaxed border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        placeholder="Start writing your content here..."
                    />

                    <div className="flex items-center justify-between pt-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {format(new Date(bin?.updatedAt ?? 0), 'MMMM d, yyyy h:mm a')}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>Last updated</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {hasUnsavedChanges && (
                            <span className="text-amber-600 text-sm flex items-center mr-3">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Unsaved changes
                            </span>
                        )}

                        <Button
                            onClick={handleUpdateBin}
                            className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                            disabled={saving || !hasUnsavedChanges}
                        >
                            {saving ? (
                                <span className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Saving...
                                </span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};

export default BinEditor;