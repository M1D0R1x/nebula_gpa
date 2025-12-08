import { createClient } from "@/lib/supabase/server"
import { GRADE_POINTS, GRADES } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default async function GradesPage() {
    const supabase = await createClient()

    const { data: courses, error } = await supabase
        .from("courses")
        .select("grade, credits")

    if (error) {
        console.error(error)
    }

    const safeCourses = courses ?? []

    // Initialize grade counts
    const counts: Record<string, number> = Object.fromEntries(
        GRADES.map((g) => [g, 0])
    )

    // Populate counts
    safeCourses.forEach((c) => {
        if (counts[c.grade] !== undefined) {
            counts[c.grade]++
        }
    })

    const total = safeCourses.length
    const totalCredits = safeCourses.reduce((s, c) => s + c.credits, 0)

    const highest = total > 0
        ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
        : null

    return (
        <div className="max-w-xl mx-auto p-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Your Grade Distribution</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {GRADES.map((g) => {
                        const count = counts[g]
                        const percentage = total > 0 ? (count / total) * 100 : 0

                        return (
                            <div key={g} className="flex items-center gap-3">
                                <Badge className="w-12 justify-center">{g}</Badge>

                                <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                <div className="w-8 text-right font-mono">{count}</div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Insights</CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 text-sm">
                    {total === 0 ? (
                        <p>No courses found.</p>
                    ) : (
                        <>
                            <p>
                                Most common grade:{" "}
                                <b>{highest?.[0]}</b> ({highest?.[1]})
                            </p>
                            <p>Total courses counted: <b>{total}</b></p>
                            <p>Total credits: <b>{totalCredits}</b></p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
