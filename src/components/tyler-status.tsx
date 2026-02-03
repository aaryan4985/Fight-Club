"use client";

import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

interface Message {
    id: string;
    content: string;
    createdAt: any;
}

export function TylerStatus() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "messages"),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => ({
                id: d.id,
                content: d.data().content,
                createdAt: d.data().createdAt
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="flex flex-col h-full border-l-2 border-zinc-800 pl-6 space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                Tyler's Judgment
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 max-h-[600px] flex flex-col-reverse">
                {messages.length === 0 && (
                    <div className="text-zinc-700 text-xs font-mono uppercase">System Idle.</div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                        <div className="text-zinc-600 text-[10px] font-mono uppercase">
                            {/* Only show time if strictly needed, simplicity is better */}
                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                        </div>
                        <div className="text-sm font-bold font-mono text-zinc-100 border-l border-zinc-700 pl-3">
                            "{msg.content}"
                        </div>
                    </div>
                ))}
            </div>
            {/* The flex-col-reverse and mapping order might need adjustment to show newest at bottom? 
                Actually chat usually is Newest at Bottom.
                My query is orderBy desc (Newest First).
                So messages[0] is newest.
                If I map normally, Newest is at TOP.
                User probably wants Newest at BOTTOM like a chat?
                Or Newest at TOP like a feed?
                Let's do Newest at TOP for a "System Log" feel, which fits the brutalist theme better than a "chat".
            */}
        </div>
    );
}

