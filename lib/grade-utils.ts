import type { Grade } from "./types"

// Grade color utility functions
export function getGradeColorClass(grade: Grade): string {
  switch (grade) {
    case "O":
    case "A+":
    case "A":
    case "B+":
    case "B":
    case "C":
    case "D":
      return "text-green-600"
    case "E":
    case "F":
    case "R":
      return "text-red-600"
    case "I":
      return "text-muted-foreground"
    default:
      return ""
  }
}

export function getGradeBgClass(grade: Grade): string {
  switch (grade) {
    case "O":
    case "A+":
    case "A":
    case "B+":
    case "B":
    case "C":
    case "D":
      return "bg-green-100 text-green-800"
    case "E":
    case "F":
    case "R":
      return "bg-red-100 text-red-800"
    case "I":
      return "bg-gray-100 text-gray-600"
    default:
      return ""
  }
}

export function getGradeChartColor(grade: Grade): string {
  switch (grade) {
    case "O":
    case "A+":
    case "A":
    case "B+":
    case "B":
    case "C":
    case "D":
      return "#22c55e" // green-500
    case "E":
    case "F":
    case "R":
      return "#ef4444" // red-500
    case "I":
      return "#9ca3af" // gray-400
    default:
      return "#6b7280"
  }
}
