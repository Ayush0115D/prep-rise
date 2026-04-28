"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

// ⭐ NEW FUNCTION - ADD THIS
export async function updateInterviewTranscript(params: {
  interviewId: string;
  transcript: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { interviewId, transcript } = params;
    console.log("💾 Saving transcript for interview:", interviewId);

    await db.collection("interviews").doc(interviewId).update({
      transcript: transcript,
      finalized: true,
      updatedAt: new Date().toISOString(),
    });

    console.log("✅ Transcript saved successfully!");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error updating interview transcript:", error);
    return { success: false, error: error.message };
  }
}

// EXISTING - Keep as is
export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
      You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
      Transcript:
      ${formattedTranscript}

      Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
      - **Communication Skills**: Clarity, articulation, structured responses.
      - **Technical Knowledge**: Understanding of key concepts for the role.
      - **Problem-Solving**: Ability to analyze problems and propose solutions.
      - **Cultural & Role Fit**: Alignment with company values and job role.
      - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
      `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

// EXISTING - Keep as is
export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

// EXISTING - Keep as is
export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

// EXISTING - Keep as is
export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  try {
    // Get all finalized interviews (no userId filter in query)
    const interviews = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    // Filter out current user's interviews locally
    const otherUsersInterviews = interviews.docs
      .filter((doc) => {
        const docUserId = doc.data().userId;
        return userId ? docUserId !== userId : true;
      })
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Interview[];

    console.log(`✅ Found ${otherUsersInterviews.length} interviews from other users`);
    return otherUsersInterviews;
  } catch (error: any) {
    console.error("Error fetching latest interviews:", error);
    return null;
  }
}

//  UPDATED
export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  try {
    // ⭐ SIMPLIFIED - NO COMPOSITE INDEX NEEDED
    const interviews = await db
      .collection("interviews")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    console.log(`✅ Found ${interviews.docs.length} interviews for user ${userId}`);

    // Filter finalized locally (not in query)
    const finalizedInterviews = interviews.docs
      .filter((doc) => doc.data().finalized === true)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Interview[];

    return finalizedInterviews;
  } catch (error: any) {
    console.error("❌ Error fetching interviews:", error);
    return null;
  }
}
export async function createInterview(params: {
  userId: string;
  role: string;
  level: string;
  techstack: string[];
  type: string;
  questions: string[];
}) {
  try {
    const { userId, role, level, techstack, type, questions } = params;

    console.log("💾 Creating interview...");

    const docRef = await db.collection("interviews").add({
      userId,
      role,
      level,
      techstack,
      type,
      questions,
      transcript: "",
      finalized: false,
      createdAt: new Date().toISOString(),
    });

    console.log("✅ Interview created:", docRef.id);
    return { success: true, interviewId: docRef.id };
  } catch (error: any) {
    console.error("❌ Error creating interview:", error);
    return { success: false, error: error.message };
  }
}