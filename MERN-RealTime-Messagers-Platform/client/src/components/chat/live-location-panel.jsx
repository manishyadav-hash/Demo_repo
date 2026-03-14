import { useEffect, useState, useRef, useCallback } from "react";
import { API } from "@/lib/axios-client";
import { MapPin, Navigation, RefreshCw, ExternalLink, X, Locate, Radio } from "lucide-react";
import { useAutoLocationUpdate } from "@/hooks/use-auto-location-update";

// ─── Math helpers (parseFloat handles Sequelize DECIMAL strings) ──────────────
const calcDistance = (lat1, lon1, lat2, lon2) => {
    const [a1, o1, a2, o2] = [lat1, lon1, lat2, lon2].map(parseFloat);
    const R = 6371;
    const dLat = ((a2 - a1) * Math.PI) / 180;
    const dLon = ((o2 - o1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a1 * Math.PI) / 180) * Math.cos((a2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calcBearing = (lat1, lon1, lat2, lon2) => {
    const [a1, o1, a2, o2] = [lat1, lon1, lat2, lon2].map(parseFloat);
    const dLon = ((o2 - o1) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos((a2 * Math.PI) / 180);
    const x =
        Math.cos((a1 * Math.PI) / 180) * Math.sin((a2 * Math.PI) / 180) -
        Math.sin((a1 * Math.PI) / 180) * Math.cos((a2 * Math.PI) / 180) * Math.cos(dLon);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const formatDist = (km) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 100) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
};

const dirLabel = (deg) => ["N","NE","E","SE","S","SW","W","NW"][Math.round(deg / 45) % 8];
const fullDir  = (deg) => ["North","Northeast","East","Southeast","South","Southwest","West","Northwest"][Math.round(deg / 45) % 8];

const distColor = (km) => {
    if (km === null) return { text: "#a1a1aa", glow: "rgba(161,161,170,0.15)", ring: "#3f3f46" };
    if (km < 0.5)   return { text: "#34d399", glow: "rgba(52,211,153,0.18)",  ring: "#059669" };
    if (km < 2)     return { text: "#60a5fa", glow: "rgba(96,165,250,0.18)",  ring: "#2563eb" };
    if (km < 10)    return { text: "#a78bfa", glow: "rgba(167,139,250,0.18)", ring: "#7c3aed" };
    if (km < 50)    return { text: "#f59e0b", glow: "rgba(245,158,11,0.18)",  ring: "#d97706" };
    return            { text: "#f87171", glow: "rgba(248,113,113,0.18)",  ring: "#dc2626" };
};

// ─── Animated compass ────────────────────────────────────────────────────────
const Compass = ({ bearing, color }) => (
    <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
        <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `2px solid ${color.ring}`,
            background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.25) 100%)",
            boxShadow: `0 0 18px ${color.glow}, inset 0 0 12px rgba(0,0,0,0.4)`,
        }} />
        {[["N",0],["E",90],["S",180],["W",270]].map(([lbl, deg]) => {
            const rad = (deg - 90) * (Math.PI / 180), r = 26;
            return (
                <span key={lbl} style={{
                    position: "absolute",
                    left: `calc(50% + ${Math.cos(rad) * r}px)`,
                    top:  `calc(50% + ${Math.sin(rad) * r}px)`,
                    transform: "translate(-50%, -50%)",
                    fontSize: 8, fontWeight: 700,
                    color: lbl === "N" ? "#f87171" : "rgba(255,255,255,0.35)",
                    lineHeight: 1, userSelect: "none",
                }}>{lbl}</span>
            );
        })}
        <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: `rotate(${bearing ?? 0}deg)`,
            transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
            <div style={{
                position: "absolute", bottom: "50%", left: "50%",
                transform: "translateX(-50%)",
                width: 4, height: 22,
                background: "linear-gradient(to top, #ef4444, #fca5a5)",
                borderRadius: "2px 2px 0 0",
                boxShadow: "0 0 6px rgba(239,68,68,0.7)",
            }} />
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translateX(-50%)",
                width: 3, height: 18,
                background: "rgba(255,255,255,0.2)",
                borderRadius: "0 0 2px 2px",
            }} />
            <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: color.text,
                boxShadow: `0 0 8px ${color.glow}`,
                position: "relative", zIndex: 1,
            }} />
        </div>
    </div>
);

