import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, DollarSign, LineChart } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation'


export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <div className="w-full min-h-screen">
      <header className="pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Smart Daily
                <span className="text-blue-600"> Expense</span>
                <br />Tracking
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Take control of your finances with our intuitive expense tracker.
                Set budgets, track spending, and reach your goals.
              </p>
              <div className="flex gap-4">
                <Link href='/sigin'>
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Start Free Trial
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </div>
            </div>

            <Card className="p-6 shadow-lg border-2 border-gray-100">
              <CardHeader className="p-0 mb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Today&apos;s Budget</CardTitle>
                  <span className="text-2xl font-bold text-blue-600">&#8377;300</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4">
                  <div className="h-40">
                    <LineChart
                      className="w-full h-full"
                    />
                  </div>
                  <Button className="w-full gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <section id="features" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <PlusCircle className="h-8 w-8" />,
                title: "Quick Add",
                description: "Add expenses in seconds with our streamlined interface"
              },
              {
                icon: <DollarSign className="h-8 w-8" />,
                title: "Daily Budgets",
                description: "Set and track daily spending limits effortlessly"
              },
              {
                icon: <LineChart className="h-8 w-8" />,
                title: "Smart Insights",
                description: "Understand your spending with beautiful visualizations"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:border-blue-600 transition-all duration-300">
                <CardHeader>
                  <div className="mb-4 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Floating CTA */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link href='/sigin'>
          <Button size="lg"
            className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Try It Free
          </Button>
        </Link>
      </div>
    </div>
  );
};
