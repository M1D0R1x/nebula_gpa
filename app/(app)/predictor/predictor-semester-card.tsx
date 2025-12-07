"use client"

import { useState, useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, MoreHorizontal, Sparkles } from "lucide-react"
import { formatGpa, getTotalCredits } from "@/lib/gpa"
import { GRADES, GRADE_POINTS, type Semester, type Course, type Grade } from "@/lib/types"
import { CourseDialog } from "@/components/course-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getGradeColorClass } from "@/lib/grade-utils"

interface PredictorSemesterCardProps {
  semester: Semester
  originalSgpa: number | null
  predictedSgpa: number | null
  isNew: boolean
  onAddCourse: (course: Omit<Course, "id" | "semester_id" | "created_at">) => void
  onEditCourse: (courseId: string, updates: { grade?: Grade; credits?: number }) => void
  onDeleteCourse: (courseId: string) => void
  onDeleteSemester: () => void
}

const CourseRow = memo(function CourseRow({
  course,
  onEditGrade,
  onDelete,
}: {
  course: Course
  onEditGrade: (grade: Grade) => void
  onDelete: () => void
}) {
  const gradePoint = GRADE_POINTS[course.grade]
  const points = gradePoint !== null ? gradePoint * course.credits : "-"
  const isNewCourse = course.id.startsWith("temp_")

  return (
    <TableRow className={isNewCourse ? "bg-primary/5" : ""}>
      <TableCell>
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium">{course.name}</div>
            {course.code && <div className="text-xs text-muted-foreground">{course.code}</div>}
          </div>
          {isNewCourse && (
            <Badge variant="outline" className="text-xs border-primary text-primary">
              New
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center tabular-nums">{course.credits}</TableCell>
      <TableCell className="text-center">
        <Select value={course.grade} onValueChange={onEditGrade}>
          <SelectTrigger className={`w-[90px] h-8 ${getGradeColorClass(course.grade)}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-center font-mono tabular-nums">{points}</TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  )
})

export const PredictorSemesterCard = memo(function PredictorSemesterCard({
  semester,
  originalSgpa,
  predictedSgpa,
  isNew,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onDeleteSemester,
}: PredictorSemesterCardProps) {
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)
  const [isDeletingSemester, setIsDeletingSemester] = useState(false)

  const courses = semester.courses || []
  const totalCredits = getTotalCredits(courses)
  const sgpaDiff =
    predictedSgpa !== null && originalSgpa !== null
      ? predictedSgpa - originalSgpa
      : predictedSgpa !== null
        ? predictedSgpa
        : null

  const handleAddCourse = useCallback(
    (data: Omit<Course, "id" | "semester_id" | "created_at">) => {
      onAddCourse(data)
      setIsAddingCourse(false)
    },
    [onAddCourse],
  )

  const handleDeleteCourse = useCallback(() => {
    if (deletingCourse) {
      onDeleteCourse(deletingCourse.id)
      setDeletingCourse(null)
    }
  }, [deletingCourse, onDeleteCourse])

  const handleDeleteSemester = useCallback(() => {
    onDeleteSemester()
    setIsDeletingSemester(false)
  }, [onDeleteSemester])

  const openAddCourse = useCallback(() => setIsAddingCourse(true), [])
  const openDeleteSemester = useCallback(() => setIsDeletingSemester(true), [])

  return (
    <>
      <Card className={`${isNew ? "border-primary/50 bg-primary/5" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{semester.label}</CardTitle>
            {isNew && (
              <Badge variant="outline" className="border-primary text-primary">
                <Sparkles className="mr-1 h-3 w-3" />
                New
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground min-w-[180px]">
              <span>
                SGPA:{" "}
                <span
                  className={`font-semibold tabular-nums transition-colors duration-100 ${sgpaDiff !== null && sgpaDiff > 0 ? "text-green-600" : sgpaDiff !== null && sgpaDiff < 0 ? "text-red-600" : "text-foreground"}`}
                >
                  {formatGpa(predictedSgpa)}
                </span>
              </span>
              {originalSgpa !== null && predictedSgpa !== null && originalSgpa !== predictedSgpa && (
                <span className="ml-1 text-xs tabular-nums">
                  ({originalSgpa > predictedSgpa ? "" : "+"}
                  {(predictedSgpa - originalSgpa).toFixed(2)})
                </span>
              )}
              <span className="ml-3">Credits: {totalCredits}</span>
            </div>
            <Button variant="outline" size="sm" onClick={openAddCourse}>
              <Plus className="mr-1 h-3 w-3" />
              Add Course
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openAddCourse}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openDeleteSemester} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Semester
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No courses added yet</p>
              <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={openAddCourse}>
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
                  <TableHead className="text-center w-[120px]">Grade</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    onEditGrade={(grade) => onEditCourse(course.id, { grade })}
                    onDelete={() => setDeletingCourse(course)}
                  />
                ))}
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

      <DeleteConfirmDialog
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        description={`Are you sure you want to delete "${deletingCourse?.name}"?`}
      />

      <DeleteConfirmDialog
        open={isDeletingSemester}
        onOpenChange={setIsDeletingSemester}
        onConfirm={handleDeleteSemester}
        title="Delete Semester"
        description={`Are you sure you want to delete "${semester.label}" and all its courses?`}
      />
    </>
  )
})
