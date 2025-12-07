"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { GpaStatsCard } from "@/components/gpa-stats-card"
import { SemesterCard } from "@/components/semester-card"
import { SemesterDialog } from "@/components/semester-dialog"
import type { Semester, Course } from "@/lib/types"

interface DashboardContentProps {
  initialSemesters: Semester[]
  userId: string
}

const fetcher = async (userId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("semesters")
    .select(
      `
      *,
      courses (*)
    `,
    )
    .eq("user_id", userId)
    .order("index", { ascending: true })

  if (error) throw error
  return data as Semester[]
}

export function DashboardContent({ initialSemesters, userId }: DashboardContentProps) {
  const [isAddingSemester, setIsAddingSemester] = useState(false)
  const { data: semesters = initialSemesters } = useSWR(["semesters", userId], () => fetcher(userId), {
    fallbackData: initialSemesters,
    revalidateOnFocus: false,
  })

  const nextIndex = semesters.length > 0 ? Math.max(...semesters.map((s) => s.index)) + 1 : 1

  const handleAddSemester = async (data: { label: string; index: number }) => {
    const supabase = createClient()
    const { error } = await supabase.from("semesters").insert({
      user_id: userId,
      label: data.label,
      index: data.index,
    })
    if (error) throw error
    mutate(["semesters", userId])
  }

  const handleDeleteSemester = async (semesterId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("semesters").delete().eq("id", semesterId)
    if (error) throw error
    mutate(["semesters", userId])
  }

  const handleAddCourse = async (semesterId: string, course: Omit<Course, "id" | "semester_id" | "created_at">) => {
    const supabase = createClient()
    const { error } = await supabase.from("courses").insert({
      semester_id: semesterId,
      name: course.name,
      code: course.code,
      credits: course.credits,
      grade: course.grade,
    })
    if (error) throw error
    mutate(["semesters", userId])
  }

  const handleEditCourse = async (course: Course) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("courses")
      .update({
        name: course.name,
        code: course.code,
        credits: course.credits,
        grade: course.grade,
      })
      .eq("id", course.id)
    if (error) throw error
    mutate(["semesters", userId])
  }

  const handleDeleteCourse = async (courseId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("courses").delete().eq("id", courseId)
    if (error) throw error
    mutate(["semesters", userId])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Track your academic progress and GPA</p>
        </div>
        <Button onClick={() => setIsAddingSemester(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Semester
        </Button>
      </div>

      <GpaStatsCard semesters={semesters} />

      <div className="space-y-4">
        {semesters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">No semesters yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first semester</p>
            <Button className="mt-4" onClick={() => setIsAddingSemester(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Semester
            </Button>
          </div>
        ) : (
          semesters.map((semester) => (
            <SemesterCard
              key={semester.id}
              semester={semester}
              onAddCourse={handleAddCourse}
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              onDeleteSemester={handleDeleteSemester}
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
