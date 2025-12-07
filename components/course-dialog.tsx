"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GRADES, type Grade, type Course } from "@/lib/types"

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<Course, "id" | "semester_id" | "created_at">) => Promise<void>
  title: string
  defaultValues?: Partial<Course>
}

export function CourseDialog({ open, onOpenChange, onSubmit, title, defaultValues }: CourseDialogProps) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [credits, setCredits] = useState("")
  const [grade, setGrade] = useState<Grade>("O")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && defaultValues) {
      setName(defaultValues.name || "")
      setCode(defaultValues.code || "")
      setCredits(defaultValues.credits?.toString() || "")
      setGrade(defaultValues.grade || "O")
    } else if (open) {
      setName("")
      setCode("")
      setCredits("")
      setGrade("O")
    }
    setError(null)
  }, [open, defaultValues])

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
          <DialogDescription>Enter the course details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Course Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Data Structures"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Course Code (optional)</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., CS301" />
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
                  onChange={(e) => setCredits(e.target.value)}
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
                        {g}
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
