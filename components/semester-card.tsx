"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { formatGpa, computeSgpa, getTotalCredits } from "@/lib/gpa"
import { GRADE_POINTS, type Semester, type Course } from "@/lib/types"
import { CourseDialog } from "./course-dialog"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SemesterCardProps {
  semester: Semester
  onAddCourse: (semesterId: string, course: Omit<Course, "id" | "semester_id" | "created_at">) => Promise<void>
  onEditCourse: (course: Course) => Promise<void>
  onDeleteCourse: (courseId: string) => Promise<void>
  onDeleteSemester: (semesterId: string) => Promise<void>
}

export function SemesterCard({
  semester,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onDeleteSemester,
}: SemesterCardProps) {
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)
  const [isDeletingSemester, setIsDeletingSemester] = useState(false)

  const courses = semester.courses || []
  const sgpa = computeSgpa(courses)
  const totalCredits = getTotalCredits(courses)

  const handleAddCourse = async (data: Omit<Course, "id" | "semester_id" | "created_at">) => {
    await onAddCourse(semester.id, data)
    setIsAddingCourse(false)
  }

  const handleEditCourse = async (data: Omit<Course, "id" | "semester_id" | "created_at">) => {
    if (editingCourse) {
      await onEditCourse({ ...editingCourse, ...data })
      setEditingCourse(null)
    }
  }

  const handleDeleteCourse = async () => {
    if (deletingCourse) {
      await onDeleteCourse(deletingCourse.id)
      setDeletingCourse(null)
    }
  }

  const handleDeleteSemester = async () => {
    await onDeleteSemester(semester.id)
    setIsDeletingSemester(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">{semester.label}</CardTitle>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                SGPA: <span className="font-semibold text-foreground">{formatGpa(sgpa)}</span>
              </span>
              <span>
                Credits: <span className="font-semibold text-foreground">{totalCredits}</span>
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddingCourse(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeletingSemester(true)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Semester
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No courses added yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={() => setIsAddingCourse(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Credits</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => {
                  const gradePoint = GRADE_POINTS[course.grade]
                  const points = gradePoint !== null ? gradePoint * course.credits : "-"
                  return (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{course.name}</div>
                          {course.code && <div className="text-xs text-muted-foreground">{course.code}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{course.credits}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={gradePoint === null ? "outline" : gradePoint >= 8 ? "default" : "secondary"}>
                          {course.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">{points}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingCourse(course)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingCourse(course)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CourseDialog
        open={isAddingCourse}
        onOpenChange={setIsAddingCourse}
        onSubmit={handleAddCourse}
        title="Add Course"
      />

      <CourseDialog
        open={!!editingCourse}
        onOpenChange={(open) => !open && setEditingCourse(null)}
        onSubmit={handleEditCourse}
        title="Edit Course"
        defaultValues={editingCourse || undefined}
      />

      <DeleteConfirmDialog
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        description={`Are you sure you want to delete "${deletingCourse?.name}"? This action cannot be undone.`}
      />

      <DeleteConfirmDialog
        open={isDeletingSemester}
        onOpenChange={setIsDeletingSemester}
        onConfirm={handleDeleteSemester}
        title="Delete Semester"
        description={`Are you sure you want to delete "${semester.label}" and all its courses? This action cannot be undone.`}
      />
    </>
  )
}
