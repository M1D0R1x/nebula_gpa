import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatGpa, getTotalCredits, computeCgpa } from "@/lib/gpa"
import type { Semester } from "@/lib/types"
import { TrendingUp, Award, BookOpen } from "lucide-react"

interface GpaStatsCardProps {
  semesters: Semester[]
}

export function GpaStatsCard({ semesters }: GpaStatsCardProps) {
  const allCourses = semesters.flatMap((s) => s.courses || [])
  const cgpa = computeCgpa(allCourses)
  const totalCredits = getTotalCredits(allCourses)
  const totalSemesters = semesters.length

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall CGPA</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{formatGpa(cgpa)}</div>
          <p className="text-xs text-muted-foreground">out of 10.00</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalCredits}</div>
          <p className="text-xs text-muted-foreground">completed credits</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Semesters</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalSemesters}</div>
          <p className="text-xs text-muted-foreground">recorded semesters</p>
        </CardContent>
      </Card>
    </div>
  )
}