// ─── Main panel ───────────────────────────────────────────────────────────────
const LiveLocationPanel = ({ otherUserId, otherUserName, onClose }) => {
    const { isTracking, location: liveLocation, error: trackingError, startTracking } = useAutoLocationUpdate();

    const [myLoc,    setMyLoc]    = useState(null);
    const [theirLoc, setTheirLoc] = useState(null);
    const [distance, setDistance] = useState(null);
    const [bearing,  setBearing]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [lastSync, setLastSync] = useState(null);
    const [pulse,    setPulse]    = useState(false);
    const [enabling, setEnabling] = useState(false);
    const intervalRef = useRef(null);

    const fetchLocations = useCallback(async () => {
        try {
            const [meRes, themRes] = await Promise.all([
                API.get("/location/me"),
                API.get(`/location/user/${otherUserId}`),
            ]);
            const me   = meRes.data?.data ?? null;
            const them = themRes.data?.data ?? null;
            setMyLoc(me);
            setTheirLoc(them);

            if (me?.latitude && them?.latitude) {
                const d = calcDistance(me.latitude, me.longitude, them.latitude, them.longitude);
                const b = calcBearing(me.latitude, me.longitude, them.latitude, them.longitude);
                setDistance(d);
                setBearing(b);
            } else {
                setDistance(null);
                setBearing(null);
            }
            setLastSync(new Date());
            setPulse(true);
            setTimeout(() => setPulse(false), 800);
        } catch (e) {
            console.warn("[LiveLocation]", e.message);
        } finally {
            setLoading(false);
        }
    }, [otherUserId]);

    // Poll every 10 s
    useEffect(() => {
        fetchLocations();
        intervalRef.current = setInterval(fetchLocations, 10000);
        return () => clearInterval(intervalRef.current);
    }, [fetchLocations]);

    // When the hook gets a fresh GPS fix, re-fetch from DB 2 s later
    useEffect(() => {
        if (!liveLocation) return;
        const t = setTimeout(fetchLocations, 2000);
        return () => clearTimeout(t);
    }, [liveLocation, fetchLocations]);

    const handleEnable = useCallback(async () => {
        setEnabling(true);
        await startTracking();
        setTimeout(() => {
            fetchLocations();
            setEnabling(false);
        }, 3000);
    }, [startTracking, fetchLocations]);

    const openMaps = () => {
        if (!theirLoc?.latitude) return;
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${theirLoc.latitude},${theirLoc.longitude}`,
            "_blank", "noopener,noreferrer"
        );
    };

    const colors    = distColor(distance);
    const hasData   = distance !== null && bearing !== null;
    const myMiss    = !loading && !myLoc?.latitude;
    const theirMiss = !loading && !!myLoc?.latitude && !theirLoc?.latitude;
    const myStatus = loading
        ? "Checking"
        : myLoc?.latitude
            ? "Shared"
            : isTracking && !trackingError
                ? "Locating"
                : "Not shared";
    const theirStatus = loading
        ? "Checking"
        : theirLoc?.latitude
            ? "Shared"
            : "Not shared";

    return (
        <div style={{
            margin: "0 12px 10px",
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${colors.ring}40`,
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.3) 100%)",
            backdropFilter: "blur(12px)",
            boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${colors.ring}20`,
            animation: "lp-in 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)",
        }}>
            <style>{`
                @keyframes lp-in    { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
                @keyframes lp-pulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:.5; transform:scale(.85) } }
                @keyframes lp-spin  { to { transform:rotate(360deg) } }
                @keyframes lp-flash { 0%,100% { background:rgba(255,255,255,.04) } 50% { background:rgba(255,255,255,.1) } }
            `}</style>

            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "2px 8px", borderRadius: 99,
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.4)",
                    }}>
                        <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "#ef4444",
                            animation: "lp-pulse 1.4s ease-in-out infinite",
                        }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#f87171", letterSpacing: ".08em" }}>LIVE</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                        Location · {otherUserName}
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {lastSync && (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                            {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                    <button onClick={fetchLocations} title="Refresh" style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.35)", padding: 2,
                        display: "flex", alignItems: "center",
                    }}>
                        <RefreshCw size={12} style={{ animation: loading ? "lp-spin 1s linear infinite" : "none" }} />
                    </button>
                    <button onClick={onClose} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.35)", padding: 2,
                        display: "flex", alignItems: "center",
                    }}>
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: "12px 14px 14px" }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    flexWrap: "wrap",
                }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 9px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: ".03em",
                        color: myStatus === "Shared" ? "#34d399" : myStatus === "Locating" ? "#60a5fa" : "rgba(255,255,255,0.7)",
                        background: myStatus === "Shared" ? "rgba(52,211,153,0.14)" : myStatus === "Locating" ? "rgba(96,165,250,0.14)" : "rgba(255,255,255,0.06)",
                        border: myStatus === "Shared" ? "1px solid rgba(52,211,153,0.35)" : myStatus === "Locating" ? "1px solid rgba(96,165,250,0.35)" : "1px solid rgba(255,255,255,0.16)",
                    }}>
                        Me: {myStatus}
                    </div>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 9px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: ".03em",
                        color: theirStatus === "Shared" ? "#34d399" : "rgba(255,255,255,0.7)",
                        background: theirStatus === "Shared" ? "rgba(52,211,153,0.14)" : "rgba(255,255,255,0.06)",
                        border: theirStatus === "Shared" ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(255,255,255,0.16)",
                    }}>
                        {otherUserName}: {theirStatus}
                    </div>
                </div>

                {/* 1. Loading spinner */}
                {loading && !hasData && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                        <Locate size={16} style={{ animation: "lp-spin 1.5s linear infinite" }} />
                        Fetching live coordinates…
                    </div>
                )}

                {/* 2. My location missing — enable button */}
                {myMiss && (
                    <div style={{
                        borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(109,40,217,0.06))",
                        border: "1px solid rgba(124,58,237,0.35)",
                        padding: "14px 16px",
                    }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                                background: "rgba(124,58,237,0.2)",
                                border: "1px solid rgba(124,58,237,0.4)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <MapPin size={16} style={{ color: "#a78bfa" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd", margin: "0 0 4px" }}>
                                    Share your location
                                </p>
                                <p style={{ fontSize: 11, color: "rgba(196,181,253,0.6)", margin: "0 0 12px", lineHeight: 1.5 }}>
                                    {isTracking && !trackingError
                                        ? "Getting your GPS fix — this may take a few seconds…"
                                        : "Allow location access so both of you can see distance & direction."}
                                </p>
                                {trackingError ? (
                                    <div style={{
                                        fontSize: 11, color: "#fca5a5",
                                        background: "rgba(239,68,68,0.1)",
                                        border: "1px solid rgba(239,68,68,0.3)",
                                        borderRadius: 8, padding: "6px 10px",
                                    }}>
                                        ⚠ {trackingError}
                                    </div>
                                ) : isTracking ? (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        fontSize: 11, color: "#86efac",
                                        background: "rgba(34,197,94,0.08)",
                                        border: "1px solid rgba(34,197,94,0.25)",
                                        borderRadius: 8, padding: "6px 10px",
                                    }}>
                                        <Radio size={12} style={{ animation: "lp-pulse 1.4s ease-in-out infinite" }} />
                                        Locating you… data will appear shortly
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleEnable}
                                        disabled={enabling}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: 7,
                                            padding: "7px 16px", borderRadius: 99,
                                            cursor: enabling ? "not-allowed" : "pointer",
                                            background: enabling
                                                ? "rgba(124,58,237,0.3)"
                                                : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                                            border: "1px solid rgba(167,139,250,0.4)",
                                            color: "#fff", fontSize: 12, fontWeight: 600,
                                            opacity: enabling ? 0.7 : 1,
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <MapPin size={13} />
                                        {enabling ? "Enabling…" : "Enable My Location"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Other user's location missing */}
                {theirMiss && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 12,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.1)",
                    }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                            background: "rgba(255,255,255,0.05)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <MapPin size={15} style={{ color: "rgba(255,255,255,0.3)" }} />
                        </div>
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>
                                Waiting for {otherUserName}
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                                {otherUserName} hasn{"'"}t shared their location yet
                            </p>
                        </div>
                    </div>
                )}

                {/* 4. Data ready — compass + stats */}
                {!loading && hasData && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 16,
                        animation: pulse ? "lp-flash 0.8s ease" : "none",
                        borderRadius: 12, padding: "4px 0",
                    }}>
                        <Compass bearing={bearing} color={colors} />

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ marginBottom: 8 }}>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: ".08em" }}>Distance</p>
                                <p style={{
                                    fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1,
                                    color: colors.text,
                                    textShadow: `0 0 20px ${colors.glow}`,
                                }}>
                                    {formatDist(distance)}
                                </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "3px 10px", borderRadius: 99,
                                    background: `${colors.ring}22`,
                                    border: `1px solid ${colors.ring}55`,
                                }}>
                                    <Navigation size={11} style={{
                                        color: colors.text,
                                        transform: `rotate(${bearing}deg)`,
                                        transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                    }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>{dirLabel(bearing)}</span>
                                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>· {fullDir(bearing)}</span>
                                </div>
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{Math.round(bearing)}°</span>
                            </div>
                        </div>

                        <button
                            onClick={openMaps}
                            title="Open in Google Maps"
                            style={{
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                padding: "10px 12px", borderRadius: 12, cursor: "pointer",
                                background: `linear-gradient(135deg, ${colors.ring}33, ${colors.ring}15)`,
                                border: `1px solid ${colors.ring}55`,
                                color: colors.text, flexShrink: 0,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(135deg, ${colors.ring}55, ${colors.ring}33)`}
                            onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(135deg, ${colors.ring}33, ${colors.ring}15)`}
                        >
                            <ExternalLink size={15} />
                            <span style={{ fontSize: 9, fontWeight: 600, whiteSpace: "nowrap" }}>Open Map</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveLocationPanel;
