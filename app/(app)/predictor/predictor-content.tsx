"use client"

import { useState, useCallback, useMemo, memo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RefreshCw, Save, Plus, Calculator, TrendingUp, BookOpen, Award, Filter } from "lucide-react"
import { formatGpa, computeSgpa, computeCgpa, getTotalCredits } from "@/lib/gpa"
import type { Semester, Course, Grade } from "@/lib/types"
import { PredictorSemesterCard } from "./predictor-semester-card"
import { SemesterDialog } from "@/components/semester-dialog"
import { ApplyChangesDialog } from "@/components/apply-changes-dialog"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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
  modifiedCoursesCount,
  showOnlyModified,
  onToggleShowModified,
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
  modifiedCoursesCount: number
  showOnlyModified: boolean
  onToggleShowModified: (checked: boolean) => void
  onReset: () => void
  onApply: () => void
  onAddSemester: () => void
}) {
  const cgpaDiff = predictedCgpa !== null && officialCgpa !== null ? predictedCgpa - officialCgpa : null

  return (
    <div className="sticky top-0 z-20 bg-background border-b -mx-4 md:-mx-6 px-4 md:px-6 pb-4 pt-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CGPA Predictor</h1>
          <p className="text-muted-foreground text-sm">
            Simulate grade changes without affecting your official records
          </p>
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
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-1 h-4 bg-blue-500 rounded-full" />
            <span className="text-blue-700 dark:text-blue-300">
              {modifiedCoursesCount} modified course{modifiedCoursesCount !== 1 ? "s" : ""} highlighted in blue
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-modified" checked={showOnlyModified} onCheckedChange={onToggleShowModified} />
            <Label htmlFor="show-modified" className="text-sm cursor-pointer flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Show only modified
            </Label>
          </div>
        </div>
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
              className={`text-2xl font-bold tabular-nums ${cgpaDiff !== null && cgpaDiff > 0 ? "text-green-600" : cgpaDiff !== null && cgpaDiff < 0 ? "text-red-600" : ""}`}
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
  const { toast } = useToast()
  const officialSnapshot = useRef<Semester[]>(deepClone(officialSemesters))
  const [predictedSemesters, setPredictedSemesters] = useState<Semester[]>(() => deepClone(officialSemesters))
  const [isAddingSemester, setIsAddingSemester] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [showOnlyModified, setShowOnlyModified] = useState(false)

  const originalCoursesMap = useMemo(() => {
    const map = new Map<string, Course>()
    for (const semester of officialSnapshot.current) {
      for (const course of semester.courses || []) {
        map.set(course.id, course)
      }
    }
    return map
  }, [])

  const modifiedCourseIds = useMemo(() => {
    const modified = new Set<string>()
    for (const semester of predictedSemesters) {
      for (const course of semester.courses || []) {
        if (course.id.startsWith("temp_")) {
          // New courses are always "modified"
          modified.add(course.id)
          continue
        }
        const original = originalCoursesMap.get(course.id)
        if (!original) {
          modified.add(course.id)
          continue
        }
        // Check if any field differs
        if (
          original.grade !== course.grade ||
          original.credits !== course.credits ||
          original.name !== course.name ||
          original.code !== course.code
        ) {
          modified.add(course.id)
        }
      }
    }
    return modified
  }, [predictedSemesters, originalCoursesMap])

  const affectedSemesterIds = useMemo(() => {
    const affected = new Set<string>()
    for (const semester of predictedSemesters) {
      const isNewSemester = semester.id.startsWith("temp_")
      if (isNewSemester) {
        affected.add(semester.id)
        continue
      }
      for (const course of semester.courses || []) {
        if (modifiedCourseIds.has(course.id)) {
          affected.add(semester.id)
          break
        }
      }
    }
    return affected
  }, [predictedSemesters, modifiedCourseIds])

  const stats = useMemo(() => {
    const officialAllCourses = officialSnapshot.current.flatMap((s) => s.courses || [])
    const predictedAllCourses = predictedSemesters.flatMap((s) => s.courses || [])

    return {
      officialCgpa: computeCgpa(officialAllCourses),
      predictedCgpa: computeCgpa(predictedAllCourses),
      officialCredits: getTotalCredits(officialAllCourses),
      predictedCredits: getTotalCredits(predictedAllCourses),
    }
  }, [predictedSemesters])

  const nextIndex = useMemo(() => {
    if (predictedSemesters.length === 0) return 1
    return Math.max(...predictedSemesters.map((s) => s.index)) + 1
  }, [predictedSemesters])

  const handleReset = useCallback(() => {
    setPredictedSemesters(deepClone(officialSnapshot.current))
    setHasChanges(false)
    setShowOnlyModified(false)
  }, [])

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
    (
      semesterId: string,
      courseId: string,
      updates: { grade?: Grade; credits?: number; name?: string; code?: string },
    ) => {
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

  const handleApplyClick = useCallback(() => {
    setShowApplyDialog(true)
  }, [])

  const handleApplyChanges = useCallback(async () => {
    setShowApplyDialog(false)
    setIsSaving(true)
    const supabase = createClient()

    try {
      const existingSemesterIds = new Set(officialSnapshot.current.map((s) => s.id))
      const existingCourseIds = new Set(officialSnapshot.current.flatMap((s) => (s.courses || []).map((c) => c.id)))
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
          const original = officialSnapshot.current.find((s) => s.id === semester.id)
          if (original && (original.label !== semester.label || original.index !== semester.index)) {
            await supabase
              .from("semesters")
              .update({ label: semester.label, index: semester.index })
              .eq("id", semester.id)
          }
        }

        const originalSemester = officialSnapshot.current.find((s) => s.id === semester.id)
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

      officialSnapshot.current = deepClone(predictedSemesters)
      toast({
        title: "Official record updated",
        description: "Dashboard and graphs now reflect your changes.",
      })
      router.refresh()
      setHasChanges(false)
      setShowOnlyModified(false)
    } catch (error) {
      console.error("Error applying changes:", error)
      toast({
        title: "Failed to apply changes",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [predictedSemesters, userId, router, toast])

  const openAddSemester = useCallback(() => setIsAddingSemester(true), [])

  const visibleSemesters = useMemo(() => {
    if (!showOnlyModified) return predictedSemesters
    return predictedSemesters.filter((semester) => {
      if (semester.id.startsWith("temp_")) return true
      return (semester.courses || []).some((c) => modifiedCourseIds.has(c.id))
    })
  }, [predictedSemesters, showOnlyModified, modifiedCourseIds])

  const semesterData = useMemo(() => {
    return visibleSemesters.map((semester) => {
      const isNew = semester.id.startsWith("temp_")
      const originalSemester = officialSnapshot.current.find((s) => s.id === semester.id)
      const originalSgpa = originalSemester ? computeSgpa(originalSemester.courses || []) : null
      const predictedSgpa = computeSgpa(semester.courses || [])
      return { semester, isNew, originalSgpa, predictedSgpa }
    })
  }, [visibleSemesters])

  return (
    <div className="flex flex-col min-h-0">
      <StickyHeader
        officialCgpa={stats.officialCgpa}
        predictedCgpa={stats.predictedCgpa}
        officialCredits={stats.officialCredits}
        predictedCredits={stats.predictedCredits}
        semesterCount={predictedSemesters.length}
        officialSemesterCount={officialSnapshot.current.length}
        hasChanges={hasChanges}
        isSaving={isSaving}
        modifiedCoursesCount={modifiedCourseIds.size}
        showOnlyModified={showOnlyModified}
        onToggleShowModified={setShowOnlyModified}
        onReset={handleReset}
        onApply={handleApplyClick}
        onAddSemester={openAddSemester}
      />

      <div className="space-y-4 pt-4 flex-1">
        {visibleSemesters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">
              {showOnlyModified ? "No modified courses" : "No semesters to predict"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {showOnlyModified
                ? "Toggle off the filter to see all semesters"
                : "Add a semester to start predicting your CGPA"}
            </p>
            {!showOnlyModified && (
              <Button className="mt-4" onClick={openAddSemester}>
                <Plus className="mr-2 h-4 w-4" />
                Add Semester
              </Button>
            )}
          </div>
        ) : (
          semesterData.map(({ semester, isNew, originalSgpa, predictedSgpa }) => (
            <PredictorSemesterCard
              key={semester.id}
              semester={semester}
              originalSgpa={originalSgpa}
              predictedSgpa={predictedSgpa}
              isNew={isNew}
              modifiedCourseIds={modifiedCourseIds}
              showOnlyModified={showOnlyModified}
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

      <ApplyChangesDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
        onConfirm={handleApplyChanges}
        modifiedCoursesCount={modifiedCourseIds.size}
        affectedSemestersCount={affectedSemesterIds.size}
      />
    </div>
  )
}
