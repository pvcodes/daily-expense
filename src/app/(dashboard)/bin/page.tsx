'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, ChevronDown, Copy } from 'lucide-react';
import { useBinActions, useBins } from '@/store/useBinStore';
import { Bin } from '@/types/bin';
import Link from 'next/link';
import { generateId } from '@/lib/utils';
import copy from 'clipboard-copy';
import { toast } from 'sonner';
import { useUser } from '@/store/useUserStore';
import { Input } from '@/components/ui/input';
import { binApi } from '@/service/binService';

const BIN_INITIAL_STATE = {
    name: '',
    content: '',
    isMarkdown: false,
    uid: generateId(),
    createdAt: new Date(0),
    updatedAt: new Date(0),

};

export default function BinPage() {
    const { bins } = useBins();
    const user = useUser();
    const { addBin, updateBin } = useBinActions()


    const [showBins, setShowBins] = useState(true);
    const [bin, setBin] = useState<Bin>(BIN_INITIAL_STATE);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async () => {
        if (bin.content?.trim() && bin.name?.trim()) {
            if (bin.uid) {
                setIsSaving(true);
                addBin(bin);
                binApi.addBin(bin)
                    .then((savedBin) => {
                        updateBin(savedBin.uid, savedBin);
                    })
                    .catch(() => {
                        toast.error('Failed to save the note.');
                    })
                    .finally(() => {
                        setIsSaving(false);
                        setBin({ ...BIN_INITIAL_STATE, uid: generateId() });
                    });
            } else {
                // Handle the case where uid is undefined
                toast.error('UID is undefined, cannot save the bin.');
            }

        }
    };

    const handleShare = async (uid: string) => {
        const url = `${window.location.origin}/bin/${uid}`;
        await copy(url);
        toast('Link copied to clipboard!');
    };

    const filteredBins = bins?.filter((bin) =>
        bin.name && bin?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto p-1 space-y-8 lg:p-6">
            {/* Create New Bin */}
            <Card className="border-none shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-medium text-gray-800">
                        Create New Note
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={bin.name}
                            onChange={(e) => setBin((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Note title..."
                            className="w-full p-3 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-lg"
                        />
                        {!bin.name && (
                            <Plus className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                        )}
                    </div>

                    <Textarea
                        value={bin.content}
                        onChange={(e) => setBin((prev) => ({ ...prev, content: e.target.value }))}
                        placeholder="Start writing your note here..."
                        className="min-h-[300px] p-4 border-0 bg-gray-50 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-base leading-relaxed"
                    />

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={!bin.name?.trim() || !bin.content?.trim() || isSaving}
                            className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                        >
                            {isSaving ? (
                                <span className="flex items-center">
                                    <Save className="w-4 h-4 mr-2 animate-spin" /> Saving...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <Save className="w-4 h-4 mr-2" /> Save Note
                                </span>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Notes List */}
            <div className="bg-white  rounded-lg shadow-lg p-3 lg:p-6">
                <div className="flex flex-col items-start justify-between mb-4 md:flex-row">
                    <button
                        onClick={() => setShowBins(!showBins)}
                        className="flex items-center text-lg font-medium text-gray-800"
                    >
                        Your Notes
                        <ChevronDown
                            className={`w-5 h-5 ml-2 transform transition-transform duration-200 ${showBins && 'rotate-180'}`}
                        />
                    </button>
                    <div className="relative">
                        <Input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search notes..."
                        />
                    </div>
                </div>

                {showBins && (
                    <div className="space-y-3">
                        {filteredBins?.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                No notes found. Create your first note above!
                            </p>
                        ) : (
                            filteredBins?.map((bin, index) =>
                                user?.id === bin.userId && (
                                    <div
                                        key={bin.id ?? index + 1}
                                        className="flex justify-between p-4 rounded-lg bg-gray-50  hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        <Link href={`/bin/${bin.uid}`}>
                                            <div>
                                                <h3 className="font-medium text-blue-600 mb-1">
                                                    {bin.name}
                                                </h3>
                                                <p className="text-gray-600 text-sm line-clamp-2">
                                                    {bin.content}
                                                </p>
                                            </div>
                                        </Link>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => handleShare(bin.uid ?? '')}
                                            className="text-gray-600"
                                        >
                                            <Copy size="16" />
                                        </Button>
                                    </div>
                                )
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
