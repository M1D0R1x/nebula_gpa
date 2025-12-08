export function roundSubject(p: number) {
    return Math.round(p)
}

export function roundOverall(p: number) {
    return Math.ceil(p)
}

export function bonusForTerm(p: number) {
    if (p >= 90) return 10
    if (p >= 85) return 8
    if (p >= 80) return 6
    if (p >= 75) return 4
    return 0
}

export function computeCondonation(
    current: number,
    prev1: number | null,
    prev2: number | null,
) {
    if (current < 65) {
        return {
            bonus: 0,
            effective: current,
            eligible: false,
            reason: "Current term aggregate < 65%. Condonation not allowed.",
        }
    }

    const b1 = prev1 != null ? bonusForTerm(prev1) : 0
    const b2 = prev2 != null ? bonusForTerm(prev2) : 0
    const bonus = Math.min(10, b1 + b2)
    const effective = current + bonus

    return {
        bonus,
        effective,
        eligible: effective >= 75,
        reason:
            bonus > 0
                ? `Eligible for ${bonus}% bonus from previous terms.`
                : "No bonus available from previous terms.",
    }
}
