import { type Grade, GRADE_POINTS } from "./types"

export interface CourseForGpa {
  grade: Grade
  credits: number
}

/**
 * Compute GPA for a list of courses.
 * Rules:
 * - Grades O, A+, A, B+, B, C, D have their respective grade points
 * - E, F, R count as 0 grade points but credits ARE included in denominator
 * - I (Incomplete) is excluded from both numerator and denominator
 *
 * @returns GPA value or null if no valid courses (all I grades)
 */
export function computeGpa(courses: CourseForGpa[]): number | null {
  let totalPoints = 0
  let totalCredits = 0

  for (const course of courses) {
    const gradePoint = GRADE_POINTS[course.grade]

    // Skip incomplete grades entirely
    if (gradePoint === null) continue

    totalPoints += gradePoint * course.credits
    totalCredits += course.credits
  }

  if (totalCredits === 0) return null

  return totalPoints / totalCredits
}

/**
 * Compute SGPA for a single semester's courses
 */
export function computeSgpa(courses: CourseForGpa[]): number | null {
  return computeGpa(courses)
}

/**
 * Compute CGPA across all semesters
 * Note: This calculates from all courses directly, NOT averaging SGPAs
 */
export function computeCgpa(allCourses: CourseForGpa[]): number | null {
  return computeGpa(allCourses)
}

/**
 * Get total credits (excluding incomplete grades)
 */
export function getTotalCredits(courses: CourseForGpa[]): number {
  return courses.reduce((sum, course) => {
    if (GRADE_POINTS[course.grade] === null) return sum
    return sum + course.credits
  }, 0)
}

/**
 * Format GPA to 2 decimal places
 */
export function formatGpa(gpa: number | null): string {
  if (gpa === null) return "N/A"
  return gpa.toFixed(2)
}
