import { db } from "@/firebase/admin";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return Response.json(
                { success: false, error: "userId is required" },
                { status: 400 }
            );
        }

        // Get the most recent interview for this user
        const latestInterview = await db
            .collection("interviews")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (latestInterview.empty) {
            return Response.json(
                { success: false, error: "No interviews found" },
                { status: 404 }
            );
        }

        const interviewDoc = latestInterview.docs[0];
        const interviewId = interviewDoc.id;
        const interviewData = interviewDoc.data();

        console.log("Latest interview for user", userId, ":", interviewId);

        return Response.json(
            {
                success: true,
                interviewId,
                interview: interviewData,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching latest interview:", error);
        return Response.json(
            { success: false, error: "Failed to fetch interview" },
            { status: 500 }
        );
    }
}
