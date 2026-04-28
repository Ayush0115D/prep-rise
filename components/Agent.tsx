"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { 
  createFeedback, 
  updateInterviewTranscript,
  createInterview 
} from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Parse interview data from transcript
  const parseInterviewData = (messages: SavedMessage[]) => {
    const fullTranscript = messages
      .map((msg) => msg.content)
      .join(" ");

    const startMarker = "---INTERVIEW_DATA_START---";
    const endMarker = "---INTERVIEW_DATA_END---";

    const startIdx = fullTranscript.indexOf(startMarker);
    const endIdx = fullTranscript.indexOf(endMarker);

    if (startIdx === -1 || endIdx === -1) {
      console.log("❌ Interview data markers not found");
      return null;
    }

    const dataSection = fullTranscript.substring(
      startIdx + startMarker.length,
      endIdx
    );

    try {
      // Parse ROLE
      const roleMatch = dataSection.match(/ROLE:\s*([^\n]+)/i);
      const role = roleMatch ? roleMatch[1].trim() : "";

      // Parse LEVEL
      const levelMatch = dataSection.match(/LEVEL:\s*([^\n]+)/i);
      const level = levelMatch ? levelMatch[1].trim() : "";

      // Parse TECHSTACK
      const techMatch = dataSection.match(/TECHSTACK:\s*([^\n]+)/i);
      const techstack = techMatch
        ? techMatch[1].split(",").map((t) => t.trim())
        : [];

      // Parse TYPE
      const typeMatch = dataSection.match(/TYPE:\s*([^\n]+)/i);
      const interviewType = typeMatch ? typeMatch[1].trim() : "";

      // Parse QUESTIONS
      const questionsMatch = dataSection.match(
        /QUESTIONS:\s*([\s\S]*?)(?:---|\Z)/i
      );
      const questionsText = questionsMatch ? questionsMatch[1] : "";
      const questionsList = questionsText
        .split("\n")
        .filter((q) => q.trim().startsWith("-") || q.trim().startsWith("•"))
        .map((q) => q.replace(/^[-•]\s*/, "").trim())
        .filter((q) => q.length > 0);

      console.log("✅ Parsed Interview Data:", {
        role,
        level,
        techstack,
        interviewType,
        questions: questionsList,
      });

      return {
        role,
        level,
        techstack,
        type: interviewType,
        questions: questionsList,
      };
    } catch (error) {
      console.error("❌ Error parsing interview data:", error);
      return null;
    }
  };

  useEffect(() => {
    const onCallStart = () => {
      console.log("📞 Call started");
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = async () => {
      console.log("📞 Call ended, preparing to save...");
      setCallStatus(CallStatus.FINISHED);

      // If type is "generate" - parse and save interview
      if (type === "generate") {
        setIsSaving(true);
        try {
          const interviewData = parseInterviewData(messages);

          if (!interviewData) {
            toast.error("Could not parse interview data");
            router.push("/");
            return;
          }

          console.log("💾 Creating interview with data:", interviewData);

          const result = await createInterview({
            userId: userId!,
            role: interviewData.role,
            level: interviewData.level,
            techstack: interviewData.techstack,
            type: interviewData.type,
            questions: interviewData.questions,
          });

          if (result.success) {
            console.log("✅ Interview created:", result.interviewId);
            toast.success("Interview created! Redirecting...");
            setTimeout(() => {
              router.push(`/interview/${result.interviewId}`);
            }, 1000);
          } else {
            console.error("❌ Failed to create interview:", result.error);
            toast.error("Failed to create interview: " + result.error);
            router.push("/");
          }
        } catch (error) {
          console.error("❌ Error:", error);
          toast.error("Error creating interview");
          router.push("/");
        } finally {
          setIsSaving(false);
        }
      } 
      // If type is "interview" - save transcript and generate feedback
      else if (type === "interview" && messages.length > 0 && interviewId) {
        setIsSaving(true);
        try {
          const transcript = messages
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n");

          console.log("💾 Saving transcript...");

          const saveResult = await updateInterviewTranscript({
            interviewId,
            transcript,
          });

          if (saveResult.success) {
            console.log("✅ Transcript saved!");
            toast.success("Interview completed!");
          } else {
            console.error("❌ Failed to save:", saveResult.error);
            toast.error("Failed to save: " + saveResult.error);
          }
        } catch (error) {
          console.error("❌ Error:", error);
          toast.error("Error saving interview");
        } finally {
          setIsSaving(false);
        }
      }
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
        console.log("📝 Message captured:", newMessage);
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.error("❌ Vapi Error:", error);
      setCallStatus(CallStatus.INACTIVE);
      toast.error("Interview error: " + error.message);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [messages, type, interviewId, userId, router]);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("🎯 Generating feedback...");

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        console.log("✅ Feedback generated!");
        setTimeout(() => {
          router.push(`/interview/${interviewId}/feedback`);
        }, 1000);
      } else {
        console.log("❌ Error generating feedback");
        toast.error("Error generating feedback");
        router.push("/");
      }
    };

    // For interview type - generate feedback after saving
    if (
      type === "interview" &&
      callStatus === CallStatus.FINISHED &&
      !isSaving
    ) {
      handleGenerateFeedback(messages);
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId, isSaving]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    try {
      if (type === "generate") {
        console.log("🎤 Starting generation assistant...");
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
          variableValues: {
            userName: userName,
            userId: userId,
          },
        });
      } else {
        let formattedQuestions = "";
        if (questions) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        }

        console.log("🎤 Starting interview assistant...");
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
          variableValues: {
            questions: formattedQuestions,
            userName: userName,
            userId: userId,
          },
        });
      }

      console.log("✅ Call started");
    } catch (error) {
      console.error("❌ Error:", error);
      setCallStatus(CallStatus.INACTIVE);
      toast.error("Failed to start");
    }
  };

  const handleDisconnect = () => {
    console.log("⏹️ User ended call");
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;