'use client'
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { useBinActions, useBins } from '@/store/useBinStore';
import { Bin } from '@prisma/client';
import Link from 'next/link';
import axios from 'axios';
import { generateId } from '@/lib/utils';
import { useUser } from '@/store/useExpenseStore';

const NotesInput = () => {
    const user = useUser()
    const [bin, setBin] = useState<Partial<Bin>>({ name: '', content: '' })
    const { addBin, updateBin, setBins } = useBinActions();
    const bins = useBins();

    const handleSave = async () => {
        if (bin.content?.trim() && bin.name?.trim()) {
            const uid = generateId()
            addBin({ ...bin, uid });
            setBin({
                name: '', content: '', uid: ''
            })

            axios.post('/api/bin', { ...bin, uid }).then(response => updateBin(uid, response.data.data.bin)).catch(err => console.log(err, 12323))

        }
    };

    useEffect(() => {
        const fetchBinData = async () => {
            const response = await axios.get('/api/bin', { params: { page: 1, limit: 10 } })
            setBins(response.data.data.bins)
        }
        fetchBinData()
    }, [])

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="pt-6">
                {user?.email}
                <div className="space-y-4">
                    <input
                        type="text"
                        value={bin.name}
                        onChange={(e) => setBin(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter bin name..."
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                    <Textarea
                        value={bin.content}
                        onChange={(e) => setBin(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your notes here..."
                        className="min-h-[400] resize-none focus-visible:ring-1 focus-visible:ring-offset-1 text-base"
                    />
                    <div className="flex items-center justify-end">

                        <Button
                            onClick={handleSave}
                            disabled={!bin.name?.trim() || !bin.content?.trim()}
                            className="px-4"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Bin
                        </Button>
                    </div>
                    <div className="mt-4">
                        <h2 className="text-lg font-semibold">Your Bins</h2>
                        <ul className="list-disc pl-5">
                            {bins.map((bin, index) => (
                                <li key={bin.id ?? index + 1} className="text-base text-gray-700">
                                    <Link href={`/bin/${bin.uid}`} className="text-blue-500 underline">
                                        {bin.name}
                                    </Link>:{bin.content}...
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default NotesInput;