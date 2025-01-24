import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    BarChart3,
    FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { dateToString } from '@/lib/utils';
import { TabsContent } from '@radix-ui/react-tabs';
import { Badge } from '@/components/ui/badge';
import { getBudget } from '@/db/actions/expense';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBinsInPagination } from '@/db/actions/bin';
import DashboardSkeleton from './loading';

// id?: number;
// day: string;
// amount: number;
// userId?: number;
// remaining: number;

const BUDGET_INITIAL_STATE = {
    day: new Date().toISOString(),
    amount: NaN,
    remaining: NaN
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    const latestBudget = (await getBudget(dateToString(new Date().toISOString()), session?.user.id as number)) ?? BUDGET_INITIAL_STATE
    const { bins } = await getBinsInPagination(5, session?.user.id as number) ?? []

    const statsData = [
        {
            title: "Total Bins",
            value: bins?.length || 0,
            icon: <FileText className="h-4 w-4" />,
            color: "text-blue-600"
        },
        {
            title: "Markdown Bins",
            value: bins?.filter(bin => bin.isMarkdown).length || 0,
            icon: <BarChart3 className="h-4 w-4" />,
            color: "text-purple-600"
        },
        {
            title: "Text Bins",
            value: bins?.filter(bin => !bin.isMarkdown).length || 0,
            icon: <FileText className="h-4 w-4" />,
            color: "text-green-600"
        }
    ];




    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-gray-500">Welcome back! Here&apos;s your overview.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">

                    {/* Budget Card */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                    Today&apos;s Budget
                                </CardTitle>
                                <Link href={`/expense/${dateToString(latestBudget.day)}`}>
                                    <Button variant="outline" size="sm" disabled={isNaN(latestBudget.amount)}>
                                        View Details
                                    </Button>
                                </Link>
                            </div>
                            <div className="mt-2">
                                <CardDescription>
                                    {format(latestBudget?.day, 'MMMM d, yyyy')}
                                </CardDescription>
                                <div className="mt-2 text-3xl font-bold text-blue-600">
                                    {!isNaN(latestBudget.amount) && `₹${latestBudget.amount}`}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!isNaN(latestBudget.amount) ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium">Remaining</span>
                                        <div className="flex items-center gap-2">
                                            {latestBudget?.remaining > 0 ? (
                                                <ArrowUpCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <ArrowDownCircle className="h-5 w-5 text-red-500" />
                                            )}
                                            <span className={`text-lg font-semibold ${latestBudget.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ₹{Math.abs(latestBudget?.remaining).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-gray-500 mb-4">No budget set for today</p>
                                    <Button variant="outline" asChild>
                                        <Link href="/expense">Set Budget</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Bins Card */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className='flex items-center'> <FileText className='text-purple-700 mr-1' /> Recent Bins</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue='all'>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                                </TabsList>
                                <TabsContent value="all">
                                    <ScrollArea className="h-[200px] pt-2">

                                        {bins
                                            .filter(bin => !bin?.isMarkdown)
                                            .map((bin) => (
                                                <Link
                                                    href={`/bin/${bin.uid}`}
                                                    key={bin.id}
                                                    className="block"
                                                >
                                                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                                                        <div className="space-y-1">
                                                            <p className="font-medium line-clamp-1">{bin.name}</p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                {/* <span className={`px-2 py-0.5 rounded-full text-xs ${bin.isMarkdown ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}> */}
                                                                <Badge variant='secondary'>
                                                                    {bin.isMarkdown ? 'Markdown' : 'Text'}
                                                                </Badge>
                                                                {/* </span> */}
                                                                <span>•</span>
                                                                <span>{format(new Date(bin.createdAt), 'MMM d, h:mm a')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                    </ScrollArea>
                                </TabsContent>
                                <TabsContent value="markdown">
                                    <ScrollArea className="h-[200px] pt-2">
                                        {bins
                                            .filter(bin => bin?.isMarkdown)
                                            .map((bin) => (
                                                <Link
                                                    href={`/bin/${bin.uid}`}
                                                    key={bin.id}
                                                    className="block"
                                                >
                                                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                                                        <div className="space-y-1">
                                                            <p className="font-medium line-clamp-1">{bin.name}</p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <Badge variant='secondary'>
                                                                    {bin.isMarkdown ? 'Markdown' : 'Text'}
                                                                </Badge>
                                                                <span>•</span>
                                                                <span>{format(new Date(bin.createdAt), 'MMM d, h:mm a')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    {statsData.map((stat, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <span className={stat.color}>{stat.icon}</span>
                                    {stat.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

        </Suspense>
    );
}