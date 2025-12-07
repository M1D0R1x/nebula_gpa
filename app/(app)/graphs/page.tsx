import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GraphsContent } from "./graphs-content"
import type { Semester } from "@/lib/types"

export default async function GraphsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch semesters with courses
  const { data: semesters } = await supabase
    .from("semesters")
    .select("*, courses(*)")
    .eq("user_id", user.id)
    .order("index", { ascending: true })

  return <GraphsContent semesters={(semesters as Semester[]) || []} />
}
