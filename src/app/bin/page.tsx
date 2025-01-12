'use client'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, ChevronDown, Copy } from 'lucide-react';
import { useBins } from '@/store/useBinStore';
import { Bin } from '@/types/bin';
import Link from 'next/link';
import { generateId } from '@/lib/utils';
import { useBinOperations, useFetchBins } from '@/service/binService';
import copy from 'clipboard-copy';
import { toast } from "sonner"



const BIN_INITIAL_STATE = {
    name: '', content: '', isMarkdown: false, uid: ''
};

export default function BinPage() {
    useFetchBins();
    const bins = useBins();
    const { addBin } = useBinOperations();
    const [showBins, setShowBins] = useState(true);
    const [bin, setBin] = useState<Partial<Bin>>(BIN_INITIAL_STATE);

    const handleSave = async () => {
        if (bin.content?.trim() && bin.name?.trim()) {
            const uid = generateId();
            addBin({ ...bin, uid, createdAt: new Date(), updatedAt: new Date() }).then(() => {
                setBin(BIN_INITIAL_STATE);
                // Show success message here
            }).catch(() => {
                // Show error message here
            });
        }
    };

    const handleShare = async (uid: string) => {
        const url = `${window.location.origin}/bin/${uid}`;
        await copy(url)
        toast('copied!')
    };

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
            <Card className="border-none shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-medium text-gray-800">Create New Bin</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={bin.name}
                            onChange={(e) => setBin(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Note title..."
                            className="w-full p-3 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-lg"
                        />
                        {!bin.name && (
                            <Plus className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                        )}
                    </div>

                    <Textarea
                        value={bin.content}
                        onChange={(e) => setBin(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Start writing your note here..."
                        className="min-h-[300px] p-4 border-0 bg-gray-50 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-base leading-relaxed"
                    />

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={!bin.name?.trim() || !bin.content?.trim()}
                            className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Note
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <button
                    onClick={() => setShowBins(!showBins)}
                    className="w-full flex items-center justify-between text-lg font-medium text-gray-800 mb-4"
                >
                    Your Notes
                    <ChevronDown className={`w-5 h-5 transform transition-transform duration-200 ${showBins ? 'rotate-180' : ''}`} />
                </button>

                {showBins && (
                    <div className="space-y-3">
                        {bins.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No notes yet. Create your first note above!</p>
                        ) : (
                            bins.map((bin, index) => (
                                <div key={bin.id ?? index + 1}
                                    className='flex justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 '>
                                    <Link
                                        href={`/bin/${bin.uid}`}
                                        key={bin.id ?? index + 1}
                                    >
                                        <h3 className="font-medium text-blue-600 mb-1">{bin.name}</h3>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {bin.content}
                                        </p>
                                    </Link>
                                    <Button size='icon' variant='outline' onClick={() => handleShare(bin.uid ?? '')} ><Copy size='16' /></Button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
