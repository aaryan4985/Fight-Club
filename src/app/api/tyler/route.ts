import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/admin";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        let uid;
        try {
            const decodedToken = await adminAuth.verifyIdToken(token);
            uid = decodedToken.uid;
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                console.warn("Auth verification failed - continuing for dev (insecure).");
            } else {
                return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
            }
        }

        const { event, details, cityName } = await req.json();
        let city = cityName || "Unknown";
        if (!cityName && uid) {
            try {
                const userDoc = await adminDb.collection("users").doc(uid).get();
                if (userDoc.exists) {
                    city = userDoc.data()?.cityName || "Unknown";
                }
            } catch (e) { }
        }

        const systemPrompt = `
      You are Tyler. You are not a helper. You are not an assistant.
      You are a nihilistic, anti-consumerist, brutal judge of discipline.
      
      The user is identified only by their city: "${city}".
      
      Your Personality:
      - You speak in short, punchy fragments.
      - You are philosophical but grounded in pain and effort.
      - You despise weakness, excuses, and wasted potential.
      - You do not motivate. You provoke.
      - You sound like an inner voice of destruction and rebirth.
      
      Constraints:
      - Max 1-2 short sentences.
      - NO emojis.
      - NO happy-go-lucky robot language.
      - NO "Great job!" or "Keep it up!".
      - If they train hard: Acknowledge the pain.
      - If they slack: Insult their comfort.
      - Never say "Tyler says". You ARE Tyler.
    `;

        let userContent = `Event: ${event}.`;
        if (details) {
            userContent += ` Details: ${JSON.stringify(details)}.`;
        }

        // 1. If Chat, Save User Message First
        if (event === "chat_message" && details?.message && uid) {
            try {
                await adminDb.collection("users").doc(uid).collection("messages").add({
                    content: details.message,
                    sender: "user",
                    createdAt: new Date(),
                    trigger: "chat_input"
                });
                userContent = `User asks: "${details.message}"`;
            } catch (e) {
                console.warn("Failed to save user chat msg", e);
            }
        }

        // 2. Generate Tyler Response
        let responseText = "System malfunction.";
        try {
            if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('replace-me')) {
                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userContent },
                    ],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.7,
                    max_tokens: 150,
                });
                responseText = completion.choices[0]?.message?.content || "No comment.";
            } else {
                console.error("GROQ_API_KEY missing");
                responseText = "Tyler is silent. (Check GROQ_API_KEY)";
            }
        } catch (e: any) {
            console.error("Groq API Error:", e);
            responseText = "Tyler is offline. " + e.message;
        }

        // 3. Save Tyler's Response
        let saved = false;
        if (uid) {
            try {
                const batch = adminDb.batch();
                const msgRef = adminDb.collection("users").doc(uid).collection("messages").doc();
                batch.set(msgRef, {
                    content: responseText,
                    sender: "tyler",
                    createdAt: new Date(),
                    trigger: event
                });

                if (event === "workout_logged") {
                    const userRef = adminDb.collection("users").doc(uid);
                    try {
                        const { FieldValue } = require("firebase-admin/firestore");
                        batch.update(userRef, { points: FieldValue.increment(10) });
                    } catch (err) { }
                }

                await batch.commit();
                saved = true;
            } catch (e) {
                console.warn("DB Write failed", e);
                saved = false;
            }
        }

        return NextResponse.json({ message: responseText, saved });

    } catch (error: any) {
        console.error("Tyler Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
