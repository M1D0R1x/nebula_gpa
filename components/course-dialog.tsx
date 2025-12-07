"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"

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
import { Search, AlertTriangle, BookOpen } from "lucide-react"

import { GRADES, type Grade, type Course, type CatalogCourse } from "@/lib/types"
import {
    DEFAULT_COURSE_CATALOG,
    searchCatalog,
} from "@/lib/course-catalog"

import { GradeBadge } from "./grade-badge"
import { cn } from "@/lib/utils"

// CatalogItem is always the static catalog type
type CatalogItem = Omit<CatalogCourse, "id" | "user_id">

interface CourseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (
        data: Omit<Course, "id" | "semester_id" | "created_at">
    ) => Promise<void>
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
                             }: CourseDialogProps) {
    // Search State
    const [searchQuery, setSearchQuery] = useState("")
    const [suggestions, setSuggestions] = useState<CatalogItem[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedCatalogCourse, setSelectedCatalogCourse] = useState<CatalogItem | null>(null)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const [isOverridden, setIsOverridden] = useState(false)

    // Course Fields
    const [name, setName] = useState("")
    const [code, setCode] = useState("")
    const [credits, setCredits] = useState("")
    const [grade, setGrade] = useState<Grade>("O")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Refs
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    // Merge static catalog + user custom catalog
    const fullCatalog = useMemo<CatalogItem[]>(
        () => [...DEFAULT_COURSE_CATALOG, ...customCatalog],
        [customCatalog],
    )

    // Search handler
    const handleSearch = useCallback(
        (query: string) => {
            setSearchQuery(query)

            if (query.trim().length >= 2) {
                const results = searchCatalog(query, fullCatalog)
                setSuggestions(results)
                setShowSuggestions(results.length > 0)
                setHighlightedIndex(-1)
            } else {
                setSuggestions([])
                setShowSuggestions(false)
                setHighlightedIndex(-1)
            }
        },
        [fullCatalog],
    )

    // Select course from suggestions
    const handleSelectCourse = (course: CatalogItem) => {
        setSelectedCatalogCourse(course)

        setName(course.name)
        setCode(course.code)
        setCredits(course.credits.toString())

        setSearchQuery("")
        setSuggestions([])
        setShowSuggestions(false)

        setIsOverridden(false)
        setHighlightedIndex(-1)
    }

    // Arrow key navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setHighlightedIndex((prev) => {
                    const next = Math.min(prev + 1, suggestions.length - 1)
                    setTimeout(() => {
                        const item = listRef.current?.children[next] as HTMLElement
                        item?.scrollIntoView({ block: "nearest" })
                    }, 0)
                    return next
                })
                break

            case "ArrowUp":
                e.preventDefault()
                setHighlightedIndex((prev) => {
                    const next = Math.max(prev - 1, 0)
                    setTimeout(() => {
                        const item = listRef.current?.children[next] as HTMLElement
                        item?.scrollIntoView({ block: "nearest" })
                    }, 0)
                    return next
                })
                break

            case "Enter":
                e.preventDefault()
                if (highlightedIndex >= 0) {
                    handleSelectCourse(suggestions[highlightedIndex])
                }
                break

            case "Escape":
                setShowSuggestions(false)
                setHighlightedIndex(-1)
                break
        }
    }

    // Detect override after selecting catalog item
    const handleNameChange = (value: string) => {
        setName(value)
        if (selectedCatalogCourse && value !== selectedCatalogCourse.name) {
            setIsOverridden(true)
        }
    }

    const handleCodeChange = (value: string) => {
        setCode(value)
        if (selectedCatalogCourse && value !== selectedCatalogCourse.code) {
            setIsOverridden(true)
        }
    }

    const handleCreditsChange = (value: string) => {
        setCredits(value)
        if (selectedCatalogCourse && value !== selectedCatalogCourse.credits.toString()) {
            setIsOverridden(true)
        }
    }

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!searchRef.current?.contains(event.target as Node)) {
                setShowSuggestions(false)
                setHighlightedIndex(-1)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    // Reset dialog state
    useEffect(() => {
        if (open && defaultValues) {
            setName(defaultValues.name || "")
            setCode(defaultValues.code || "")
            setCredits(defaultValues.credits?.toString() || "")
            setGrade(defaultValues.grade || "O")

            setSelectedCatalogCourse(null)
            setIsOverridden(false)
        } else if (open) {
            setName("")
            setCode("")
            setCredits("")
            setGrade("O")
            setSearchQuery("")
            setSuggestions([])

            setSelectedCatalogCourse(null)
            setIsOverridden(false)
        }

        setError(null)
        setShowSuggestions(false)
        setHighlightedIndex(-1)
    }, [open, defaultValues])

    // Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const creditsNum = Number.parseFloat(credits)
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
                code: code.trim() || null,
                credits: creditsNum,
                grade,
            })
            onOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save course")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Search for a course or enter details manually.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* SEARCH BOX */}
                        {!defaultValues && (
                            <div className="grid gap-2" ref={searchRef}>
                                <Label htmlFor="search">Search Course Catalog</Label>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                    <Input
                                        ref={inputRef}
                                        id="search"
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        onFocus={() =>
                                            searchQuery.length >= 2 &&
                                            suggestions.length > 0 &&
                                            setShowSuggestions(true)
                                        }
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type course code or name..."
                                        className="pl-9"
                                    />

                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                                            <ul ref={listRef} className="max-h-60 overflow-auto py-1">
                                                {suggestions.map((course, index) => (
                                                    <li
                                                        key={`${course.code}-${index}`}
                                                        className={cn(
                                                            "flex cursor-pointer items-center gap-2 px-3 py-2",
                                                            highlightedIndex === index
                                                                ? "bg-accent border-l-2 border-l-primary"
                                                                : "hover:bg-accent",
                                                        )}
                                                        onClick={() => handleSelectCourse(course)}
                                                        onMouseEnter={() => setHighlightedIndex(index)}
                                                    >
                                                        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="font-mono text-xs shrink-0">
                                                                    {course.code}
                                                                </Badge>

                                                                <span className="text-sm font-medium truncate">
                                  {course.name}
                                </span>
                                                            </div>

                                                            <div className="text-xs text-muted-foreground">
                                                                {course.credits} credits
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SELECTED COURSE PREVIEW */}
                        {selectedCatalogCourse && !isOverridden && (
                            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline" className="font-mono">
                                        {selectedCatalogCourse.code}
                                    </Badge>
                                    <span className="font-medium">{selectedCatalogCourse.name}</span>
                                    <span className="text-muted-foreground">
                    ({selectedCatalogCourse.credits} cr)
                  </span>
                                </div>
                            </div>
                        )}

                        {/* OVERRIDE WARNING */}
                        {isOverridden && (
                            <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-sm text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>Editing will override catalog values for this course instance.</span>
                            </div>
                        )}

                        {/* COURSE FIELDS */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Course Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="e.g., Data Structures"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="code">Course Code (optional)</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                placeholder="e.g., CS301"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="credits">Credits</Label>
                                <Input
                                    id="credits"
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={credits}
                                    onChange={(e) => handleCreditsChange(e.target.value)}
                                    placeholder="e.g., 3"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="grade">Grade</Label>
                                <Select value={grade} onValueChange={(v) => setGrade(v as Grade)}>
                                    <SelectTrigger id="grade">
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

                        {error && <p className="text-sm text-destructive">{error}</p>}
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
