"use client"

import { useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogTrigger,
    DialogHeader,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Info, Save, RotateCcw, CalendarCheck } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import AttendanceCourseTable, { AttendanceCourse } from "@/components/attendance-course-table"
import {
    computeCondonation,
    roundOverall,
    getAttendanceColor,
} from "@/components/attendance-helpers"
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

export default function AttendanceContent({ initialData }: { initialData: AttendanceProfile | null }) {
    const [courses, setCourses] = useState<AttendanceCourse[]>(
        initialData?.courses ?? [
            {
                id: newId(),
                name: "Course 1",
                attended: 0,
                dutyLeave: 0,
                totalClasses: 0,
                remaining: 0,
            },
        ]
    )

    const [target, setTarget] = useState(initialData?.target ?? 75)
    const [prevTerm1, setPrevTerm1] = useState<number | null>(initialData?.prevTerm1 ?? null)
    const [prevTerm2, setPrevTerm2] = useState<number | null>(initialData?.prevTerm2 ?? null)
    const [isSaving, setIsSaving] = useState(false)

    // =======================
    // AGGREGATE STATS
    // =======================

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

        return {
            totalAttended,
            totalClasses,
            totalRemaining,
            overallRaw,
            overallDisplay,
            missed,
        }
    }, [courses])

    // =======================
    // MAX POSSIBLE PERCENTAGE
    // =======================

    const maxPossible = useMemo(() => {
        if (stats.totalClasses === 0) return { raw: 0, display: 0 }

        const futureTotal = stats.totalClasses + stats.totalRemaining
        if (futureTotal === 0) return { raw: 0, display: 0 }

        const raw =
            ((stats.totalAttended + stats.totalRemaining) / futureTotal) * 100

        return { raw, display: roundOverall(raw) }
    }, [stats])

    // =======================
    // GLOBAL BUNK CALC
    // =======================

    const globalBunk = useMemo(() => {
        const A = stats.totalAttended
        const T = stats.totalClasses
        const R = stats.totalRemaining
        if (T === 0) return { maxBunks: 0 }

        const p = target / 100

        const raw = A + R - p * (T + R)
        const maxBunks = Math.max(0, Math.min(R, Math.floor(raw)))

        return { maxBunks }
    }, [stats, target])

    // =======================
    // PER-COURSE BUNK CALC
    // =======================

    const perCourseBunks = useMemo(() => {
        return courses.map((c) => {
            const A = c.attended + c.dutyLeave
            const T = c.totalClasses
            const R = c.remaining
            if (T === 0 || R === 0) return { id: c.id, name: c.name, maxBunks: 0 }

            const p = target / 100

            const raw = A + R - p * (T + R)
            const maxBunks = Math.max(0, Math.min(R, Math.floor(raw)))

            return { id: c.id, name: c.name, maxBunks }
        })
    }, [courses, target])

    // =======================
    // CONDONATION LOGIC
    // =======================

    const condonation = useMemo(() => {
        if (stats.totalClasses === 0)
            return { bonus: 0, effective: 0, eligible: false, reason: "No data." }

        return computeCondonation(stats.overallDisplay, prevTerm1, prevTerm2)
    }, [stats.overallDisplay, stats.totalClasses, prevTerm1, prevTerm2])

    // =======================
    // DONUT CHARTS
    // =======================

    const donutActual = useMemo(() => {
        return [
            { name: "Attended + DL", value: stats.totalAttended, key: "attended" },
            { name: "Missed", value: stats.missed, key: "missed" },
            { name: "Remaining", value: stats.totalRemaining, key: "remaining" },
        ].filter((d) => d.value > 0)
    }, [stats])

    const donutTarget = useMemo(() => {
        const shortage = Math.max(0, target - stats.overallDisplay)
        return [
            { name: "Current", value: stats.overallDisplay, key: "current" },
            { name: "Shortage", value: shortage, key: "shortage" },
        ]
    }, [stats, target])

    // =======================
    // INPUT HANDLERS
    // =======================

    const handleCourseChange = (id: string, field: keyof AttendanceCourse, v: string) => {
        setCourses((prev) =>
            prev.map((c) =>
                c.id === id
                    ? {
                        ...c,
                        [field]: field === "name" ? v : Number(v) || 0,
                    }
                    : c
            )
        )
    }

    const addCourse = () => {
        setCourses((p) => [
            ...p,
            {
                id: newId(),
                name: `Course ${p.length + 1}`,
                attended: 0,
                dutyLeave: 0,
                totalClasses: 0,
                remaining: 0,
            },
        ])
    }

    const removeCourse = (id: string) => setCourses((p) => p.filter((c) => c.id !== id))

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

    const save = async () => {
        setIsSaving(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await supabase.from("attendance_profiles").upsert({
                user_id: user.id,
                data: { courses, target, prevTerm1, prevTerm2 },
            })
        } finally {
            setIsSaving(false)
        }
    }

    // =======================
    // RENDER
    // =======================

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-8">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarCheck className="h-7 w-7 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Attendance & Bunk Calculator</h1>
                        <p className="text-sm text-muted-foreground">
                            Real-time attendance, bunk planning & condonation eligibility.
                        </p>
                    </div>
                </div>

                {/* INFO DIALOG */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Info className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Condonation Rules</DialogTitle>
                            <DialogDescription>Strict university rules applied automatically.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 text-sm">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Condonation applies only if current term is 65–75%.</li>
                                <li>Each previous term gives 4–10% bonus if ≥75%.</li>
                                <li>Maximum total condonation = 10%.</li>
                                <li>Effective ≥ 75% after bonus = eligible.</li>
                            </ul>

                            <div className="grid gap-2">
                                <Label>Previous Term 1 (%)</Label>
                                <Input
                                    type="number"
                                    value={prevTerm1 ?? ""}
                                    onChange={(e) => setPrevTerm1(e.target.value === "" ? null : Number(e.target.value))}
                                />

                                <Label>Previous Term 2 (%)</Label>
                                <Input
                                    type="number"
                                    value={prevTerm2 ?? ""}
                                    onChange={(e) => setPrevTerm2(e.target.value === "" ? null : Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* TWO DONUTS */}
            <Card>
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>Actual attendance vs target comparison</CardDescription>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* ACTUAL DONUT */}
                    <div>
                        <h3 className="text-sm font-medium mb-1">Actual Attendance</h3>

                        <div className="h-[260px]">
                            {stats.totalClasses === 0 ? (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    Enter class data to view chart.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={donutActual} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={4}>
                                            {donutActual.map((d) => (
                                                <Cell
                                                    key={d.key}
                                                    fill={
                                                        d.key === "attended"
                                                            ? "hsl(var(--primary))"
                                                            : d.key === "missed"
                                                                ? "hsl(0 75% 60%)"
                                                                : "hsl(210 40% 75%)"
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* TARGET DONUT */}
                    <div>
                        <h3 className="text-sm font-medium mb-1">Target Comparison</h3>

                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={donutTarget} dataKey="value" innerRadius={60} outerRadius={90}>
                                        <Cell fill="hsl(var(--primary))" />
                                        <Cell fill="hsl(0 70% 60%)" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SUMMARY */}
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Attended + DL: {stats.totalAttended}</Badge>
                        <Badge variant="outline">Missed: {stats.missed}</Badge>
                        <Badge variant="outline">Remaining: {stats.totalRemaining}</Badge>
                    </div>

                    <div className={`text-xl font-bold ${getAttendanceColor(stats.overallDisplay)}`}>
                        Overall: {stats.overallDisplay}%
                    </div>

                    <div>
                        Max Possible (if attend all remaining):{" "}
                        <b>{maxPossible.display}%</b>
                    </div>

                    {/* TARGET INPUT */}
                    <div className="grid gap-1 max-w-xs">
                        <Label>Target (%)</Label>
                        <Input
                            type="number"
                            value={target}
                            onChange={(e) => setTarget(Number(e.target.value))}
                        />
                    </div>

                    {/* CONDONATION STATUS */}
                    <div>
                        <span className="font-semibold">Condonation:</span> {condonation.reason}{" "}
                        {condonation.bonus > 0 && (
                            <>
                                | Effective: <b>{roundOverall(condonation.effective)}%</b>
                            </>
                        )}
                    </div>

                    <div>
                        <span className="font-semibold">Global Bunk Limit:</span>{" "}
                        {globalBunk.maxBunks} classes
                    </div>
                </CardContent>
            </Card>

            {/* COURSE TABLE */}
            <Card>
                <CardHeader className="flex justify-between">
                    <div>
                        <CardTitle>Course-wise Details</CardTitle>
                        <CardDescription>Attendance + per-course bunk limits</CardDescription>
                    </div>

                    <Button size="sm" variant="outline" onClick={addCourse}>
                        Add Course
                    </Button>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="overflow-x-auto">
                        <AttendanceCourseTable
                            courses={courses}
                            onChange={handleCourseChange}
                            onRemove={removeCourse}
                        />
                    </div>

                    <div className="text-xs space-y-1">
                        {perCourseBunks.map((b) => (
                            <div key={b.id}>
                                <b>{b.name}:</b> bunk up to <b>{b.maxBunks}</b> classes safely.
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetAll}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                </Button>

                <Button onClick={save} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                </Button>
            </div>
        </div>
    )
}
