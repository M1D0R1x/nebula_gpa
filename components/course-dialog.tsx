"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, BookOpen } from "lucide-react"

import { GRADES, type Grade, type Course, type CatalogCourse } from "@/lib/types"
import { DEFAULT_COURSE_CATALOG, searchCatalog } from "@/lib/course-catalog"
import { GradeBadge } from "./grade-badge"
import { cn } from "@/lib/utils"

type CatalogItem = Omit<CatalogCourse, "id" | "user_id">

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: Omit<Course, "id" | "semester_id" | "created_at">) => Promise<void>
    title: string
    defaultValues?: Partial<Course>
    customCatalog?: CatalogItem[]
}

export function CourseDialog({
                                 open,
                                 onOpenChange,
                                 onSubmit,
                                 title,
                                 defaultValues,
                                 customCatalog = [],
                             }: Props) {
    const [name, setName] = useState("")
    const [code, setCode] = useState("")
    const [credits, setCredits] = useState("")
    const [grade, setGrade] = useState<Grade>("O")

    const [searchTerm, setSearchTerm] = useState("")
    const [suggestions, setSuggestions] = useState<CatalogItem[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    const [selectedCatalogCourse, setSelectedCatalogCourse] = useState<CatalogItem | null>(null)
    const [isOverridden, setIsOverridden] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const nameInputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const fullCatalog = useMemo(
        () => [...DEFAULT_COURSE_CATALOG, ...customCatalog],
        [customCatalog],
    )

    // Reset dialog state
    useEffect(() => {
        if (open) {
            if (defaultValues) {
                setName(defaultValues.name ?? "")
                setCode(defaultValues.code ?? "")
                setCredits(defaultValues.credits?.toString() ?? "")
                setGrade(defaultValues.grade ?? "O")
                setSelectedCatalogCourse(null)
            } else {
                setName("")
                setCode("")
                setCredits("")
                setGrade("O")
                setSelectedCatalogCourse(null)
            }

            setSearchTerm("")
            setSuggestions([])
            setShowSuggestions(false)
            setHighlightedIndex(-1)
            setIsOverridden(false)
            setError(null)
        }
    }, [open, defaultValues])

    // AUTOCOMPLETE LOGIC
    const handleNameInput = (value: string) => {
        setName(value)
        setSearchTerm(value)

        if (selectedCatalogCourse && value !== selectedCatalogCourse.name) {
            setIsOverridden(true)
        }

        if (value.trim().length >= 2) {
            const results = searchCatalog(value, fullCatalog)
            setSuggestions(results)
            setShowSuggestions(results.length > 0)
            setHighlightedIndex(-1)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const handleSelectCourse = (course: CatalogItem) => {
        setSelectedCatalogCourse(course)
        setName(course.name)
        setCode(course.code)
        setCredits(course.credits.toString())

        setSearchTerm("")
        setSuggestions([])
        setShowSuggestions(false)
        setIsOverridden(false)
        setHighlightedIndex(-1)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
        }

        if (e.key === "ArrowUp") {
            e.preventDefault()
            setHighlightedIndex((prev) => Math.max(prev - 1, 0))
        }

        if (e.key === "Enter") {
            e.preventDefault()
            if (highlightedIndex >= 0) {
                handleSelectCourse(suggestions[highlightedIndex])
            }
        }

        if (e.key === "Escape") {
            setShowSuggestions(false)
        }
    }

    // SUBMIT
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const creditsNum = Number(credits)
        if (isNaN(creditsNum) || creditsNum <= 0) {
            setError("Credits must be a positive number")
            return
        }

        if (!name.trim()) {
            setError("Course name is required")
            return
        }

        setIsLoading(true)
        try {
            await onSubmit({
                name: name.trim(),
                code: code.trim(),
                credits: creditsNum,
                grade,
            })
            onOpenChange(false)
        } catch (err) {
            setError((err as Error).message || "Failed to save course")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Search or enter course details below.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">

                        {/* COURSE NAME (Autocomplete) */}
                        <div className="relative">
                            <Label>Course Name</Label>
                            <Input
                                ref={nameInputRef}
                                value={name}
                                onChange={(e) => handleNameInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type name or code..."
                            />

                            {showSuggestions && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                                    <ul ref={listRef} className="max-h-64 overflow-auto">
                                        {suggestions.map((course, index) => (
                                            <li
                                                key={course.code}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 cursor-pointer",
                                                    highlightedIndex === index
                                                        ? "bg-accent border-l-2 border-l-primary"
                                                        : "hover:bg-accent",
                                                )}
                                                onMouseEnter={() => setHighlightedIndex(index)}
                                                onClick={() => handleSelectCourse(course)}
                                            >
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />

                                                <div className="flex-1">
                                                    <div className="flex gap-2 items-center">
                                                        <Badge variant="outline" className="font-mono text-xs">{course.code}</Badge>
                                                        <span className="font-medium">{course.name}</span>
                                                    </div>

                                                    <span className="text-xs text-muted-foreground">
                            {course.credits} credits
                          </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* OVERRIDE WARNING */}
                        {isOverridden && (
                            <div className="flex gap-2 items-center rounded-md bg-amber-100 border border-amber-300 p-2 text-sm text-amber-800">
                                <AlertTriangle className="h-4 w-4" />
                                You modified catalog values. This course will be saved as custom.
                            </div>
                        )}

                        {/* COURSE CODE */}
                        <div className="grid gap-2">
                            <Label>Course Code</Label>
                            <Input value={code} onChange={(e) => setCode(e.target.value)} />
                        </div>

                        {/* CREDITS + GRADE */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Credits</Label>
                                <Input
                                    value={credits}
                                    onChange={(e) => setCredits(e.target.value)}
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Grade</Label>
                                <Select value={grade} onValueChange={(v) => setGrade(v as Grade)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GRADES.map((g) => (
                                            <SelectItem key={g} value={g}>
                                                <GradeBadge grade={g} className="text-xs" />
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {error && <p className="text-red-600 text-sm">{error}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
