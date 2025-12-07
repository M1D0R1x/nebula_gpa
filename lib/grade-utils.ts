import type { Grade } from "./types"

export interface GradeStyle {
  textClass: string
  bgClass: string
  chartColor: string
  borderClass: string
}

export function getGradeStyle(grade: Grade): GradeStyle {
  switch (grade) {
    case "O":
    case "A+":
    case "A":
    case "B+":
    case "B":
    case "C":
    case "D":
      return {
        textClass: "text-green-600 dark:text-green-500",
        bgClass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        chartColor: "#22c55e",
        borderClass: "border-green-500",
      }
    case "E":
    case "F":
    case "R":
      return {
        textClass: "text-red-600 dark:text-red-500",
        bgClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        chartColor: "#ef4444",
        borderClass: "border-red-500",
      }
    case "I":
      return {
        textClass: "text-gray-500 dark:text-gray-400",
        bgClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        chartColor: "#9ca3af",
        borderClass: "border-gray-400",
      }
    default:
      return {
        textClass: "text-gray-600",
        bgClass: "bg-gray-100 text-gray-600",
        chartColor: "#6b7280",
        borderClass: "border-gray-400",
      }
  }
}

// Convenience helpers that use the unified getGradeStyle
export function getGradeColorClass(grade: Grade): string {
  return getGradeStyle(grade).textClass
}

export function getGradeBgClass(grade: Grade): string {
  return getGradeStyle(grade).bgClass
}

export function getGradeChartColor(grade: Grade): string {
  return getGradeStyle(grade).chartColor
}

export function getGradeBorderClass(grade: Grade): string {
  return getGradeStyle(grade).borderClass
}
