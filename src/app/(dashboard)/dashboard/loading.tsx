import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, FileText, BarChart3 } from "lucide-react";


// TODO: need to update
export default function DashboardSkeleton() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6">
            {/* Header Section Skeleton */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-500">Welcome back! Here&apos;s your overview.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Budget Card Skeleton */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                Today&apos;s Budget
                            </CardTitle>
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <div className="mt-2">
                            <Skeleton className="h-4 w-36 mt-2" />
                            <Skeleton className="h-10 w-24 mt-2" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <Skeleton className="h-4 w-20" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5 rounded-full" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Overview Skeleton */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-500" />
                            Monthly Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-full mb-4" />
                        <div className="grid grid-cols-2 gap-6">
                            <Skeleton className="h-20 w-full rounded-lg" />
                            <Skeleton className="h-20 w-full rounded-lg" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                    <Card key={item} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Bins Skeleton */}
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <BarChart3 className="text-purple-700 mr-1" /> Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-full mb-4" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
