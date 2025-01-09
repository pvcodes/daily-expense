import { authOptions } from "@/lib/auth";
import { getServerSession, Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
// import { z } from "zod";

// Validation schema for query parameters
// const QuerySchema = z.object({
// 	page: z.coerce.number().positive().default(1),
// 	limit: z.coerce.number().min(1).max(100).default(10),
// });

export async function GET(req: NextRequest) {
    try {
        // Get authenticated session
        const { user } = await getServerSession(authOptions) as Session;
        const day = req.nextUrl.searchParams.get("day") as string;
        const dayToFind = new Date(day)
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1)
        const budget = await db.budget.findFirst({
            where: {
                userId: user.id,
                day: {
                    gte: dayToFind,
                    lte: nextDay,
                }
            },
            select: { id: true, remaining: true }
        })

        const expenses = await db.expense.findMany({ where: { userId: user.id, budgetId: budget?.id }, orderBy: { date: 'desc' } })


        // return Response.json({ budget, nextDay, dayToFind, user })


        // Return response with expenses
        return Response.json({
            success: true,
            data: {
                expenses, remainingBudget: budget?.remaining
            },
        });
    } catch (error) {
        // console.error("Expense fetch error:", error);

        return NextResponse.json(
            {
                success: false,
                error,
            },
            { status: 400 }
        );
    }

}


export async function POST(req: NextRequest) {
    try {
        // Get authenticated session
        const { user } = await getServerSession(authOptions) as Session;
        const { description, amount, budgetId } = await req.json();

        console.log({ description, amount, budgetId })

        const expense = await db.expense.create({
            data: {
                userId: user.id as number,
                amount: parseInt(amount, 10),
                budgetId: parseInt(budgetId, 10),
                description
            }
        })

        const budget = await db.budget.update({
            where: { id: parseInt(budgetId, 10) }, data: {
                remaining: {
                    decrement: parseFloat(amount)
                }
            },
            select: { remaining: true }
        })
        //



        // return Response.json({ budget, nextDay, dayToFind, user })


        // Return response with expenses
        return Response.json({
            success: true,
            data: { expense, remainingBudget: budget.remaining },
        });
    } catch (error) {
        console.error("Expense fetch error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        );
    }

}
