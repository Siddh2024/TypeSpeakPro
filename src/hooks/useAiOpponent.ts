import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Player, RoomConfig } from './useMultiplayer';
import { toast } from 'sonner';

export const useAiOpponent = (user: any) => {
    // --- State matching useMultiplayer ---
    const [gameState, setGameState] = useState<GameState>('lobby'); // lobby -> searching -> countdown -> racing -> finished
    const [players, setPlayers] = useState<Player[]>([]);
    const [roomConfig, setRoomConfig] = useState<RoomConfig>({
        text: '',
        mode: 'words',
        duration: 30, // Default to 30s for quick races
        difficulty: 'medium'
    });
    const [countdown, setCountDown] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);

    // AI specific state
    const [isSearching, setIsSearching] = useState(false);
    const aiWpmTarget = useRef(0);
    const aiProgress = useRef(0);

    // Get current user ID
    const playerId = user?.id || 'guest_user';

    // 1. Start Matchmaking (Simulate "Searching...")
    const startMatchmaking = useCallback(() => {
        setGameState('lobby'); // Actually 'searching' isn't in GameState type yet, so we control via isSearching or add it
        setIsSearching(true);
        setPlayers([]);

        // Add Self
        const myProfile: Player = {
            id: playerId,
            name: user?.user_metadata?.full_name || "You",
            isReady: true, // Auto-ready in ranked
            progress: 0,
            wpm: 0,
            color: '#2dd4bf', // Teal for user
            avatarUrl: user?.user_metadata?.avatar_url
        };
        setPlayers([myProfile]);

        // Simulate network delay 2-4 seconds
        const delay = 2000 + Math.random() * 2000;

        setTimeout(() => {
            foundMatch(myProfile);
        }, delay);
    }, [user, playerId]);

    // 2. Found Match -> Add Bot -> Countdown
    const foundMatch = (myProfile: Player) => {
        setIsSearching(false);

        // Generate Bot
        const botNames = ["SpeedDemon", "TypingNinja", "KeyboardWarrior", "Guest_9921", "FastFingers", "Velociraptor"];
        const botName = botNames[Math.floor(Math.random() * botNames.length)];
        const botColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
        // Bot skill: 40 - 90 WPM
        const skill = 40 + Math.floor(Math.random() * 50);
        aiWpmTarget.current = skill;
        aiProgress.current = 0;

        const botProfile: Player = {
            id: 'ai_bot_1',
            name: botName,
            isReady: true,
            progress: 0,
            wpm: 0,
            color: botColor
        };

        setPlayers([myProfile, botProfile]);
        toast.success(`Match found! vs ${botName}`);

        // Start Countdown
        setCountDown(3);
        setGameState('countdown');

        // Define simulated start time
        const start = Date.now() + 3000; // 3s countdown
        setStartTime(start);
    };

    // 3. Countdown Logic & Game Start
    useEffect(() => {
        if (countdown === null) return;
        if (countdown > 0) {
            const timer = setTimeout(() => setCountDown(c => (c ? c - 1 : 0)), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setGameState('racing');
            setCountDown(null);
            // Don't reset start time here, strictly use the one set during foundMatch to sync
        }
    }, [countdown]);

    // 4. AI Simulation Loop (Run only when racing)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (gameState === 'racing') {
            interval = setInterval(() => {
                // Update AI
                // Move progress towards 100% based on WPM and duration
                // Progress = (TimeElapsed / Duration) * (CurrentWPM / ExpectedWPM)? 
                // simpler: WPM = Words Per Minute. Words = 5 chars.
                // Chars per second = (WPM * 5) / 60.

                const charsPerSec = (aiWpmTarget.current * 5) / 60;
                // Update roughly every 500ms
                const charsPerTick = charsPerSec * 0.5;

                // Assuming typical text length ~ 200 chars for 30s? 
                // Actually progress is 0-100%. 
                // Let's approximate text length. For 30s test at 60wpm -> 30 words -> 150 chars.
                const estimatedTotalChars = (roomConfig.duration / 60) * aiWpmTarget.current * 5;

                // Add some varability
                const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
                const percentIncrease = (charsPerTick * randomFactor / estimatedTotalChars) * 100;

                aiProgress.current = Math.min(100, aiProgress.current + percentIncrease);

                setPlayers(prev => prev.map(p => {
                    if (p.id === 'ai_bot_1') {
                        // If already finished, do NOT update anymore
                        if (p.progress >= 100) return p;

                        // Check if just finished
                        if (aiProgress.current >= 100) {
                            return {
                                ...p,
                                progress: 100,
                                wpm: aiWpmTarget.current, // Final stable WPM
                                rank: prev.filter(x => x.progress >= 100).length + 1
                            };
                        }

                        // Still racing - update with fluctuation
                        return {
                            ...p,
                            progress: aiProgress.current,
                            wpm: Math.floor(aiWpmTarget.current * randomFactor) // Fluctuating WPM display
                        };
                    }
                    return p;
                }));

            }, 500);
        }

        return () => clearInterval(interval);
    }, [gameState, roomConfig.duration]);

    // 5. Interface methods to match useMultiplayer

    // User updates their own progress
    const updateProgress = (progress: number, wpm: number) => {
        setPlayers(prev => prev.map(p =>
            p.id === playerId ? { ...p, progress: Math.max(p.progress, progress), wpm } : p
        ));
    };

    // User finishes
    const completeRace = (results: { wpm: number, accuracy: number, time: number }) => {
        setPlayers(prev => {
            const existing = prev.find(p => p.id === playerId);
            if (existing?.rank || existing?.progress === 100) return prev;

            const alreadyFinished = prev.filter(p => p.progress >= 100).length;
            const myRank = alreadyFinished + 1;

            return prev.map(p =>
                p.id === playerId ? {
                    ...p,
                    progress: 100,
                    wpm: results.wpm,
                    accuracy: results.accuracy,
                    rank: myRank
                } : p
            );
        });
        setGameState('finished');
    };

    // Not used in AI mode but needed for interface
    const joinRoom = async () => { };
    const createRoom = async () => '';
    const broadcastConfig = async () => { };
    const toggleReady = async () => { };
    const startGame = async () => { };
    const cleanup = async () => { };

    return {
        roomCode: isSearching ? 'SEARCHING...' : (players.length > 0 ? 'RANKED' : null),
        gameState: isSearching ? 'lobby' : gameState, // Mask searching as lobby or handle inside component
        isSearching, // Expose this for UI
        players,
        roomConfig,
        countdown,
        startTime,
        isHost: true, // User is always "host" in local simulation
        joinRoom,
        createRoom,
        broadcastConfig,
        toggleReady,
        startGame,
        updateProgress,
        completeRace,
        setGameState,
        cleanup,
        playerId,
        startMatchmaking // Special method key for AI hook
    };
};
