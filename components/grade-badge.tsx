import { Badge } from "@/components/ui/badge"
import { getGradeColorClasses } from "@/lib/grade-colors"
import type { Grade } from "@/lib/types"
import { cn } from "@/lib/utils"

interface GradeBadgeProps {
    grade: Grade
    className?: string
}

export function GradeBadge({ grade, className }: GradeBadgeProps) {
    const colors = getGradeColorClasses(grade)

    return (
        <Badge variant="outline" className={cn(colors.badge, className)}>
            {grade}
        </Badge>
    )
}
