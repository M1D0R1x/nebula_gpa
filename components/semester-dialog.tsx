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

interface SemesterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { label: string; index: number }) => Promise<void>
  nextIndex: number
}

export function SemesterDialog({ open, onOpenChange, onSubmit, nextIndex }: SemesterDialogProps) {
  const [label, setLabel] = useState("")
  const [index, setIndex] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLabel(`Semester ${nextIndex}`)
      setIndex(nextIndex.toString())
      setError(null)
    }
  }, [open, nextIndex])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const indexNum = Number.parseInt(index)
    if (isNaN(indexNum) || indexNum < 1) {
      setError("Semester index must be a positive integer")
      return
    }

    if (!label.trim()) {
      setError("Semester label is required")
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({ label: label.trim(), index: indexNum })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create semester")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Semester</DialogTitle>
          <DialogDescription>Create a new semester to track your courses.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Semester Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Semester 7"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="index">Semester Number</Label>
              <Input
                id="index"
                type="number"
                min="1"
                value={index}
                onChange={(e) => setIndex(e.target.value)}
                placeholder="e.g., 7"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Semester"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
