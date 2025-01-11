'use client'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Share2,
    Save,
    Clock,
    Check
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useBinActions, useBins } from '@/store/useBinStore';
import { Bin } from '@prisma/client';
import { format } from 'date-fns';
import axios from 'axios';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"


const BinEditor = () => {

    const pathname = usePathname();
    const bin_uid = pathname.split('/').pop()
    // const currBin = 
    const { updateBin } = useBinActions()

    const [bin, setBin] = useState<Partial<Bin>>(useBins().find(binS => bin_uid && binS.uid === bin_uid))

    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);

        updateBin(bin.uid, bin)

        axios.put('/api/bin', bin).then((response) => updateBin(bin.uid, { updatedAt: response.data.data.bin.updatedAt })).catch(err => console.log('hihi', 12))

        // Simulate API call
        // await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        // Add your actual save logic here
    };

    const handleDelete = async () => {
        // Add your delete logic here
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/bin/${bin.id}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between ">
                <Input
                    value={bin.name}
                    onChange={(e) => setBin(prev => ({ ...prev, name: e.target.value }))}
                    className="text-xl font-semibold w-3/5"
                />

                <div className="flex justify-end items-center">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="gap-2"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Share'}
                        </Button>

                        {/* <Button
                            variant="destructive"
                            size="sm"
                            // onClick={() => setShowDeleteDialog(true)}
                            className="gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button> */}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <Textarea
                    value={bin.content}
                    onChange={(e) => setBin(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[400px] font-mono text-base"
                    placeholder="Enter your content here..."
                />

                <div className="mt-4 flex justify-between">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger> <div className="flex items-center text-sm text-gray-500">
                                <Clock className="w-4 h-4 mr-2" />
                                {format(new Date(bin?.updatedAt ?? 0), 'MMMM d, yyyy h:mm a')}
                            </div></TooltipTrigger>
                            <TooltipContent side='right'>
                                <p>Last updated at</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>


                    <Button
                        onClick={handleSave}
                        className="gap-2"
                        disabled={saving}
                    >
                        {saving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>

    );
};

export default BinEditor;