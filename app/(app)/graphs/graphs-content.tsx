"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts"
import { computeSgpa, getTotalCredits } from "@/lib/gpa"
import { GRADE_POINTS, type Semester } from "@/lib/types"
import { getGradeChartColor } from "@/lib/grade-utils"

interface GraphsContentProps {
  semesters: Semester[]
}

type ViewMode = "all-semesters" | "single-semester"

export function GraphsContent({ semesters }: GraphsContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("all-semesters")
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(semesters[0]?.id || "")
  const [isLoading, setIsLoading] = useState(false)

  // Data for all semesters line chart
  const allSemestersData = useMemo(() => {
    return semesters.map((semester) => {
      const sgpa = computeSgpa(semester.courses || [])
      const credits = getTotalCredits(semester.courses || [])
      return {
        name: semester.label,
        index: semester.index,
        sgpa: sgpa !== null ? Number(sgpa.toFixed(2)) : 0,
        credits,
      }
    })
  }, [semesters])

  // Data for single semester bar chart
  const singleSemesterData = useMemo(() => {
    const semester = semesters.find((s) => s.id === selectedSemesterId)
    if (!semester) return []

    return (semester.courses || []).map((course) => {
      const gradePoint = GRADE_POINTS[course.grade]
      return {
        name: course.code || course.name.slice(0, 12),
        fullName: course.name,
        gradePoints: gradePoint !== null ? gradePoint : 0,
        grade: course.grade,
        credits: course.credits,
      }
    })
  }, [semesters, selectedSemesterId])

  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId)

  // Simulate loading when switching views
  const handleViewChange = (value: ViewMode) => {
    setIsLoading(true)
    setViewMode(value)
    setTimeout(() => setIsLoading(false), 150)
  }

  const handleSemesterChange = (value: string) => {
    setIsLoading(true)
    setSelectedSemesterId(value)
    setTimeout(() => setIsLoading(false), 150)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Performance</h1>
          <p className="text-muted-foreground">Visualize your GPA trends and course performance</p>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View:</span>
          <Select value={viewMode} onValueChange={(v) => handleViewChange(v as ViewMode)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-semesters">All Semesters Comparison</SelectItem>
              <SelectItem value="single-semester">Single Semester Breakdown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {viewMode === "single-semester" && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Semester:</span>
            <Select value={selectedSemesterId} onValueChange={handleSemesterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Graph Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === "all-semesters"
              ? "SGPA Across Semesters"
              : `${selectedSemester?.label || "Semester"} - Course Breakdown`}
          </CardTitle>
          <CardDescription>
            {viewMode === "all-semesters"
              ? "Track your semester-wise GPA progression"
              : "Grade points for each course in the selected semester"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : semesters.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <p>No data available. Add semesters and courses to see graphs.</p>
            </div>
          ) : viewMode === "all-semesters" ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={allSemestersData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              SGPA: <span className="font-semibold text-primary">{data.sgpa}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Credits: <span className="font-semibold">{data.credits}</span>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sgpa"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : singleSemesterData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <p>No courses in this semester.</p>
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={singleSemesterData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "Grade Points", angle: -90, position: "insideLeft", fontSize: 12 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <p className="font-medium">{data.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              Grade: <span className="font-semibold">{data.grade}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Points: <span className="font-semibold">{data.gradePoints}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Credits: <span className="font-semibold">{data.credits}</span>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    content={() => (
                      <div className="flex justify-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-green-500" />
                          <span>Pass (O–D)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-red-500" />
                          <span>Fail (E/F/R)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-gray-400" />
                          <span>Incomplete (I)</span>
                        </div>
                      </div>
                    )}
                  />
                  <Bar dataKey="gradePoints" radius={[4, 4, 0, 0]}>
                    {singleSemesterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getGradeChartColor(entry.grade)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {viewMode === "all-semesters" && semesters.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Highest SGPA</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const best = allSemestersData.reduce((max, s) => (s.sgpa > max.sgpa ? s : max), allSemestersData[0])
                return (
                  <>
                    <div className="text-2xl font-bold text-green-600">{best.sgpa.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{best.name}</p>
                  </>
                )
              })()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lowest SGPA</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const worst = allSemestersData.reduce((min, s) => (s.sgpa < min.sgpa ? s : min), allSemestersData[0])
                return (
                  <>
                    <div className="text-2xl font-bold text-red-600">{worst.sgpa.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{worst.name}</p>
                  </>
                )
              })()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average SGPA</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const avg = allSemestersData.reduce((sum, s) => sum + s.sgpa, 0) / allSemestersData.length
                return (
                  <>
                    <div className="text-2xl font-bold">{avg.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Across {allSemestersData.length} semesters</p>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
