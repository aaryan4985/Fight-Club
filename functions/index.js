const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const Groq = require("groq-sdk");

initializeApp();
const db = getFirestore();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. Points Calculation & Leaderboard Update
exports.onWorkoutLogged = onDocumentCreated("workouts/{workoutId}", async (event) => {
    const workout = event.data.data();
    const uid = workout.uid;

    if (!uid) return;

    // Calculate points (Simple Logic)
    // 10 pts base + 1 pt per 10kg + 1 pt per 10 mins
    let points = 10;
    if (workout.weight) points += Math.floor(Number(workout.weight) / 10);
    if (workout.duration) points += Math.floor(Number(workout.duration) / 10);

    const userRef = db.collection("users").doc(uid);
    
    // Atomically increment points
    await userRef.update({
        points: FieldValue.increment(points),
        lastWorkoutAt: FieldValue.serverTimestamp()
    });
});

// 2. Tyler Response (Async Trigger)
// Note: In the Next.js app we handle this via API for speed, but this is the robust background method.
exports.generateTylerResponse = onDocumentCreated("workouts/{workoutId}", async (event) => {
    const workout = event.data.data();
    const uid = workout.uid;
    const userSnap = await db.collection("users").doc(uid).get();
    const city = userSnap.data()?.cityName || "Unknown";

    const systemPrompt = `You are Tyler. Cold, brutal, factual. User: ${city}. Event: Workout Logged. Rules: 1 sentence. No emotion.`;
    const userContent = `Logged: ${workout.exercise} ${workout.sets}x${workout.reps} ${workout.weight}kg.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
            model: "mixtral-8x7b-32768",
            max_tokens: 60
        });

        const responseText = completion.choices[0]?.message?.content || "Noted.";

        await db.collection("users").doc(uid).collection("messages").add({
            content: responseText,
            trigger: "workout_logged_background",
            createdAt: FieldValue.serverTimestamp()
        });

    } catch (e) {
        console.error("Groq Error", e);
    }
});
