export function roundSubject(p: number) {
    return Math.round(p);
}

export function roundOverall(p: number) {
    return Math.ceil(p);
}

export function getAttendanceColor(p: number) {
    if (p < 65) return "text-red-800 dark:text-red-700";
    if (p < 75) return "text-red-600 dark:text-red-500";
    return "text-green-600 dark:text-green-400";
}

export function bonusForTerm(p: number) {
    if (p >= 90) return 10;
    if (p >= 85) return 8;
    if (p >= 80) return 6;
    if (p >= 75) return 4;
    return 0;
}

export function computeCondonation(
    current: number,
    prev1: number | null,
    prev2: number | null,
) {
    // New rule: Only when 65 ≤ current < 75
    if (current >= 75) {
        return {
            bonus: 0,
            effective: current,
            eligible: true,
            reason: "Attendance already ≥ 75%. No condonation needed.",
        };
    }

    if (current < 65) {
        return {
            bonus: 0,
            effective: current,
            eligible: false,
            reason: "Current term < 65%. Cannot apply condonation.",
        };
    }

    const b1 = prev1 ? bonusForTerm(prev1) : 0;
    const b2 = prev2 ? bonusForTerm(prev2) : 0;

    const bonus = Math.min(10, b1 + b2);
    const effective = current + bonus;

    return {
        bonus,
        effective,
        eligible: effective >= 75,
        reason: bonus > 0 ? `Condonation applied: +${bonus}%` : "No bonus from previous terms.",
    };
}
