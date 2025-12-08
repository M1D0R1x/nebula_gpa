import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AttendanceContent from "@/components/attendance-content"

export default async function AttendancePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    const { data } = await supabase
        .from("attendance_profiles")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle()

    const initialData = (data?.data as any) ?? null

    return <AttendanceContent initialData={initialData} />
}
