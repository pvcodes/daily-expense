'use client'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    Trash2,
    ArrowUpCircle,
    ArrowDownCircle,
    Calendar,
    BarChart3,
    FileText,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useBudgets } from '@/store/useExpenseStore';
import { useBins } from '@/store/useBinStore';
import Link from 'next/link';
import { dateToString } from '@/lib/utils';

export default function DashboardPage() {
    const [view, setView] = useState('all');
    const { budgets, isLoading, isError } = useBudgets();
    const latestBudget = budgets?.[0];
    const { bins } = useBins();
    const recentBins = bins?.slice(0, 5) || [];

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-gray-600">Failed to load dashboard data</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
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
                            {Object.keys(latestBudget).length > 0 && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/expense/${dateToString(latestBudget.day)}`}>
                                        View Details
                                    </Link>
                                </Button>
                            )}
                        </div>
                        {Object.keys(latestBudget).length > 0 && (
                            <div className="mt-2">
                                <CardDescription>
                                    {format(new Date(latestBudget?.day ?? 0), 'MMMM d, yyyy')}
                                </CardDescription>
                                <div className="mt-2 text-3xl font-bold text-blue-600">
                                    ₹{latestBudget?.amount?.toLocaleString()}
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {Object.keys(latestBudget).length ? (
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
                                    <Link href="/expense/new">Set Budget</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Bins Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-purple-500" />
                                Recent Bins
                            </CardTitle>
                            <Tabs value={view} onValueChange={setView} className="w-[200px]">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[250px] pr-4">
                            {recentBins.length > 0 ? (
                                <div className="space-y-3">
                                    {recentBins
                                        .filter(bin => view === 'all' || (view === 'markdown' && bin.isMarkdown))
                                        .map((bin) => (
                                            <Link
                                                href={`/bin${bin.uid}`}
                                                key={bin.id}
                                                className="block"
                                            >
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                                    <div className="space-y-1">
                                                        <p className="font-medium line-clamp-1">{bin.name}</p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs ${bin.isMarkdown ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {bin.isMarkdown ? 'Markdown' : 'Text'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{format(new Date(bin.createdAt), 'MMM d, h:mm a')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[200px] gap-2">
                                    <Trash2 className="h-8 w-8 text-gray-400" />
                                    <p className="text-gray-500">No recent bins</p>
                                </div>
                            )}
                        </ScrollArea>
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
    );
}