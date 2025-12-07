"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface ApplyChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  modifiedCoursesCount: number
  affectedSemestersCount: number
}

export function ApplyChangesDialog({
  open,
  onOpenChange,
  onConfirm,
  modifiedCoursesCount,
  affectedSemestersCount,
}: ApplyChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Apply Changes to Official Record?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to overwrite your official academic record with the predicted values. This will update what
              appears on your Dashboard and Graphs.
            </p>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium text-foreground">Summary of changes:</p>
              <ul className="mt-1 list-disc list-inside text-muted-foreground">
                <li>
                  {modifiedCoursesCount} course{modifiedCoursesCount !== 1 ? "s" : ""} modified
                </li>
                <li>
                  {affectedSemestersCount} semester{affectedSemestersCount !== 1 ? "s" : ""} affected
                </li>
              </ul>
            </div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
              This action cannot be easily undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-amber-600 text-white hover:bg-amber-700">
            Yes, overwrite my official data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
