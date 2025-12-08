"use client"

import { useState, useCallback, memo, useMemo } from "react"
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
import { getGradeBgClass } from "@/lib/grade-utils"

interface PredictorSemesterCardProps {
    semester: Semester
    originalSgpa: number | null
    predictedSgpa: number | null
    isNew: boolean
    modifiedCourseIds: Set<string>
    showOnlyModified: boolean
    onAddCourse: (course: Omit<Course, "id" | "semester_id" | "created_at">) => Promise<void>
    onEditCourse: (courseId: string, updates: { grade?: Grade; credits?: number }) => void
    onDeleteCourse: (courseId: string) => void
    onDeleteSemester: () => void
}

const CourseRow = memo(function CourseRow({
                                              course,
                                              isModified,
                                              onEditGrade,
                                              onDelete,
                                          }: {
    course: Course
    isModified: boolean
    onEditGrade: (grade: Grade) => void
    onDelete: () => void
}) {
    const gradePoint = GRADE_POINTS[course.grade]
    const points = gradePoint !== null ? gradePoint * course.credits : "-"
    const isNewCourse = course.id.startsWith("temp_")

    return (
        <TableRow className={isModified ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : ""}>
            <TableCell className="max-w-[150px]">
                <div className="flex items-start gap-2 min-w-0">
                    <div className="min-w-0">
                        <div className="font-medium truncate">{course.name}</div>
                        {course.code && <div className="text-xs text-muted-foreground truncate">{course.code}</div>}
                    </div>

                    {isNewCourse && (
                        <Badge variant="outline" className="text-xs border-primary text-primary">
                            New
                        </Badge>
                    )}

                    {isModified && !isNewCourse && (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 dark:text-blue-400">
                            Modified
                        </Badge>
                    )}
                </div>
            </TableCell>

            <TableCell className="text-center tabular-nums">{course.credits}</TableCell>

            <TableCell className="text-center">
                <Select value={course.grade} onValueChange={onEditGrade}>
                    <SelectTrigger className="w-[90px] h-8">
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

            <TableCell className="text-center">
                <Badge className={getGradeBgClass(course.grade)}>{course.grade}</Badge>
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
                                                                             modifiedCourseIds,
                                                                             showOnlyModified,
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

    const visibleCourses = useMemo(() => {
        if (!showOnlyModified) return courses
        return courses.filter((c) => modifiedCourseIds.has(c.id))
    }, [courses, showOnlyModified, modifiedCourseIds])

    // FIX: async to match Promise<void> type
    const handleAddCourse = useCallback(
        async (data: Omit<Course, "id" | "semester_id" | "created_at">) => {
            await onAddCourse(data)
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

    return (
        <>
            <Card className="w-full overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{semester.label}</CardTitle>
                            {isNew && (
                                <Badge variant="outline" className="border-primary text-primary">
                                    <Sparkles className="mr-1 h-3 w-3" /> New
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                                SGPA:{" "}
                                <span className="font-semibold tabular-nums text-foreground">
                  {formatGpa(predictedSgpa)}
                </span>{" "}
                                | Credits: {totalCredits}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddingCourse(true)}
                                className="shrink-0"
                            >
                                <Plus className="mr-1 h-3 w-3" />
                                Add Course
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsAddingCourse(true)}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Course
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setIsDeletingSemester(true)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Semester
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {visibleCourses.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            No courses.
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <Table className="min-w-[650px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course</TableHead>
                                        <TableHead className="text-center">Credits</TableHead>
                                        <TableHead className="text-center">Change</TableHead>
                                        <TableHead className="text-center">Grade</TableHead>
                                        <TableHead className="text-center">Points</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {visibleCourses.map((course) => (
                                        <CourseRow
                                            key={course.id}
                                            course={course}
                                            isModified={modifiedCourseIds.has(course.id)}
                                            onEditGrade={(grade) => onEditCourse(course.id, { grade })}
                                            onDelete={() => setDeletingCourse(course)}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
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
                description={`Are you sure you want to delete "${semester.label}"?`}
            />
        </>
    )
})
