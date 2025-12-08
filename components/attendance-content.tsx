"use client"

import { useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Info, Save, RotateCcw, CalendarCheck } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import AttendanceCourseTable, { AttendanceCourse } from "@/components/attendance-course-table"
import { computeCondonation, roundOverall } from "@/components/attendance-helpers"
import { createClient } from "@/lib/supabase/client"

type AttendanceProfile = {
    courses: AttendanceCourse[]
    target: number
    prevTerm1: number | null
    prevTerm2: number | null
}

function newId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID()
    }
    return Math.random().toString(36).slice(2)
}

export default function AttendanceContent({
                                              initialData,
                                          }: {
    initialData: AttendanceProfile | null
}) {
    const [courses, setCourses] = useState<AttendanceCourse[]>(
        initialData?.courses ?? [
            { id: newId(), name: "Course 1", attended: 0, dutyLeave: 0, totalClasses: 0, remaining: 0 },
        ],
    )
    const [target, setTarget] = useState<number>(initialData?.target ?? 75)
    const [prevTerm1, setPrevTerm1] = useState<number | null>(initialData?.prevTerm1 ?? null)
    const [prevTerm2, setPrevTerm2] = useState<number | null>(initialData?.prevTerm2 ?? null)
    const [isSaving, setIsSaving] = useState(false)

    // Aggregate stats
    const stats = useMemo(() => {
        if (courses.length === 0) {
            return {
                totalAttended: 0,
                totalClasses: 0,
                totalRemaining: 0,
                overallRaw: 0,
                overallDisplay: 0,
                missed: 0,
            }
        }

        let totalAttended = 0
        let totalClasses = 0
        let totalRemaining = 0

        courses.forEach((c) => {
            const attended = c.attended + c.dutyLeave
            totalAttended += attended
            totalClasses += c.totalClasses
            totalRemaining += c.remaining
        })

        const overallRaw = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0
        const overallDisplay = totalClasses > 0 ? roundOverall(overallRaw) : 0
        const missed = totalClasses - totalAttended

        return { totalAttended, totalClasses, totalRemaining, overallRaw, overallDisplay, missed }
    }, [courses])

    // Max possible overall if attend all remaining classes
    const maxPossible = useMemo(() => {
        if (stats.totalClasses === 0) {
            return { raw: 0, display: 0 }
        }

        const futureTotal = stats.totalClasses + stats.totalRemaining
        if (futureTotal === 0) return { raw: 0, display: 0 }

        const raw =
            ((stats.totalAttended + stats.totalRemaining) / futureTotal) * 100

        return {
            raw,
            display: roundOverall(raw),
        }
    }, [stats])

    // Global bunk calculator: how many total classes can be missed and still hit target
    const globalBunkInfo = useMemo(() => {
        if (stats.totalClasses === 0 || stats.totalRemaining <= 0) {
            return { maxBunks: 0, canMaintainTarget: stats.overallDisplay >= target }
        }

        const A = stats.totalAttended
        const T = stats.totalClasses
        const R = stats.totalRemaining
        const p = target / 100

        const maxBunksRaw = A + R - p * (T + R)
        const maxBunks = Math.max(0, Math.min(R, Math.floor(maxBunksRaw)))

        return {
            maxBunks,
            canMaintainTarget: maxBunks > 0 || stats.overallDisplay >= target,
        }
    }, [stats, target])

    // Per-course bunk suggestion: for each subject individually vs target
    const perCourseBunks = useMemo(() => {
        const p = target / 100
        return courses.map((c) => {
            const A = c.attended + c.dutyLeave
            const T = c.totalClasses
            const R = c.remaining
            if (T === 0 || R === 0) return { id: c.id, name: c.name, maxBunks: 0 }

            const maxBunksRaw = A + R - p * (T + R)
            const maxBunks = Math.max(0, Math.min(R, Math.floor(maxBunksRaw)))

            return { id: c.id, name: c.name, maxBunks }
        })
    }, [courses, target])

    // Condonation
    const condonation = useMemo(() => {
        if (stats.totalClasses === 0) {
            return {
                bonus: 0,
                effective: 0,
                eligible: false,
                reason: "No data.",
            }
        }
        return computeCondonation(stats.overallDisplay, prevTerm1, prevTerm2)
    }, [stats.overallDisplay, stats.totalClasses, prevTerm1, prevTerm2])

    // Donut data
    const donutData = useMemo(() => {
        return [
            { name: "Attended + DL", value: stats.totalAttended, key: "attended" },
            { name: "Missed so far", value: stats.missed > 0 ? stats.missed : 0, key: "missed" },
            {
                name: "Remaining",
                value: stats.totalRemaining > 0 ? stats.totalRemaining : 0,
                key: "remaining",
            },
        ].filter((d) => d.value > 0)
    }, [stats])

    const handleCourseChange = (
        id: string,
        field: keyof AttendanceCourse,
        value: string,
    ) => {
        setCourses((prev) =>
            prev.map((c) =>
                c.id === id
                    ? {
                        ...c,
                        [field]:
                            field === "name"
                                ? value
                                : Number.isNaN(Number(value))
                                    ? 0
                                    : Number(value),
                    }
                    : c,
            ),
        )
    }

    const addCourse = () => {
        setCourses((prev) => [
            ...prev,
            {
                id: newId(),
                name: `Course ${prev.length + 1}`,
                attended: 0,
                dutyLeave: 0,
                totalClasses: 0,
                remaining: 0,
            },
        ])
    }

    const removeCourse = (id: string) => {
        setCourses((prev) => prev.filter((c) => c.id !== id))
    }

    const resetAll = () => {
        setCourses([
            {
                id: newId(),
                name: "Course 1",
                attended: 0,
                dutyLeave: 0,
                totalClasses: 0,
                remaining: 0,
            },
        ])
        setTarget(75)
        setPrevTerm1(null)
        setPrevTerm2(null)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) return

            const payload: AttendanceProfile = {
                courses,
                target,
                prevTerm1,
                prevTerm2,
            }

            await supabase
                .from("attendance_profiles")
                .upsert(
                    { user_id: user.id, data: payload },
                    { onConflict: "user_id" },
                )
        } finally {
            setIsSaving(false)
        }
    }

    const showTargetWarning =
        stats.totalClasses > 0 && stats.overallDisplay < target

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6">
            {/* Header + info dialog */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <CalendarCheck className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Attendance & Bunk Calculator
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Track attendance, plan bunks, and apply previous-term bonus strictly as per rules.
                        </p>
                    </div>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Info className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Previous Terms & Condonation Rules</DialogTitle>
                            <DialogDescription>
                                Enter your aggregate attendance for the last two terms. Bonus will only apply if conditions are met.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-2 text-sm">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Current term aggregate must be ≥ 65% for condonation.</li>
                                <li>Each previous term gives 4–10% bonus if ≥ 75%.</li>
                                <li>Total condonation is capped at 10%.</li>
                                <li>
                                    If effective attendance (after bonus) is ≥ 75%, you are eligible in all courses as per rules.
                                </li>
                            </ul>

                            <div className="grid gap-3 mt-3">
                                <div className="grid gap-1">
                                    <Label>Previous Term 1 Aggregate (%)</Label>
                                    <Input
                                        type="number"
                                        value={prevTerm1 ?? ""}
                                        onChange={(e) =>
                                            setPrevTerm1(
                                                e.target.value === "" ? null : Number(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label>Previous Term 2 Aggregate (%)</Label>
                                    <Input
                                        type="number"
                                        value={prevTerm2 ?? ""}
                                        onChange={(e) =>
                                            setPrevTerm2(
                                                e.target.value === "" ? null : Number(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Overview card with donut and global stats */}
            <Card>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>
                            Donut shows attended, missed so far, and remaining classes. All percentages use your rules.
                        </CardDescription>
                    </div>
                    <div className="text-xs text-right space-y-1">
                        <div>
                            Current overall: <b>{stats.overallDisplay}%</b>
                        </div>
                        <div>
                            Target: <b>{target}%</b>
                        </div>
                        <div>
                            Max if attend all: <b>{maxPossible.display}%</b>
                        </div>
                        {condonation.bonus > 0 && (
                            <div>
                                With bonus:{" "}
                                <b>{roundOverall(condonation.effective)}%</b> (+{condonation.bonus}%)
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-[2fr,3fr] items-center">
                    <div className="h-[220px]">
                        {stats.totalClasses === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                Add some course data to see the donut chart.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {donutData.map((entry) => {
                                            const key = entry.key
                                            const color =
                                                key === "attended"
                                                    ? "hsl(var(--primary))"
                                                    : key === "missed"
                                                        ? "hsl(0 84% 60%)"
                                                        : "hsl(210 40% 80%)"
                                            return <Cell key={entry.name} fill={color} />
                                        })}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">
                                Attended + DL: {stats.totalAttended}
                            </Badge>
                            <Badge variant="outline">
                                Missed so far: {stats.missed}
                            </Badge>
                            <Badge variant="outline">
                                Remaining (all subjects): {stats.totalRemaining}
                            </Badge>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-1">
                                <Label>Target Attendance (%)</Label>
                                <Input
                                    type="number"
                                    value={target}
                                    onChange={(e) => setTarget(Number(e.target.value) || 0)}
                                    min={0}
                                    max={100}
                                />
                            </div>
                        </div>

                        {showTargetWarning && (
                            <p className="text-xs text-red-600">
                                Current overall attendance {stats.overallDisplay}% is below target {target}%.
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                            You can bunk up to{" "}
                            <span className="font-semibold">{globalBunkInfo.maxBunks}</span>{" "}
                            more classes (total across all subjects) and still maintain {target}%,
                            assuming remaining schedule as entered.
                        </p>

                        <p className="text-xs">
                            Condonation: {condonation.reason}{" "}
                            {condonation.bonus > 0 && (
                                <>
                                    Effective aggregate considered:{" "}
                                    <b>{roundOverall(condonation.effective)}%</b>.
                                </>
                            )}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Course-wise table + per-course bunk info */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Course-wise Details & Bunk Limits</CardTitle>
                        <CardDescription>
                            Per-subject attendance and how many classes you can bunk while still hitting the target per subject.
                        </CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={addCourse}>
                        Add Course
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="overflow-x-auto">
                        <AttendanceCourseTable
                            courses={courses}
                            onChange={handleCourseChange}
                            onRemove={removeCourse}
                        />
                    </div>

                    <div className="space-y-1 text-xs">
                        {perCourseBunks.map((b) => (
                            <div key={b.id}>
                                <span className="font-medium">{b.name || "Course"}:</span>{" "}
                                you can bunk up to <b>{b.maxBunks}</b> classes and still be at{" "}
                                {target}% for this subject (if you attend the rest).
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" onClick={resetAll}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    )
}
