"use client"

import { useState, useCallback, useMemo, memo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Save, Plus, AlertTriangle, Calculator, TrendingUp, BookOpen, Award } from "lucide-react"
import { formatGpa, computeSgpa, computeCgpa, getTotalCredits } from "@/lib/gpa"
import type { Semester, Course, Grade } from "@/lib/types"
import { PredictorSemesterCard } from "./predictor-semester-card"
import { SemesterDialog } from "@/components/semester-dialog"
import { useRouter } from "next/navigation"

interface PredictorContentProps {
  officialSemesters: Semester[]
  userId: string
}

// Deep clone helper
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// Generate temporary IDs for new items
function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const StickyHeader = memo(function StickyHeader({
  officialCgpa,
  predictedCgpa,
  officialCredits,
  predictedCredits,
  semesterCount,
  officialSemesterCount,
  hasChanges,
  isSaving,
  onReset,
  onApply,
  onAddSemester,
}: {
  officialCgpa: number | null
  predictedCgpa: number | null
  officialCredits: number
  predictedCredits: number
  semesterCount: number
  officialSemesterCount: number
  hasChanges: boolean
  isSaving: boolean
  onReset: () => void
  onApply: () => void
  onAddSemester: () => void
}) {
  const cgpaDiff = predictedCgpa !== null && officialCgpa !== null ? predictedCgpa - officialCgpa : null

  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 pb-4 pt-0 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CGPA Predictor</h1>
          <p className="text-muted-foreground">Simulate grade changes without affecting your official records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onReset} disabled={!hasChanges}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={onApply} disabled={!hasChanges || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Apply to Official"}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved predictions. Click &ldquo;Apply to Official&rdquo; to save changes to your record, or
            &ldquo;Reset&rdquo; to discard.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="min-h-[100px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Official CGPA</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatGpa(officialCgpa)}</div>
            <p className="text-xs text-muted-foreground">{officialCredits} credits</p>
          </CardContent>
        </Card>
        <Card className="border-primary/50 bg-primary/5 min-h-[100px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted CGPA</CardTitle>
            <Calculator className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary tabular-nums">{formatGpa(predictedCgpa)}</div>
            <p className="text-xs text-muted-foreground">{predictedCredits} credits</p>
          </CardContent>
        </Card>
        <Card className="min-h-[100px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CGPA Change</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold tabular-nums transition-colors duration-100 ${cgpaDiff !== null && cgpaDiff > 0 ? "text-green-600" : cgpaDiff !== null && cgpaDiff < 0 ? "text-red-600" : ""}`}
            >
              {cgpaDiff !== null ? (cgpaDiff >= 0 ? "+" : "") + cgpaDiff.toFixed(2) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">from official</p>
          </CardContent>
        </Card>
        <Card className="min-h-[100px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Semesters</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{semesterCount}</div>
            <p className="text-xs text-muted-foreground">
              {semesterCount - officialSemesterCount > 0 && `+${semesterCount - officialSemesterCount} new`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mt-4">
        <h2 className="text-lg font-semibold">Semesters</h2>
        <Button variant="outline" size="sm" onClick={onAddSemester}>
          <Plus className="mr-2 h-4 w-4" />
          Add Semester
        </Button>
      </div>
    </div>
  )
})

export function PredictorContent({ officialSemesters, userId }: PredictorContentProps) {
  const router = useRouter()
  const [predictedSemesters, setPredictedSemesters] = useState<Semester[]>(() => deepClone(officialSemesters))
  const [isAddingSemester, setIsAddingSemester] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const stats = useMemo(() => {
    const officialAllCourses = officialSemesters.flatMap((s) => s.courses || [])
    const predictedAllCourses = predictedSemesters.flatMap((s) => s.courses || [])

    return {
      officialCgpa: computeCgpa(officialAllCourses),
      predictedCgpa: computeCgpa(predictedAllCourses),
      officialCredits: getTotalCredits(officialAllCourses),
      predictedCredits: getTotalCredits(predictedAllCourses),
    }
  }, [officialSemesters, predictedSemesters])

  const nextIndex = useMemo(() => {
    if (predictedSemesters.length === 0) return 1
    return Math.max(...predictedSemesters.map((s) => s.index)) + 1
  }, [predictedSemesters])

  const handleReset = useCallback(() => {
    setPredictedSemesters(deepClone(officialSemesters))
    setHasChanges(false)
  }, [officialSemesters])

  const handleAddSemester = useCallback(
    async (data: { label: string; index: number }) => {
      const newSemester: Semester = {
        id: generateTempId(),
        user_id: userId,
        label: data.label,
        index: data.index,
        created_at: new Date().toISOString(),
        courses: [],
      }
      setPredictedSemesters((prev) => [...prev, newSemester].sort((a, b) => a.index - b.index))
      setHasChanges(true)
    },
    [userId],
  )

  const handleDeleteSemester = useCallback((semesterId: string) => {
    setPredictedSemesters((prev) => prev.filter((s) => s.id !== semesterId))
    setHasChanges(true)
  }, [])

  const handleAddCourse = useCallback(
    (semesterId: string, course: Omit<Course, "id" | "semester_id" | "created_at">) => {
      const newCourse: Course = {
        id: generateTempId(),
        semester_id: semesterId,
        name: course.name,
        code: course.code,
        credits: course.credits,
        grade: course.grade,
        created_at: new Date().toISOString(),
      }
      setPredictedSemesters((prev) =>
        prev.map((s) => (s.id === semesterId ? { ...s, courses: [...(s.courses || []), newCourse] } : s)),
      )
      setHasChanges(true)
    },
    [],
  )

  const handleEditCourse = useCallback(
    (semesterId: string, courseId: string, updates: { grade?: Grade; credits?: number }) => {
      setPredictedSemesters((prev) =>
        prev.map((s) =>
          s.id === semesterId
            ? {
                ...s,
                courses: (s.courses || []).map((c) => (c.id === courseId ? { ...c, ...updates } : c)),
              }
            : s,
        ),
      )
      setHasChanges(true)
    },
    [],
  )

  const handleDeleteCourse = useCallback((semesterId: string, courseId: string) => {
    setPredictedSemesters((prev) =>
      prev.map((s) =>
        s.id === semesterId ? { ...s, courses: (s.courses || []).filter((c) => c.id !== courseId) } : s,
      ),
    )
    setHasChanges(true)
  }, [])

  const handleApplyChanges = useCallback(async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      const existingSemesterIds = new Set(officialSemesters.map((s) => s.id))
      const existingCourseIds = new Set(officialSemesters.flatMap((s) => (s.courses || []).map((c) => c.id)))
      const predictedSemesterIds = new Set(predictedSemesters.map((s) => s.id))

      const semestersToDelete = [...existingSemesterIds].filter((id) => !predictedSemesterIds.has(id))
      for (const id of semestersToDelete) {
        await supabase.from("semesters").delete().eq("id", id)
      }

      for (const semester of predictedSemesters) {
        const isNewSemester = semester.id.startsWith("temp_")
        let semesterId = semester.id

        if (isNewSemester) {
          const { data, error } = await supabase
            .from("semesters")
            .insert({ user_id: userId, label: semester.label, index: semester.index })
            .select()
            .single()
          if (error) throw error
          semesterId = data.id
        } else if (existingSemesterIds.has(semester.id)) {
          const original = officialSemesters.find((s) => s.id === semester.id)
          if (original && (original.label !== semester.label || original.index !== semester.index)) {
            await supabase
              .from("semesters")
              .update({ label: semester.label, index: semester.index })
              .eq("id", semester.id)
          }
        }

        const originalSemester = officialSemesters.find((s) => s.id === semester.id)
        const originalCourseIds = new Set((originalSemester?.courses || []).map((c) => c.id))
        const predictedCourseIdsForSemester = new Set((semester.courses || []).map((c) => c.id))

        const coursesToDelete = [...originalCourseIds].filter((id) => !predictedCourseIdsForSemester.has(id))
        for (const id of coursesToDelete) {
          await supabase.from("courses").delete().eq("id", id)
        }

        for (const course of semester.courses || []) {
          const isNewCourse = course.id.startsWith("temp_")
          if (isNewCourse) {
            await supabase.from("courses").insert({
              semester_id: semesterId,
              name: course.name,
              code: course.code,
              credits: course.credits,
              grade: course.grade,
            })
          } else if (existingCourseIds.has(course.id)) {
            const originalCourse = (originalSemester?.courses || []).find((c) => c.id === course.id)
            if (
              originalCourse &&
              (originalCourse.grade !== course.grade ||
                originalCourse.credits !== course.credits ||
                originalCourse.name !== course.name ||
                originalCourse.code !== course.code)
            ) {
              await supabase
                .from("courses")
                .update({
                  name: course.name,
                  code: course.code,
                  credits: course.credits,
                  grade: course.grade,
                })
                .eq("id", course.id)
            }
          }
        }
      }

      router.refresh()
      setHasChanges(false)
    } catch (error) {
      console.error("Error applying changes:", error)
      alert("Failed to apply changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [officialSemesters, predictedSemesters, userId, router])

  const openAddSemester = useCallback(() => setIsAddingSemester(true), [])

  const semesterData = useMemo(() => {
    return predictedSemesters.map((semester) => {
      const isNew = semester.id.startsWith("temp_")
      const originalSemester = officialSemesters.find((s) => s.id === semester.id)
      const originalSgpa = originalSemester ? computeSgpa(originalSemester.courses || []) : null
      const predictedSgpa = computeSgpa(semester.courses || [])
      return { semester, isNew, originalSgpa, predictedSgpa }
    })
  }, [predictedSemesters, officialSemesters])

  return (
    <div className="space-y-4">
      <StickyHeader
        officialCgpa={stats.officialCgpa}
        predictedCgpa={stats.predictedCgpa}
        officialCredits={stats.officialCredits}
        predictedCredits={stats.predictedCredits}
        semesterCount={predictedSemesters.length}
        officialSemesterCount={officialSemesters.length}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onReset={handleReset}
        onApply={handleApplyChanges}
        onAddSemester={openAddSemester}
      />

      <div className="space-y-4 pt-2">
        {predictedSemesters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">No semesters to predict</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add a semester to start predicting your CGPA</p>
            <Button className="mt-4" onClick={openAddSemester}>
              <Plus className="mr-2 h-4 w-4" />
              Add Semester
            </Button>
          </div>
        ) : (
          semesterData.map(({ semester, isNew, originalSgpa, predictedSgpa }) => (
            <PredictorSemesterCard
              key={semester.id}
              semester={semester}
              originalSgpa={originalSgpa}
              predictedSgpa={predictedSgpa}
              isNew={isNew}
              onAddCourse={(course) => handleAddCourse(semester.id, course)}
              onEditCourse={(courseId, updates) => handleEditCourse(semester.id, courseId, updates)}
              onDeleteCourse={(courseId) => handleDeleteCourse(semester.id, courseId)}
              onDeleteSemester={() => handleDeleteSemester(semester.id)}
            />
          ))
        )}
      </div>

      <SemesterDialog
        open={isAddingSemester}
        onOpenChange={setIsAddingSemester}
        onSubmit={handleAddSemester}
        nextIndex={nextIndex}
      />
    </div>
  )
}
