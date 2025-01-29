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
    DollarSign,
    IndianRupeeIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { dateToString, getDateInMMYYYY } from '@/lib/utils';
import { TabsContent } from '@radix-ui/react-tabs';
import { Badge } from '@/components/ui/badge';
import { getBudget, getMonthlyExpenses } from '@/db/actions/expense';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBinsInPagination } from '@/db/actions/bin';
import DashboardSkeleton from './loading';
import { TypographyMuted } from '@/components/Typography';
import { AddMonthlyExpenseForm } from '@/components/expense/month';

const BUDGET_INITIAL_STATE = {
    day: new Date().toISOString(),
    amount: NaN,
    remaining: NaN
}

export default async function DashboardPage() {
    const userId = (await getServerSession(authOptions))?.user.id as number
    const latestBudget = (await getBudget(dateToString(new Date().toISOString()), userId)) ?? BUDGET_INITIAL_STATE
    const { bins } = await getBinsInPagination(5, userId) ?? []
    const currMonthStr = getDateInMMYYYY(new Date())
    const monthlyExpenses = await getMonthlyExpenses(currMonthStr, userId)

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
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                {/* Refined Header Section */}
                <div className="flex flex-col space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
                </div>

                {/* Main Cards Section */}
                <div className="flex gap-8 flex-col md:flex-row">
                    {/* Budget Card */}
                    <Card className="md:w-[45%] border-0 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader className="space-y-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                    Today's Budget
                                </CardTitle>
                                {!isNaN(latestBudget.amount) && (
                                    <Link href={`/expense/${dateToString(latestBudget.day)}`}>
                                        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600">
                                            View Details →
                                        </Button>
                                    </Link>
                                )}
                            </div>
                            {!isNaN(latestBudget.amount) && (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-blue-600">₹{latestBudget.amount.toLocaleString()}</span>
                                    <span className="text-sm text-muted-foreground">{format(latestBudget?.day, 'MMMM d')}</span>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {!isNaN(latestBudget.amount) ? (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-blue-900">Remaining</span>
                                        <div className="flex items-center gap-2">
                                            {latestBudget?.remaining > 0 ? (
                                                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={`text-lg font-semibold ${latestBudget.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ₹{Math.abs(latestBudget?.remaining).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 px-4">
                                    <p className="text-muted-foreground mb-4">No budget set for today</p>
                                    <Button variant="outline" asChild className="hover:bg-blue-50">
                                        <Link href="/expense">Set Budget</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Monthly Expenses Card */}
                    <Card className="md:w-[55%] border-0 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader className="space-y-2">
                            <CardTitle className="flex items-center gap-2 text-lg font-medium">
                                <IndianRupeeIcon className="h-5 w-5 text-green-500" />
                                Monthly Overview
                            </CardTitle>
                            <CardDescription>
                                {format(new Date(), 'MMMM yyyy')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {monthlyExpenses.monthlyExpenses.length <= 0 ? (
                                <div className="flex justify-center items-center py-8">
                                    <AddMonthlyExpenseForm showDialog />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-green-50 rounded-lg p-4">
                                            <p className="text-sm text-green-900 mb-1">Total Spent</p>
                                            <p className="text-2xl font-semibold text-green-700">
                                                ₹{monthlyExpenses?.totalSpend?.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <p className="text-sm text-blue-900 mb-1">Highest Spend</p>
                                            <p className="text-2xl font-semibold text-blue-700">
                                                ₹{monthlyExpenses?.maxSpendInDay.amount?.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                {format(monthlyExpenses?.maxSpendInDay.date, 'MMM d')}
                                            </p>
                                        </div>
                                    </div>
                                    <Link href={`/expense/month/${currMonthStr}`} className="block">
                                        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">View detailed analysis →</span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity Section */}
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Stats Cards */}
                    <div className="md:col-span-1">
                        <div className="space-y-4">
                            {statsData.map((stat, index) => (
                                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <span className={stat.color}>{stat.icon}</span>
                                            {stat.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-semibold">{stat.value}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Recent Bins */}
                    <Card className="md:col-span-3 border-0 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-600" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="w-full grid grid-cols-2 mb-4">
                                    <TabsTrigger value="all">All Files</TabsTrigger>
                                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                                </TabsList>
                                <ScrollArea className="h-[300px]">
                                    {['all', 'markdown'].map((tab) => (
                                        <TabsContent key={tab} value={tab} className="mt-0">
                                            <div className="space-y-1">
                                                {bins
                                                    .filter(bin => tab === 'all' ? !bin?.isMarkdown : bin?.isMarkdown)
                                                    .map((bin) => (
                                                        <Link
                                                            href={`/bin/${bin.uid}`}
                                                            key={bin.id}
                                                            className="block"
                                                        >
                                                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                                                <div className="space-y-1">
                                                                    <p className="font-medium text-sm">{bin.name}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <Badge variant="secondary" className="px-2 py-0.5">
                                                                            {bin.isMarkdown ? 'Markdown' : 'Text'}
                                                                        </Badge>
                                                                        <span>•</span>
                                                                        <span>{format(new Date(bin.createdAt), 'MMM d, h:mm a')}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                            </div>
                                        </TabsContent>
                                    ))}
                                </ScrollArea>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Suspense>
    );

}