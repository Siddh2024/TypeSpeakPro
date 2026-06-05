import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { logAsyncError } from '@/types/async';
import { createMutationLock } from '@/lib/mutation-locks';
import { createRealtimeMeta, isFreshRealtimeEvent, pruneStaleByHeartbeat, upsertById } from '@/lib/realtime-guards';

export type GameState = 'lobby' | 'countdown' | 'racing' | 'finished';

export interface Player {
    id: string;
    name: string;
    isReady: boolean;
    progress: number; // 0-100
    wpm: number;
    rank?: number;
    color?: string; // For avatar/track
    avatarUrl?: string;
    accuracy?: number;
    completionTime?: number;
    lastSeenAt?: number;
}

export interface RoomConfig {
    text: string;
    mode: 'words' | 'sentences' | 'paragraphs';
    duration: number;
    difficulty: 'easy' | 'medium' | 'hard';
}

export const useMultiplayer = (user: any) => {
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [gameState, setGameState] = useState<GameState>('lobby');
    const [players, setPlayers] = useState<Player[]>([]);
    const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
    const [countdown, setCountDown] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [playerId, setPlayerId] = useState<string>(user?.id || `guest_${Math.floor(Math.random() * 100000)}`);

    // Update playerId if user logs in
    useEffect(() => {
        if (user?.id) setPlayerId(user.id);
    }, [user]);

    // Internal Countdown Logic
    useEffect(() => {
        if (countdown === null) return;
        if (countdown > 0) {
            const timer = setTimeout(() => setCountDown(c => (c ? c - 1 : 0)), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setGameState('racing');
            setCountDown(null); // Clear countdown
        }
    }, [countdown]);

    const channelRef = useRef<RealtimeChannel | null>(null);
    const activeSubscriptionRef = useRef(0);
    const eventClockRef = useRef(new Map<string, number>());
    const mutationLockRef = useRef(createMutationLock());
    const sendSequenceRef = useRef(0);
    const lastProgressSendRef = useRef({ progress: 0, wpm: 0, sentAt: 0 });

    // Generate a random color for the player
    const myColor = useRef(`hsl(${Math.random() * 360}, 70%, 50%)`).current;

    const cleanup = useCallback(async () => {
        activeSubscriptionRef.current += 1;
        try {
            if (channelRef.current) {
                await supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        } catch (err) {
            logAsyncError("[useMultiplayer] cleanup", err);
        }
        setRoomCode(null);
        setPlayers([]);
        setGameState('lobby');
    }, []);

    const joinRoom = useCallback(async (code: string, isCreating: boolean = false) => {
        const joinLock = mutationLockRef.current.acquire(`join:${code}`, 1000);
        if (!joinLock.acquired) return;

        await cleanup();

        try {
            const subscriptionId = activeSubscriptionRef.current;
            const channel = supabase.channel(`typing_room_${code}`, {
                config: {
                    broadcast: { self: true } // We want to receive our own events for consistency
                }
            });

            channelRef.current = channel;
            setRoomCode(code);
            setIsHost(isCreating);

            // -- Event Listeners --

            // 1. New Player Joined (or existing players announcing themselves)
            channel.on('broadcast', { event: 'player_join' }, ({ payload }) => {
                if (subscriptionId !== activeSubscriptionRef.current) return;
                if (!isFreshRealtimeEvent(eventClockRef.current, `join:${payload.id}`, payload.meta?.eventTs)) return;
                if (import.meta.env.DEV) console.log("Player joined:", payload);
                setPlayers(prev => {
                    const existing = prev.find(p => p.id === payload.id);
                    return upsertById(prev, {
                        ...existing,
                        ...payload,
                        isReady: existing?.isReady ?? payload.isReady ?? false,
                        progress: existing?.progress ?? payload.progress ?? 0,
                        wpm: existing?.wpm ?? payload.wpm ?? 0,
                        lastSeenAt: Date.now(),
                    });
                });

                // If I am Host, and a new player joined, I should probably re-broadcast the room config
                // so they get it immediately.
                if (isCreating && roomConfig) {
                    setTimeout(() => {
                        channel.send({
                            type: 'broadcast',
                            event: 'room_config',
                            payload: { ...roomConfig, meta: createRealtimeMeta(++sendSequenceRef.current) }
                        });
                    }, 500);
                }
            });

            // 2. Room Config Sync
            channel.on('broadcast', { event: 'room_config' }, ({ payload }) => {
                if (subscriptionId !== activeSubscriptionRef.current) return;
                if (!isFreshRealtimeEvent(eventClockRef.current, 'room_config', payload.meta?.eventTs)) return;
                if (import.meta.env.DEV) console.log("Received Room Config:", payload);
                const { meta: _meta, ...config } = payload;
                setRoomConfig(config);
            });

            // 3. Player Ready Toggle
            channel.on('broadcast', { event: 'player_ready' }, ({ payload }) => {
                if (subscriptionId !== activeSubscriptionRef.current) return;
                if (!isFreshRealtimeEvent(eventClockRef.current, `ready:${payload.id}`, payload.meta?.eventTs)) return;
                setPlayers(prev => prev.map(p =>
                    p.id === payload.id ? { ...p, isReady: payload.isReady, lastSeenAt: Date.now() } : p
                ));
            });

            // 4. Game Start (Countdown)
            channel.on('broadcast', { event: 'game_start' }, ({ payload }) => {
                if (subscriptionId !== activeSubscriptionRef.current) return;
                if (!isFreshRealtimeEvent(eventClockRef.current, 'game_start', payload.meta?.eventTs)) return;
                setStartTime(payload.startTime ?? Date.now() + 3000);
                setGameState('countdown');
                // Reset progress
                setPlayers(prev => prev.map(p => ({ ...p, progress: 0, wpm: 0, rank: undefined })));
            });

            // 5. Progress Updates
            channel.on('broadcast', { event: 'player_progress' }, ({ payload }) => {
                if (subscriptionId !== activeSubscriptionRef.current) return;
                if (!isFreshRealtimeEvent(eventClockRef.current, `progress:${payload.userId}`, payload.meta?.eventTs)) return;
                setPlayers(prev => prev.map(p =>
                    p.id === payload.userId ? { ...p, progress: Math.max(p.progress, payload.progress), wpm: payload.wpm, lastSeenAt: Date.now() } : p
                ));
            });

            // 6. Player Finished
            channel.on('broadcast', { event: 'player_complete' }, ({ payload }) => {
                if (subscriptionId !== activeSubscriptionRef.current) return;
                if (!isFreshRealtimeEvent(eventClockRef.current, `complete:${payload.userId}`, payload.meta?.eventTs)) return;
                setPlayers(prev => {
                    const existing = prev.find(p => p.id === payload.userId);
                    // If already marked as finished/ranked, ignore (deduplicate)
                    if (existing?.rank || existing?.progress === 100) return prev;

                    // Calculate rank based on how many have ALREADY finished
                    const finishedCount = prev.filter(p => p.progress >= 100).length;

                    return prev.map(p =>
                        p.id === payload.userId
                            ? { ...p, progress: 100, wpm: payload.wpm, accuracy: payload.accuracy, rank: finishedCount + 1 }
                            : p
                    );
                });
            });

            // Subscribe
            const subscription = channel.subscribe(async (status) => {
                if (subscriptionId !== activeSubscriptionRef.current) return;
                if (import.meta.env.DEV) console.log(`[useMultiplayer] Room ${code} subscription status:`, status);
                if (status === 'SUBSCRIBED') {
                    // Announce self
                    const myProfile: Player = {
                        id: playerId,
                        name: (user?.user_metadata?.full_name || user?.email?.split('@')[0] || `Guest_${playerId.slice(-4)}`) || "Guest",
                        isReady: false,
                        progress: 0,
                        wpm: 0,
                        color: myColor || '#666',
                        avatarUrl: user?.user_metadata?.avatar_url || null,
                        lastSeenAt: Date.now(),
                    };

                    try {
                        await channel.send({
                            type: 'broadcast',
                            event: 'player_join',
                            payload: { ...myProfile, meta: createRealtimeMeta(++sendSequenceRef.current) }
                        });
                    } catch (err) {
                        logAsyncError("multiplayer.broadcastJoin", err);
                    }

                    // Optimistically add self to list
                    setPlayers(prev => {
                        const exists = prev.find(p => p.id === myProfile.id);
                        if (exists) return prev;
                        return [...prev, myProfile];
                    });

                    if (!isCreating) {
                        toast.success("Joined room successfully!");
                    }
                } else if (status === 'CHANNEL_ERROR') {
                    toast.error("Failed to connect to room. Check connection.");
                    logAsyncError("multiplayer.channel", code);
                } else if (status === 'TIMED_OUT') {
                    toast.error("Connection timed out. Retrying...");
                    logAsyncError("multiplayer.timeout", code);
                }
            });

            return () => {
                supabase.removeChannel(channel);
            };

        } catch (error) {
            logAsyncError("multiplayer.joinRoom", error);
            toast.error("Failed to join room");
            throw error;
        } finally {
            joinLock.release();
        }

    }, [user, myColor, cleanup, roomConfig, playerId]); // Depend on roomConfig so Host can re-broadcast it

    useEffect(() => {
        if (!roomCode) return;
        const pruneTimer = setInterval(() => {
            setPlayers(prev => pruneStaleByHeartbeat(prev, Date.now(), 45000));
        }, 15000);

        const onBeforeUnload = () => {
            void cleanup();
        };

        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            clearInterval(pruneTimer);
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [roomCode, cleanup]);

    const createRoom = useCallback(async () => {
        // Generate 6-digit numeric code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await joinRoom(code, true);
        return code;
    }, [joinRoom]);

    const broadcastConfig = useCallback(async (config: RoomConfig) => {
        if (!channelRef.current) return;
        setRoomConfig(config); // Set local
        await channelRef.current.send({
            type: 'broadcast',
            event: 'room_config',
            payload: { ...config, meta: createRealtimeMeta(++sendSequenceRef.current) }
        });
    }, []);

    const toggleReady = useCallback(async () => {
        if (!channelRef.current) return;
        const myId = playerId; // Use the stable playerId
        if (!myId) return;

        const myself = players.find(p => p.id === myId);
        const newStatus = !myself?.isReady;

        // Optimistic update
        setPlayers(prev => prev.map(p =>
            p.id === myId ? { ...p, isReady: newStatus } : p
        ));

        try {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'player_ready',
                payload: { id: myId, isReady: newStatus, meta: createRealtimeMeta(++sendSequenceRef.current) }
            });
        } catch (err) {
            logAsyncError("multiplayer.ready", err);
            // Revert on error? Or just let it sync later?
            throw err;
        }
    }, [players, playerId]);

    const startGame = useCallback(async () => {
        if (!channelRef.current || !isHost) return;
        const lock = mutationLockRef.current.acquire('game:start', 2500);
        if (!lock.acquired) return;

        // Manual local trigger to ensure start even if broadcast fails
        const nextStartTime = Date.now() + 3000;
        setStartTime(nextStartTime);
        setCountDown(3);
        setGameState('countdown');

        try {
            // Broadcast to others
            await channelRef.current.send({
                type: 'broadcast',
                event: 'game_start',
                payload: { startTime: nextStartTime, meta: createRealtimeMeta(++sendSequenceRef.current) }
            });
        } finally {
            lock.release();
        }
    }, [isHost]);

    const updateProgress = useCallback(async (progress: number, wpm: number) => {
        if (!channelRef.current) return;
        const myId = playerId || user?.id || players.find(p => p.color === myColor)?.id;
        if (!myId) return;

        const now = Date.now();
        const last = lastProgressSendRef.current;
        if (
            progress < 100 &&
            now - last.sentAt < 250 &&
            Math.abs(progress - last.progress) < 1 &&
            Math.abs(wpm - last.wpm) < 2
        ) {
            return;
        }
        lastProgressSendRef.current = { progress, wpm, sentAt: now };

        await channelRef.current.send({
            type: 'broadcast',
            event: 'player_progress',
            payload: { userId: myId, progress, wpm, meta: createRealtimeMeta(++sendSequenceRef.current) }
        });
    }, [user, players, myColor, playerId]);

    const completeRace = useCallback(async (results: { wpm: number, accuracy: number, time: number }) => {
        if (!channelRef.current) return;
        const myId = playerId || user?.id || players.find(p => p.color === myColor)?.id;
        if (!myId) return;
        const lock = mutationLockRef.current.acquire(`race:complete:${myId}`, 30000);
        if (!lock.acquired) return;

        try {
            await channelRef.current.send({
                type: 'broadcast',
                event: 'player_complete',
                payload: { userId: myId, ...results, meta: createRealtimeMeta(++sendSequenceRef.current) }
            });
        } catch (err) {
            lock.release();
            throw err;
        }
    }, [user, players, myColor, playerId]);

    return {
        roomCode,
        gameState,
        players,
        roomConfig,
        countdown,
        startTime,
        isHost,
        joinRoom,
        createRoom,
        broadcastConfig,
        toggleReady,
        startGame,
        updateProgress,
        completeRace,
        setGameState, // Manually change state if needed (e.g. countdown -> racing)
        cleanup,
        playerId
    };
};
