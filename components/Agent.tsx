"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback, getLatestInterviewByUserId } from "@/lib/actions/general.action";

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
    profileImage,
}: AgentProps) => {
    const router = useRouter();
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastMessage, setLastMessage] = useState<string>("");

    // FIX #1: Guard so feedback/generation logic only fires once
    const hasHandledFinish = useRef(false);

    useEffect(() => {
        const onCallStart = () => {
            setCallStatus(CallStatus.ACTIVE);
        };

        // FIX #2: Only onCallEnd sets FINISHED — handleDisconnect no longer does
        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
        };

        const onMessage = (message: Message) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                const newMessage = { role: message.role, content: message.transcript };
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const onSpeechStart = () => {
            console.log("speech start");
            setIsSpeaking(true);
        };

        const onSpeechEnd = () => {
            console.log("speech end");
            setIsSpeaking(false);
        };

        const onError = (error: Error) => {
            console.log("Vapi Error:", error);
            setCallStatus(CallStatus.INACTIVE);
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
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            setLastMessage(messages[messages.length - 1].content);
        }

        const handleGenerateFeedback = async (messages: SavedMessage[]) => {
            console.log("handleGenerateFeedback");

            const { success, feedbackId: id } = await createFeedback({
                interviewId: interviewId!,
                userId: userId!,
                transcript: messages,
                feedbackId,
            });

            if (success && id) {
                router.push(`/interview/${interviewId}/feedback`);
            } else {
                console.log("Error saving feedback");
                router.push("/");
            }
        };

        // FIX #3: Retry loop instead of a single hardcoded 2s wait
        const handleInterviewGeneration = async () => {
            let latestInterview = null;
            let attempts = 0;

            while (!latestInterview && attempts < 10) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                latestInterview = await getLatestInterviewByUserId(userId!);
                attempts++;
            }

            if (latestInterview) {
                router.push(`/interview/${latestInterview.id}`);
            } else {
                console.log("No interview found after retries");
                router.push("/");
            }
        };

        // FIX #1 cont: hasHandledFinish ref prevents this block running multiple times
        if (callStatus === CallStatus.FINISHED && !hasHandledFinish.current) {
            hasHandledFinish.current = true;

            if (type === "generate") {
                handleInterviewGeneration();
            } else {
                handleGenerateFeedback(messages);
            }
        }
    }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        if (type === "generate") {
            try {
                await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
                    variableValues: {
                        username: userName,
                        userid: userId,
                    },
                });
            } catch (error) {
                console.error("Error starting Vapi workflow:", error);
                setCallStatus(CallStatus.INACTIVE);
            }
        } else {
            // FIX #4: Added try/catch for the interview-type vapi.start (was missing before)
            try {
                let formattedQuestions = "";
                if (questions) {
                    formattedQuestions = questions
                        .map((question) => `- ${question}`)
                        .join("\n");
                }

                await vapi.start(interviewer, {
                    variableValues: {
                        questions: formattedQuestions,
                    },
                });
            } catch (error) {
                console.error("Error starting Vapi interview:", error);
                setCallStatus(CallStatus.INACTIVE);
            }
        }
    };

    // FIX #2: Only call vapi.stop() — let the "call-end" event set FINISHED naturally
    // Previously setCallStatus(FINISHED) was called here too, causing a double-trigger
    const handleDisconnect = () => {
        vapi.stop();
    };

    return (
        <>
            <div className="call-view">
                {/* AI Interviewer Card */}
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

                {/* User Profile Card */}
                <div className="card-border">
                    <div className="card-content">
                        <Image
                            src={profileImage || "/user-avatar.png"}
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
                    <button className="relative btn-call" onClick={handleCall}>
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
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>
        </>
    );
};

export default Agent;