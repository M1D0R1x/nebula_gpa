// Course catalog data for auto-fill functionality
import type { CatalogCourse } from "./types"

// Static catalog entries (no DB fields)
export type CatalogItem = Omit<CatalogCourse, "id" | "user_id">

export const DEFAULT_COURSE_CATALOG: CatalogItem[] = [
    { code: "CHE110", name: "Environmental Studies", credits: 4 },
    { code: "CSE111", name: "Orientation to Computing-I", credits: 2 },
    { code: "CSE326", name: "Internet Programming Laboratory", credits: 2 },
    { code: "ECE249", name: "Basic Electrical and Electronics Engineering", credits: 4 },
    { code: "ECE279", name: "Basic Electrical and Electronics Engineering Laboratory", credits: 1 },
    { code: "INT108", name: "Python Programming", credits: 4 },
    { code: "MTH174", name: "Engineering Mathematics", credits: 4 },
    { code: "PES318", name: "Soft Skills-I", credits: 3 },
    { code: "CSE101", name: "Computer Programming", credits: 3 },
    { code: "CSE121", name: "Orientation to Computing-II", credits: 1 },
    { code: "CSE320", name: "Software Engineering", credits: 3 },
    { code: "INT306", name: "Database Management Systems", credits: 4 },
    { code: "MEC135", name: "Basics of Mechanical Engineering", credits: 3 },
    { code: "MTH401", name: "Discrete Mathematics", credits: 3 },
    { code: "PEL125", name: "Upper Intermediate Communication Skills-I", credits: 3 },
    { code: "PHY110", name: "Engineering Physics", credits: 3 },
    { code: "CSE202", name: "Object Oriented Programming", credits: 4 },
    { code: "CSE205", name: "Data Structures and Algorithms", credits: 4 },
    { code: "CSE211", name: "Computer Organization and Design", credits: 4 },
    { code: "CSE306", name: "Computer Networks", credits: 3 },
    { code: "CSE307", name: "Internetworking Essentials", credits: 1 },
    { code: "GEN231", name: "Community Development Project", credits: 2 },
    { code: "MTH302", name: "Probability and Statistics", credits: 3 },
    { code: "PEL136", name: "Advanced Communication Skills-II", credits: 3 },
    { code: "CSE310", name: "Programming in Java", credits: 4 },
    { code: "CSE316", name: "Operating Systems", credits: 3 },
    { code: "CSE325", name: "Operating Systems Laboratory", credits: 1 },
    { code: "CSE408", name: "Design and Analysis of Algorithms", credits: 3 },
    { code: "INT217", name: "Introduction to Data Management", credits: 3 },
    { code: "INT232", name: "Data Science Toolbox: R Programming", credits: 3 },
    { code: "INT426", name: "Generative Artificial Intelligence", credits: 3 },
    { code: "PEA305", name: "Analytical Skills-I", credits: 3 },
    { code: "CSE322", name: "Formal Languages and Automation Theory", credits: 3 },
    { code: "CSE343", name: "Training in Programming", credits: 3 },
    { code: "INT233", name: "Data Visualization", credits: 3 },
    { code: "INT234", name: "Predictive Analytics", credits: 3 },
    { code: "JAP105", name: "Basic Japanese-I", credits: 3 },
    { code: "PEA306", name: "Analytical Skills-II", credits: 3 },
    { code: "PEL113", name: "Upper-Intermediate Verbal Ability", credits: 3 },
    { code: "CSE332", name: "Industry Ethics and Legal Issues", credits: 2 },
    { code: "CSE358", name: "Combinatorial Studies", credits: 4 },
    { code: "CSE393", name: "Online Academic Course", credits: 3 },
    { code: "INT312", name: "Big Data Fundamentals", credits: 3 },
    { code: "JAP106", name: "Basic Japanese-II", credits: 3 },
    { code: "PES319", name: "Soft Skills-II", credits: 3 },
]

// Fuzzy search function for course lookup
export function searchCatalog(
    query: string,
    catalog: CatalogItem[],
): CatalogItem[] {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase().trim()

    const scored = catalog.map((course) => {
        const lowerCode = course.code.toLowerCase()
        const lowerName = course.name.toLowerCase()
        let score = 0

        if (lowerCode === lowerQuery) score += 100
        else if (lowerCode.startsWith(lowerQuery)) score += 80
        else if (lowerCode.includes(lowerQuery)) score += 60

        if (lowerName === lowerQuery) score += 90
        else if (lowerName.startsWith(lowerQuery)) score += 70
        else if (lowerName.includes(` ${lowerQuery}`)) score += 50
        else if (lowerName.includes(lowerQuery)) score += 40

        const queryWords = lowerQuery.split(/\s+/)
        const nameWords = lowerName.split(/\s+/)

        for (const qw of queryWords) {
            if (qw.length >= 2) {
                for (const nw of nameWords) {
                    if (nw.startsWith(qw)) score += 20
                    else if (nw.includes(qw)) score += 10
                }
            }
        }

        return { course, score }
    })

    return scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((s) => s.course)
}
