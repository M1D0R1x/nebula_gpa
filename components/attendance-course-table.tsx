"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableRow, TableCell, TableBody, TableHead, TableHeader } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { roundSubject, getAttendanceColor } from "@/components/attendance-helpers"

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
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead />
                </TableRow>
            </TableHeader>

            <TableBody>
                {courses.map((c) => {
                    const att = c.attended + c.dutyLeave
                    const pct =
                        c.totalClasses > 0 ? roundSubject((att / c.totalClasses) * 100) : 0

                    return (
                        <TableRow key={c.id}>
                            <TableCell>
                                <Input
                                    value={c.name}
                                    onChange={(e) => onChange(c.id, "name", e.target.value)}
                                />
                            </TableCell>

                            <TableCell className="text-center">
                                <Input
                                    type="number"
                                    className="w-20 text-center mx-auto"
                                    value={c.attended}
                                    onChange={(e) => onChange(c.id, "attended", e.target.value)}
                                />
                            </TableCell>

                            <TableCell className="text-center">
                                <Input
                                    type="number"
                                    className="w-20 text-center mx-auto"
                                    value={c.dutyLeave}
                                    onChange={(e) => onChange(c.id, "dutyLeave", e.target.value)}
                                />
                            </TableCell>

                            <TableCell className="text-center">
                                <Input
                                    type="number"
                                    className="w-20 text-center mx-auto"
                                    value={c.totalClasses}
                                    onChange={(e) => onChange(c.id, "totalClasses", e.target.value)}
                                />
                            </TableCell>

                            <TableCell className="text-center">
                                <Input
                                    type="number"
                                    className="w-20 text-center mx-auto"
                                    value={c.remaining}
                                    onChange={(e) => onChange(c.id, "remaining", e.target.value)}
                                />
                            </TableCell>

                            <TableCell className={`text-center font-bold ${getAttendanceColor(pct)}`}>
                                {c.totalClasses > 0 ? `${pct}%` : "-"}
                            </TableCell>

                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => onRemove(c.id)}>
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
