import type { Grade } from "./types"

export type GradeCategory = "passed" | "failed" | "incomplete"

export function getGradeCategory(grade: Grade): GradeCategory {
    if (grade === "I") return "incomplete"
    if (["E", "F", "R"].includes(grade)) return "failed"
    return "passed"
}

export function getGradeColorClasses(grade: Grade): { text: string; bg: string; badge: string } {
    const category = getGradeCategory(grade)

    switch (category) {
        case "passed":
            return {
                text: "text-green-600 dark:text-green-500",
                bg: "bg-green-100 dark:bg-green-950",
                badge:
                    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800",
            }
        case "failed":
            return {
                text: "text-red-600 dark:text-red-500",
                bg: "bg-red-100 dark:bg-red-950",
                badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800",
            }
        case "incomplete":
            return {
                text: "text-gray-500 dark:text-gray-400",
                bg: "bg-gray-100 dark:bg-gray-800",
                badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
            }
    }
}
