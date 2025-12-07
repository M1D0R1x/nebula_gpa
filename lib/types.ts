export type Grade = "O" | "A+" | "A" | "B+" | "B" | "C" | "D" | "E" | "F" | "R" | "I"

export const GRADE_POINTS: Record<Grade, number | null> = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  D: 4,
  E: 0,
  F: 0,
  R: 0,
  I: null, // Incomplete - not counted
}

export const GRADES: Grade[] = ["O", "A+", "A", "B+", "B", "C", "D", "E", "F", "R", "I"]

export interface Course {
  id: string
  semester_id: string
  name: string
  code: string | null
  credits: number
  grade: Grade
  created_at: string
}

export interface Semester {
  id: string
  user_id: string
  index: number
  label: string
  created_at: string
  courses?: Course[]
}

export interface Profile {
  id: string
  username: string
  created_at: string
}

export class CatalogCourse {
}