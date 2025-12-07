// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.SUPABASE_URL!,               // FIXED
        process.env.SUPABASE_SERVICE_ROLE_KEY!,  // FIXED (use only if you need privileged DB ops)
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Running in a static server context → safe to ignore
                    }
                },
            },
        }
    );
}
