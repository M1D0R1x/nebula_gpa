import type { Grade } from "./types"
import { getGradeStyle } from "./grade-utils"

export type GradeCategory = "passed" | "failed" | "incomplete"

export function getGradeCategory(grade: Grade): GradeCategory {
    if (grade === "I") return "incomplete"
    if (["E", "F", "R"].includes(grade)) return "failed"
    return "passed"
}

export function getGradeColorClasses(grade: Grade) {
    const style = getGradeStyle(grade)

    return {
        text: style.textClass,
        bg: style.bgClass,
        badge: `${style.bgClass} ${style.borderClass}`,
    }
}
