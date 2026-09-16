import { apiError } from "@/lib/api-auth";
import { getTodayMeal } from "@/lib/neis";

export async function GET() {
  try {
    const meal = await getTodayMeal();
    return Response.json(
      { meal },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
