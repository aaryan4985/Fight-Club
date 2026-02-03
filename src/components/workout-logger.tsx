"use client";

import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

export function WorkoutLogger({ cityName }: { cityName: string | null }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState({
        exercise: "",
        sets: "",
        reps: "",
        weight: "",
        duration: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLog({ ...log, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || (!log.exercise)) return;

        setLoading(true);
        try {
            // 1. Save Workout
            await addDoc(collection(db, "workouts"), {
                uid: user.uid,
                ...log,
                createdAt: serverTimestamp()
            });

            // 2. Trigger Tyler
            const token = await user.getIdToken();
            const res = await fetch("/api/tyler", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    event: "workout_logged",
                    cityName: cityName,
                    details: log
                })
            });

            const data = await res.json();

            // If API says not saved (e.g. dev mode without service account), save manually
            if (data.message && data.saved === false) {
                await addDoc(collection(db, "users", user.uid, "messages"), {
                    content: data.message,
                    createdAt: serverTimestamp(),
                    trigger: "workout_logged_client_fallback"
                });
            }

            // Reset
            setLog({ exercise: "", sets: "", reps: "", weight: "", duration: "" });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="brutal-card space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Log Activity</h2>

            <div className="grid grid-cols-1 gap-4">
                <input
                    name="exercise"
                    value={log.exercise}
                    onChange={handleChange}
                    placeholder="EXERCISE NAME"
                    className="brutal-input uppercase"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <input
                        name="sets"
                        type="number"
                        value={log.sets}
                        onChange={handleChange}
                        placeholder="SETS"
                        className="brutal-input"
                    />
                    <input
                        name="reps"
                        type="number"
                        value={log.reps}
                        onChange={handleChange}
                        placeholder="REPS"
                        className="brutal-input"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <input
                        name="weight"
                        type="number"
                        value={log.weight}
                        onChange={handleChange}
                        placeholder="WEIGHT (KG)"
                        className="brutal-input"
                    />
                    <input
                        name="duration"
                        type="number"
                        value={log.duration}
                        onChange={handleChange}
                        placeholder="DURATION (MIN)"
                        className="brutal-input"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 brutal-btn"
            >
                {loading ? "PROCESSING..." : "COMMIT"}
            </button>
        </form>
    );
}
