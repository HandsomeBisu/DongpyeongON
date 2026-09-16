import { apiError, verifyOnboardedApiRequest } from "@/lib/api-auth";
import { getTodayTimetable } from "@/lib/neis";

export async function GET(request: Request) {
  try {
    const { profile } = await verifyOnboardedApiRequest(request);
    const grade = Number(profile.grade);
    const classNumber = Number(profile.classNumber);
    if (
      !Number.isInteger(grade) ||
      grade < 1 ||
      grade > 3 ||
      !Number.isInteger(classNumber) ||
      classNumber < 1 ||
      classNumber > 6
    )
      throw new Error("FORBIDDEN");
    const timetable = await getTodayTimetable(grade, classNumber);
    return Response.json(
      { timetable },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
