"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableRow, TableCell, TableBody, TableHead, TableHeader } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { roundSubject } from "@/components/attendance-helpers"

export type AttendanceCourse = {
    id: string
    name: string
    attended: number
    dutyLeave: number
    totalClasses: number
    remaining: number
}

interface Props {
    courses: AttendanceCourse[]
    onChange: (id: string, field: keyof AttendanceCourse, value: string) => void
    onRemove: (id: string) => void
}

export default function AttendanceCourseTable({ courses, onChange, onRemove }: Props) {
    return (
        <Table className="min-w-[750px]">
            <TableHeader>
                <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Attended</TableHead>
                    <TableHead className="text-center">Duty Leave</TableHead>
                    <TableHead className="text-center">Total Classes</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                    <TableHead className="text-center">% (rounded)</TableHead>
                    <TableHead />
                </TableRow>
            </TableHeader>
            <TableBody>
                {courses.map((course) => {
                    const attendedTotal = course.attended + course.dutyLeave
                    const pct =
                        course.totalClasses > 0
                            ? roundSubject((attendedTotal / course.totalClasses) * 100)
                            : "-"

                    return (
                        <TableRow key={course.id}>
                            <TableCell className="max-w-[200px]">
                                <Input
                                    value={course.name}
                                    onChange={(e) => onChange(course.id, "name", e.target.value)}
                                />
                            </TableCell>

                            <TableCell className="text-center">
                                <Input
                                    type="number"
                                    className="w-20 mx-auto text-center"
                                    value={course.attended}
                                    onChange={(e) => onChange(course.id, "attended", e.target.value)}
                                    min={0}
                                />
                            </TableCell>

                            <TableCell className="text-center">
                                <Input
                                    type="number"
                                    className="w-20 mx-auto text-center"
                                    value={course.dutyLeave}
                                    onChange={(e) => onChange(course.id, "dutyLeave", e.target.value)}
                                    min={0}
                                />
                            </TableCell>

                            <TableCell className="text-center">
                                <Input
                                    type="number"
                                    className="w-20 mx-auto text-center"
                                    value={course.totalClasses}
                                    onChange={(e) => onChange(course.id, "totalClasses", e.target.value)}
                                    min={0}
                                />
                            </TableCell>

                            <TableCell className="text-center">
                                <Input
                                    type="number"
                                    className="w-20 mx-auto text-center"
                                    value={course.remaining}
                                    onChange={(e) => onChange(course.id, "remaining", e.target.value)}
                                    min={0}
                                />
                            </TableCell>

                            <TableCell className="text-center font-mono">
                                {course.totalClasses > 0 ? `${pct}%` : "-"}
                            </TableCell>

                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => onRemove(course.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
