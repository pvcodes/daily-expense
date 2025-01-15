'use client'
import { Plus, Save } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useState } from "react";
import { Bin } from "@/types/bin";
import { generateId } from "@/lib/utils";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "../ui/input";
import { TypographyMuted } from "../Typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


const BIN_INITIAL_STATE = {
    name: '',
    content: '',
    isMarkdown: false,
    uid: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),

};

export function AddBinForm() {
    const router = useRouter()

    const [bin, setBin] = useState<Bin>(BIN_INITIAL_STATE);
    const [isSaving, setIsSaving] = useState(false);
    const [accordianTab, setAccordianTab] = useState('')

    const handleSave = async () => {
        if (bin.content?.trim() && bin.name?.trim()) {
            setIsSaving(true);

            fetch("/api/bin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bin),
            }).then((res) => {
                if (!res.ok) {
                    toast('Failed to add bin, Try again!')
                    return
                }
                router.refresh()
                setAccordianTab('')

                setBin({ ...BIN_INITIAL_STATE, uid: generateId() })
            }).finally(() => setIsSaving(false))

            router.refresh()
        }
    };

    return (
        <Accordion type='single' collapsible value={accordianTab}>
            <AccordionItem value="bin">
                <AccordionTrigger ExpandIcon={Plus} onClick={() => setAccordianTab(prev => prev === '' ? 'bin' : '')}>
                    Add bin here
                </AccordionTrigger>
                <AccordionContent >

                    <div>
                        <Tabs defaultValue='text'>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="text">Text</TabsTrigger>
                                <TabsTrigger value="markdown">Markdown</TabsTrigger>
                            </TabsList>
                            <TabsContent value="text">
                                <Card className="shadow-lg">
                                    <CardContent className="space-y-6 mt-4">
                                        <div className="flex items-center justify-between">
                                            <Input
                                                type="text"
                                                value={bin.name}
                                                onChange={(e) => setBin((prev) => ({ ...prev, name: e.target.value }))}
                                                placeholder="Note title..."
                                                className="w-3/5"
                                            />
                                            <Button
                                                onClick={handleSave}
                                                disabled={!bin.name?.trim() || !bin.content?.trim() || isSaving}
                                            >
                                                <Save className="w-4 h-4 lg:mr-2" />
                                                <span className="hidden sm:block">
                                                    {isSaving ? 'Saving...' : 'Save'}
                                                </span>
                                            </Button>
                                        </div>

                                        <Textarea
                                            value={bin.content}
                                            onChange={(e) => setBin((prev) => ({ ...prev, content: e.target.value }))}
                                            placeholder="Start writing your note here..."
                                            className="min-h-[500px] bg-gray-50"
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="markdown">
                                <Card>
                                    <CardContent className="min-h-[500px] flex justify-center items-center">
                                        <TypographyMuted>Coming Soon....</TypographyMuted>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                </AccordionContent>
            </AccordionItem>
        </Accordion >
    )
}