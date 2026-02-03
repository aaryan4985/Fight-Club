"use client";

import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { collection, limit, onSnapshot, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";

interface Message {
    id: string;
    content: string;
    sender: "tyler" | "user";
    createdAt: any;
}

export function TylerStatus() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "messages"),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => ({
                id: d.id,
                content: d.data().content,
                sender: d.data().sender || "tyler", // Default to Tyler for old messages
                createdAt: d.data().createdAt
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [user]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user || sending) return;

        const text = input.trim();
        setInput("");
        setSending(true);

        try {
            // 1. Client-Side User Save (Reliable)
            await addDoc(collection(db, "users", user.uid, "messages"), {
                content: text,
                sender: "user",
                createdAt: serverTimestamp(),
                trigger: "chat_input"
            });

            // 2. Call API
            const token = await user.getIdToken();
            const res = await fetch("/api/tyler", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    event: "chat_message",
                    details: { message: text }
                })
            });

            // 3. Client-Side Tyler Save (Fallback)
            const data = await res.json();
            if (data.message && data.saved === false) {
                await addDoc(collection(db, "users", user.uid, "messages"), {
                    content: data.message,
                    sender: "tyler",
                    createdAt: serverTimestamp(),
                    trigger: "chat_fallback"
                });
            }

        } catch (e) {
            console.error("Chat Error", e);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] border-l-2 border-zinc-800 pl-6 gap-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                Tyler's Judgment
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col-reverse gap-4">
                {messages.length === 0 && (
                    <div className="text-zinc-700 text-xs font-mono uppercase text-center mt-auto">Speak to the void.</div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end text-right" : "items-start text-left"}`}>
                        <div className="text-zinc-600 text-[9px] font-mono uppercase mb-1">
                            {msg.sender === "user" ? "YOU" : "TYLER"} • {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </div>
                        <div className={`text-sm font-mono max-w-[90%] p-2 border ${msg.sender === "user" ? "border-zinc-700 bg-zinc-900/50 text-zinc-300" : "border-white bg-black text-white font-bold"}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-zinc-900">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="CONFRONT TYLER..."
                    className="flex-1 bg-transparent border-b border-zinc-800 focus:border-white outline-none py-2 text-sm font-mono text-white placeholder:text-zinc-700 uppercase"
                />
                <button
                    type="submit"
                    disabled={sending || !input}
                    className="text-xs font-bold uppercase text-white hover:text-red-500 disabled:opacity-50 transition-colors"
                >
                    {sending ? "..." : "SEND"}
                </button>
            </form>
        </div>
    );
}
