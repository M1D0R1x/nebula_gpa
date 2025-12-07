import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PredictorContent } from "./predictor-content"
import type { Semester } from "@/lib/types"

export default async function PredictorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch official semesters with courses
  const { data: semesters, error } = await supabase
    .from("semesters")
    .select(
      `
      *,
      courses (*)
    `,
    )
    .eq("user_id", user.id)
    .order("index", { ascending: true })

  if (error) {
    console.error("Error fetching semesters:", error)
  }

  return <PredictorContent officialSemesters={(semesters as Semester[]) || []} userId={user.id} />
}
