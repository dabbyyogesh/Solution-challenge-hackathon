import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, onSnapshot, orderBy, updateDoc, arrayUnion, where, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Firebase config ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAxU7VpzhQUnMQ1N_pGUjFA4kZmffVS7ck",
  authDomain: "service-a0a29.firebaseapp.com",
  projectId: "service-a0a29",
  storageBucket: "service-a0a29.firebasestorage.app",
  messagingSenderId: "1014022373726",
  appId: "1:1014022373726:web:0a261a7a13325c2ac84fcf",
  measurementId: "G-GD4514XSQ2"
};

const app = initializeApp(firebaseConfig);
window.auth = getAuth(app);
window.db   = getFirestore(app);
window.fb   = {
    signInWithEmailAndPassword, createUserWithEmailAndPassword,
    onAuthStateChanged, signOut,
    doc, setDoc, getDoc, collection, getDocs,
    query, onSnapshot, orderBy, updateDoc, arrayUnion, where, addDoc
};

const { useState, useEffect, useRef } = React;

// ── Reputation helper ────────────────────────────────────────────────────────
function getReputationBadge(completedCount = 0, avgRating = 5) {
    if (completedCount >= 6 && avgRating >= 4.8) return { label: "Elite Gold",     color: "bg-amber-500 badge-gold",   icon: "🔱" };
    if (completedCount >= 3 && avgRating >= 4.5) return { label: "Top Performer",  color: "bg-indigo-600 badge-indigo",icon: "🏆" };
    if (completedCount >= 1)                      return { label: "Rising Star",    color: "bg-green-500 badge-green",  icon: "🚀" };
    return                                               { label: "New Pro",        color: "bg-slate-400",              icon: "✨" };
}

// ── Auction Timer ────────────────────────────────────────────────────────────
function AuctionTimer({ deadline, status }) {
    const [timeLeft, setTimeLeft] = useState("");
    useEffect(() => {
        if (status === "closed")    { setTimeLeft("HIRED");    return; }
        if (status === "completed") { setTimeLeft("FINISHED"); return; }
        const tick = () => {
            const diff = new Date(deadline).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft("EXPIRED"); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [deadline, status]);

    const cls = status === "completed" ? "timer-fin" : status === "closed" ? "timer-done" : "timer-live";
    const icon = status === "completed" ? "🏆" : status === "closed" ? "✅" : "⏱";
    return (
        <span className={`pill ${cls}`}>{icon} {timeLeft}</span>
    );
}

// ── Direct Chat ──────────────────────────────────────────────────────────────
function DirectChat({ auctionId, currentUserEmail }) {
    const [msg, setMsg]       = useState("");
    const [chat, setChat]     = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError]   = useState("");
    const endRef = useRef(null);

    useEffect(() => {
        const unsub = window.fb.onSnapshot(window.fb.doc(window.db, "auctions", auctionId), (snap) => {
            if (snap.exists()) {
                setChat(snap.data().messages || []);
            }
        }, (err) => {
            console.error("Auction chat error:", err);
            setError("Could not load messages.");
        });
        return unsub;
    }, [auctionId]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    const send = async () => {
        const text = msg.trim();
        if (!text || sending) return;
        setSending(true);
        setError("");
        try {
            await window.fb.updateDoc(window.fb.doc(window.db, "auctions", auctionId), {
                messages: window.fb.arrayUnion({ sender: currentUserEmail, text, time: new Date().toLocaleTimeString() })
            });
            setMsg("");
        } catch (err) {
            console.error("Send error:", err);
            setError("Failed to send. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

    return (
        <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-4">💬 Secure Project Messenger</p>
            <div className="bg-slate-50 rounded-2xl p-4 h-52 overflow-y-auto flex flex-col gap-2 border border-slate-100">
                {chat.length === 0 && (
                    <p className="text-[11px] text-slate-300 text-center m-auto font-semibold italic">No messages yet. Say hello 👋</p>
                )}
                {chat.map((c, i) => {
                    const mine = c.sender === currentUserEmail;
                    return (
                        <div key={i} className={`max-w-[78%] px-4 py-2 text-[12px] font-semibold shadow-sm ${mine ? "self-end bubble-me" : "self-start bubble-them"}`}>
                            {c.text}
                            <div className={`text-[9px] mt-1 ${mine ? "text-indigo-200" : "text-slate-400"}`}>{c.time}</div>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>
            {error && <p className="text-[11px] text-red-500 font-semibold mt-2">{error}</p>}
            <div className="flex gap-2 mt-3">
                <input
                    className="field flex-1"
                    placeholder="Type a message and press Enter..."
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={onKey}
                    disabled={sending}
                />
                <button onClick={send} disabled={sending || !msg.trim()} className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    {sending ? "…" : "Send"}
                </button>
            </div>
        </div>
    );
}

// ── App Shell ────────────────────────────────────────────────────────────────
function App() {
    const [user, setUser]           = useState(null);
    const [role, setRole]           = useState(null);
    const [userData, setUserData]   = useState(null);
    const [loading, setLoading]     = useState(true);
    const [view, setView]           = useState("dashboard");
    const [notifications, setNotifications] = useState([]);
    const lastBidCount = useRef({});

    useEffect(() => {
        return window.fb.onAuthStateChanged(window.auth, async (u) => {
            if (u) {
                const snap = await window.fb.getDoc(window.fb.doc(window.db, "users", u.uid));
                if (snap.exists()) {
                    setRole(snap.data().role);
                    setUserData(snap.data());
                    // Real-time bid notifications
                    const q = window.fb.query(window.fb.collection(window.db, "auctions"), window.fb.where("owner", "==", u.uid));
                    window.fb.onSnapshot(q, (s) => {
                        s.docs.forEach(d => {
                            const cur = d.data().bids?.length || 0;
                            if (cur > (lastBidCount.current[d.id] || 0)) {
                                setNotifications(p => [{ id: Date.now(), text: `New bid on "${d.data().title}"`, time: new Date().toLocaleTimeString() }, ...p]);
                            }
                            lastBidCount.current[d.id] = cur;
                        });
                    });
                }
                setUser(u);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
    }, []);

    const refreshUserData = async () => {
        const snap = await window.fb.getDoc(window.fb.doc(window.db, "users", user.uid));
        if (snap.exists()) setUserData(snap.data());
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-xl animate-pulse">EM</div>
            <p className="font-bold text-indigo-500 text-sm tracking-widest uppercase animate-pulse">Initializing Elite Market…</p>
        </div>
    );

    if (!user) return <LoginGate />;

    return (
        <div className="min-h-screen">
            <Navbar role={role} setView={setView} activeView={view} notifications={notifications} setNotifications={setNotifications} />
            <main className="pb-24 pt-2">
                {view === "dashboard"   && <Dashboard user={user} setNotifications={setNotifications} />}
                {view === "auction"     && <AuctionCenter user={user} role={role} />}
                {view === "assignments" && <AssignmentsList user={user} role={role} />}
                {view === "profile"     && <ProfileEditor userData={userData} refresh={refreshUserData} />}
            </main>
        </div>
    );
}

// ── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ role, setView, activeView, notifications, setNotifications }) {
    const [showNotif, setShowNotif] = useState(false);

    const navBtn = (label, key) => (
        <button
            onClick={() => setView(key)}
            className={`text-[11px] font-bold tracking-widest uppercase pb-0.5 transition-colors ${
                activeView === key
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-400 hover:text-slate-700"
            }`}
        >
            {label}
        </button>
    );

    return (
        <nav className="glass sticky top-0 z-50 px-6 py-3 flex justify-between items-center border-b border-white/60 shadow-sm">
            {/* Logo */}
            <button
                onClick={() => setView("dashboard")}
                className="flex items-center gap-2.5"
            >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">EM</div>
                <span className="font-bold text-slate-800 hidden sm:block tracking-tight">Elite Market</span>
            </button>

            {/* Nav links */}
            <div className="flex items-center gap-6 sm:gap-8">
                {navBtn("Explore", "dashboard")}
                {navBtn("Arena", "auction")}
                {role === "employee" && navBtn("Assignments", "assignments")}

                {/* Notifications bell */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotif(v => !v)}
                        className={`relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 transition ${
                            notifications.length > 0 ? "notify-pulse text-red-500" : "text-slate-400"
                        }`}
                    >
                        🔔
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black">
                                {notifications.length}
                            </span>
                        )}
                    </button>
                    {showNotif && (
                        <div className="dropdown-card absolute top-12 right-0 w-72 p-5 z-[100] animate-slide-down">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-[11px] uppercase tracking-widest text-slate-400">Activity</span>
                                <button onClick={() => setNotifications([])} className="text-indigo-600 text-[11px] font-bold hover:underline">Clear all</button>
                            </div>
                            <div className="max-h-52 overflow-y-auto space-y-2">
                                {notifications.length === 0
                                    ? <p className="text-[11px] text-slate-300 text-center py-6 font-semibold italic">All caught up ✓</p>
                                    : notifications.map(n => (
                                        <div key={n.id} className="p-3 bg-indigo-50 rounded-xl border-l-4 border-indigo-500">
                                            <p className="text-[11px] font-semibold text-slate-700">{n.text}</p>
                                            <p className="text-[9px] text-slate-400 mt-0.5">{n.time}</p>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>

                {navBtn("Settings", "profile")}
            </div>

            {/* Sign out */}
            <button
                onClick={() => window.auth.signOut()}
                className="text-[11px] font-bold border-2 border-slate-200 px-4 py-2 rounded-xl hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition uppercase tracking-wide"
            >
                Exit
            </button>
        </nav>
    );
}

// ── Login / Registration Gate ────────────────────────────────────────────────
function LoginGate() {
    const [isLogin, setIsLogin]       = useState(true);
    const [forgotMode, setForgotMode] = useState(false);
    const [showPass, setShowPass]     = useState(false);
    const [role, setRole]             = useState("user");
    const [recoveryEmail, setRecoveryEmail]   = useState("");
    const [recoveryAnswer, setRecoveryAnswer] = useState("");
    const [formData, setFormData] = useState({
        email: "", password: "", name: "", location: "", phone: "",
        idNumber: "", photoURL: "", expYears: "", pastProjects: "",
        fieldOfWork: "",
        securityQuestion: "What is your pet name?", securityAnswer: ""
    });
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);

    const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (isLogin) {
                await window.fb.signInWithEmailAndPassword(window.auth, formData.email, formData.password);
            } else {
                const res = await window.fb.createUserWithEmailAndPassword(window.auth, formData.email, formData.password);
                const profile = {
                    uid: res.user.uid, role, name: formData.name,
                    email: formData.email, location: formData.location,
                    securityQuestion: formData.securityQuestion,
                    securityAnswer: formData.securityAnswer.toLowerCase(),
                    completedJobs: 0, rating: 5.0, status: "active", hourlyRate: "25",
                    ...(role === "employee" && {
                        phone: formData.phone, idNumber: formData.idNumber,
                        photoURL: formData.photoURL || `https://i.pravatar.cc/150?u=${res.user.uid}`,
                        experience: formData.expYears, pastWork: formData.pastProjects,
                        fieldOfWork: formData.fieldOfWork,
                        category: formData.fieldOfWork   // aliased so existing card code works
                    })
                };
                await window.fb.setDoc(window.fb.doc(window.db, "users", res.user.uid), profile);
            }
        } catch (err) {
            setError(err.message.replace("Firebase: ", ""));
        }
        setLoading(false);
    };

    const handleRecovery = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const q = window.fb.query(window.fb.collection(window.db, "users"), window.fb.where("email", "==", recoveryEmail));
            const snap = await window.fb.getDocs(q);
            if (!snap.empty && snap.docs[0].data().securityAnswer === recoveryAnswer.toLowerCase()) {
                alert("Identity verified! Emergency access code: reset123 — log in and change your password immediately.");
                setForgotMode(false);
            } else {
                setError("Verification failed. Email or answer is incorrect.");
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const inputCls = "field";

    if (forgotMode) return (
        <div className="min-h-screen auth-bg flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-sm p-10 rounded-3xl shadow-2xl animate-fade-in">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg">🔐</div>
                    <h2 className="text-2xl font-bold tracking-tight">Security Check</h2>
                    <p className="text-slate-400 text-sm mt-1">Answer your security question to recover access.</p>
                </div>
                {error && <div className="bg-red-50 text-red-600 text-[12px] font-semibold p-3 rounded-xl mb-4 border border-red-200">{error}</div>}
                <form onSubmit={handleRecovery} className="space-y-4">
                    <input required className={inputCls} type="email" placeholder="Recovery Email" onChange={e => setRecoveryEmail(e.target.value)} />
                    <input required className={inputCls} placeholder="Security Answer" onChange={e => setRecoveryAnswer(e.target.value)} />
                    <button className="btn-primary w-full py-4" disabled={loading}>{loading ? "Verifying…" : "Verify Identity"}</button>
                </form>
                <button onClick={() => setForgotMode(false)} className="mt-5 text-center w-full text-slate-400 text-[11px] font-semibold hover:text-indigo-600 transition uppercase tracking-wider">← Return to Login</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen auth-bg flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-xl p-10 rounded-3xl shadow-2xl overflow-y-auto max-h-[96vh] animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg">EM</div>
                    <h2 className="text-2xl font-bold tracking-tight">{isLogin ? "Welcome Back" : "Create Account"}</h2>
                    <p className="text-slate-400 text-sm mt-1">{isLogin ? "Login to your Elite Market account." : "Join the marketplace of elite freelancers."}</p>
                </div>

                {/* Role toggle (signup only) */}
                {!isLogin && (
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl mb-6">
                        {["user", "employee"].map(r => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRole(r)}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-[12px] uppercase tracking-wider transition ${
                                    role === r ? "bg-white shadow text-indigo-600" : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {r === "user" ? "🏢 Hire" : "💼 Work"}
                            </button>
                        ))}
                    </div>
                )}

                {error && <div className="bg-red-50 text-red-600 text-[12px] font-semibold p-3 rounded-xl mb-4 border border-red-200">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && <input required className={inputCls} placeholder="Full Name" onChange={e => set("name", e.target.value)} />}

                    <input required className={inputCls} type="email" placeholder="Email Address" onChange={e => set("email", e.target.value)} />

                    {/* Employee extra fields */}
                    {!isLogin && role === "employee" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input required className={inputCls} placeholder="Contact Phone" onChange={e => set("phone", e.target.value)} />
                            <input required className={inputCls} placeholder="National ID (Aadhar / Passport)" onChange={e => set("idNumber", e.target.value)} />
                            <input required className={inputCls} type="number" placeholder="Years of Experience" onChange={e => set("expYears", e.target.value)} />
                            <input className={inputCls} placeholder="Profile Image URL (optional)" onChange={e => set("photoURL", e.target.value)} />

                            {/* Field of Work — spans both columns */}
                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Field of Work *</label>
                                <select
                                    required
                                    className={`${inputCls} bg-white`}
                                    value={formData.fieldOfWork}
                                    onChange={e => set("fieldOfWork", e.target.value)}
                                >
                                    <option value="" disabled>Select your professional field…</option>
                                    <option value="Technical">💻 Technical (Dev, IT, Engineering)</option>
                                    <option value="Home Services">🏠 Home Services (Plumbing, Electrical, Cleaning)</option>
                                    <option value="Creative">🎨 Creative (Design, Video, Photography)</option>
                                    <option value="Health">❤️ Health (Fitness, Nutrition, Wellness)</option>
                                    <option value="Digital Marketing">📣 Digital Marketing (SEO, Ads, Social Media)</option>
                                    <option value="Finance">💰 Finance (Accounting, Tax, Investment)</option>
                                    <option value="Education">📚 Education (Tutoring, Training, Coaching)</option>
                                    <option value="Legal">⚖️ Legal (Consulting, Documentation)</option>
                                    <option value="Other">🔧 Other</option>
                                </select>
                            </div>

                            <textarea required className={`${inputCls} sm:col-span-2 h-24 resize-none`} placeholder="Describe your skills and past projects…" onChange={e => set("pastProjects", e.target.value)} />
                        </div>
                    )}

                    {/* Security question */}
                    {!isLogin && (
                        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Account Recovery</p>
                            <select className="field bg-white" onChange={e => set("securityQuestion", e.target.value)}>
                                <option>What is your pet name?</option>
                                <option>What was your first car?</option>
                            </select>
                            <input required className={inputCls} placeholder="Your answer" onChange={e => set("securityAnswer", e.target.value)} />
                        </div>
                    )}

                    {/* Password */}
                    <div className="relative">
                        <input required className={`${inputCls} pr-20`} type={showPass ? "text" : "password"} placeholder="Password" onChange={e => set("password", e.target.value)} />
                        <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm uppercase">
                            {showPass ? "Hide" : "Show"}
                        </button>
                    </div>

                    <button className="btn-primary w-full py-4 text-sm rounded-2xl" disabled={loading}>
                        {loading ? "Please wait…" : (isLogin ? "Sign In" : "Create Account")}
                    </button>
                </form>

                <div className="flex justify-between mt-6">
                    <button onClick={() => { setIsLogin(v => !v); setError(""); }} className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition">
                        {isLogin ? "Create an account →" : "← Back to Login"}
                    </button>
                    {isLogin && (
                        <button onClick={() => setForgotMode(true)} className="text-[11px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider transition">
                            Forgot password?
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Direct Message Chat (Connect button) ─────────────────────────────────────
function DirectMessageChat({ currentUser, peer, onClose, setNotifications }) {
    const [msg, setMsg]       = useState("");
    const [chat, setChat]     = useState([]);
    const [sending, setSending] = useState(false);
    const [error, setError]   = useState("");
    const endRef     = useRef(null);
    const mountedRef = useRef(false); // skip notification on initial snapshot load
    const prevLenRef = useRef(0);     // track previous message count

    // Stable conversation ID: sorted emails joined by "__"
    const convoId = [currentUser.email, peer.email].sort().join("__");

    useEffect(() => {
        mountedRef.current = false;
        const ref = window.fb.doc(window.db, "direct_messages", convoId);
        const unsub = window.fb.onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                const msgs = snap.data().messages || [];
                setChat(msgs);
                // Only notify after mount and only when new messages arrive from peer
                if (mountedRef.current && msgs.length > prevLenRef.current) {
                    const last = msgs[msgs.length - 1];
                    if (last && last.sender !== currentUser.email) {
                        setNotifications(p => [
                            { id: Date.now(), text: `💬 New message from ${peer.name || peer.email.split("@")[0]}`, time: new Date().toLocaleTimeString() },
                            ...p
                        ]);
                    }
                }
                prevLenRef.current = msgs.length;
                mountedRef.current = true;
            } else {
                setChat([]);
                mountedRef.current = true;
            }
        }, (err) => {
            console.error("Chat snapshot error:", err);
            setError("Failed to load messages. Check your connection.");
        });
        return () => { unsub(); mountedRef.current = false; };
    }, [convoId]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

    const send = async () => {
        const text = msg.trim();
        if (!text || sending) return;
        setSending(true);
        setError("");
        try {
            const ref = window.fb.doc(window.db, "direct_messages", convoId);
            const newMsg = {
                sender: currentUser.email,
                senderName: currentUser.displayName || currentUser.email.split("@")[0],
                text,
                time: new Date().toLocaleTimeString()
            };
            const snap = await window.fb.getDoc(ref);
            if (snap.exists()) {
                await window.fb.updateDoc(ref, { messages: window.fb.arrayUnion(newMsg) });
            } else {
                await window.fb.setDoc(ref, {
                    participants: [currentUser.email, peer.email],
                    messages: [newMsg]
                });
            }
            setMsg("");
        } catch (err) {
            console.error("Send error:", err);
            setError("Failed to send. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 animate-fade-in"
             style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}>
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600">
                    <img
                        src={peer.photoURL || `https://i.pravatar.cc/150?u=${peer.id}`}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-white/40 shadow"
                        alt={peer.name}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{peer.name || peer.email.split("@")[0]}</p>
                        <p className="text-indigo-200 text-[10px] font-semibold uppercase tracking-wide">{peer.fieldOfWork || peer.category || "Professional"}</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none transition">✕</button>
                </div>

                {/* Messages */}
                <div className="bg-slate-50 px-4 py-4 h-64 overflow-y-auto flex flex-col gap-2">
                    {chat.length === 0 && (
                        <p className="text-[11px] text-slate-300 text-center m-auto font-semibold italic">No messages yet. Say hello 👋</p>
                    )}
                    {chat.map((c, i) => {
                        const mine = c.sender === currentUser.email;
                        return (
                            <div key={i} className={`max-w-[78%] px-4 py-2 text-[12px] font-semibold shadow-sm ${mine ? "self-end bubble-me" : "self-start bubble-them"}`}>
                                {c.text}
                                <div className={`text-[9px] mt-1 ${mine ? "text-indigo-200" : "text-slate-400"}`}>{c.time}</div>
                            </div>
                        );
                    })}
                    <div ref={endRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    {error && (
                        <p className="text-[11px] text-red-500 font-semibold mb-2 px-1">{error}</p>
                    )}
                    <div className="flex gap-2">
                        <input
                            className="field flex-1"
                            placeholder="Type a message…"
                            value={msg}
                            onChange={e => setMsg(e.target.value)}
                            onKeyDown={onKey}
                            autoFocus
                            disabled={sending}
                        />
                        <button
                            onClick={send}
                            disabled={sending || !msg.trim()}
                            className="btn-primary px-5 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? "…" : "Send"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Dashboard (Talent Hub) ───────────────────────────────────────────────────
const FIELDS = ["All", "Technical", "Home Services", "Creative", "Health", "Digital Marketing", "Finance", "Education", "Legal", "Other"];

const FIELD_ICONS = {
    "Technical": "💻", "Home Services": "🏠", "Creative": "🎨",
    "Health": "❤️", "Digital Marketing": "📣", "Finance": "💰",
    "Education": "📚", "Legal": "⚖️", "Other": "🔧"
};

function Dashboard({ user, setNotifications }) {
    const [search, setSearch]         = useState("");
    const [activeField, setActiveField] = useState("All");
    const [workers, setWorkers]       = useState([]);
    const [chatPeer, setChatPeer]     = useState(null);

    useEffect(() => {
        const q = window.fb.query(window.fb.collection(window.db, "users"), window.fb.where("role", "==", "employee"));
        return window.fb.onSnapshot(q, snap => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    const filtered = workers.filter(w => {
        const matchSearch = (w.name || "").toLowerCase().includes(search.toLowerCase()) ||
                            (w.fieldOfWork || w.category || "").toLowerCase().includes(search.toLowerCase()) ||
                            (w.skills || "").toLowerCase().includes(search.toLowerCase());
        const matchField  = activeField === "All" || (w.fieldOfWork || w.category) === activeField;
        return matchSearch && matchField;
    });

    return (
        <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-1">Talent Hub</h1>
                <p className="text-slate-400 text-sm">Discover and connect with verified elite professionals.</p>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                <input
                    className="field pl-12 py-4 rounded-2xl text-base shadow-sm"
                    placeholder="Search by name, field, or skill…"
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Field-of-work filter pills */}
            <div className="flex gap-2 flex-wrap mb-10">
                {FIELDS.map(f => (
                    <button
                        key={f}
                        onClick={() => setActiveField(f)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition border ${
                            activeField === f
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                    >
                        {f !== "All" && FIELD_ICONS[f] ? `${FIELD_ICONS[f]} ` : ""}{f}
                    </button>
                ))}
            </div>

            {/* Worker grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-24 text-slate-300">
                    <p className="text-5xl mb-4">🕵️</p>
                    <p className="font-bold text-lg">No professionals found</p>
                    <p className="text-sm mt-1">Try a different search term or field</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(w => {
                        const rep   = getReputationBadge(w.completedJobs || 0, w.rating || 5);
                        const field = w.fieldOfWork || w.category || null;
                        const icon  = field ? (FIELD_ICONS[field] || "🔧") : null;
                        return (
                            <div key={w.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 card-lift">
                                {/* Banner */}
                                <div
                                    className="h-20 bg-gradient-to-br from-indigo-100 to-purple-100"
                                    style={w.bannerURL ? { backgroundImage: `url(${w.bannerURL})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                                />

                                {/* Body */}
                                <div className="p-6">
                                    <div className="flex items-start gap-4 -mt-10 mb-4">
                                        <img
                                            src={w.photoURL || `https://i.pravatar.cc/150?u=${w.id}`}
                                            className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md"
                                            alt={w.name}
                                        />
                                        <div className="pt-8">
                                            <h3 className="font-bold text-base leading-tight">{w.name}</h3>
                                            {field && (
                                                <span className="inline-flex items-center gap-1 mt-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                                    {icon} {field}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reputation badge */}
                                    <span className={`inline-flex items-center gap-1.5 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 ${rep.color}`}>
                                        {rep.icon} {rep.label}
                                    </span>

                                    {/* Bio */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 min-h-[72px]">
                                        <p className="text-[12px] text-slate-500 italic leading-relaxed line-clamp-3">"{w.pastWork || "No bio yet."}"</p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center">
                                        <span className="stat-chip">★ {w.rating} · {w.completedJobs || 0} jobs</span>
                                        <button
                                            onClick={() => user ? setChatPeer(w) : alert("Please log in to connect.")}
                                            className="btn-dark text-[11px] px-5 py-2.5 rounded-xl"
                                        >
                                            💬 Connect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Direct Message Modal */}
            {chatPeer && user && (
                <DirectMessageChat
                    currentUser={user}
                    peer={chatPeer}
                    onClose={() => setChatPeer(null)}
                    setNotifications={setNotifications}
                />
            )}
        </div>
    );
}

// ── Auction Center ───────────────────────────────────────────────────────────
function AuctionCenter({ user, role }) {
    const [auctions, setAuctions]   = useState([]);
    const [showForm, setShowForm]   = useState(false);
    const [newAuc, setNewAuc]       = useState({ title: "", desc: "", budget: "", time: "24" });
    const [bidPrices, setBidPrices] = useState({});
    const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });

    useEffect(() => {
        const q = window.fb.query(window.fb.collection(window.db, "auctions"), window.fb.orderBy("deadline", "desc"));
        return window.fb.onSnapshot(q, snap => setAuctions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    const createAuction = async () => {
        if (!newAuc.title || !newAuc.budget) return alert("Please fill all required fields.");
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + parseInt(newAuc.time));
        await window.fb.addDoc(window.fb.collection(window.db, "auctions"), {
            title: newAuc.title, desc: newAuc.desc, budget: newAuc.budget,
            deadline: deadline.toISOString(), owner: user.uid, ownerEmail: user.email,
            bids: [], status: "active", messages: []
        });
        setNewAuc({ title: "", desc: "", budget: "", time: "24" });
        setShowForm(false);
    };

    const placeBid = async (id) => {
        const amt = bidPrices[id];
        if (!amt) return;
        await window.fb.updateDoc(window.fb.doc(window.db, "auctions", id), {
            bids: window.fb.arrayUnion({ bidder: user.email, amount: amt, time: new Date().toISOString() })
        });
        setBidPrices(p => ({ ...p, [id]: "" }));
        alert("Proposal submitted! ✅");
    };

    const handleAccept = async (aucId, winnerEmail) => {
        if (confirm(`Hire ${winnerEmail.split("@")[0]}?`)) {
            await window.fb.updateDoc(window.fb.doc(window.db, "auctions", aucId), { status: "closed", winner: winnerEmail });
        }
    };

    const submitReview = async (aucId) => {
        await window.fb.updateDoc(window.fb.doc(window.db, "auctions", aucId), { review: reviewData });
        alert("Review published! 🌟");
    };

    return (
        <div className="px-6 md:px-10 py-10 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-1">Auction Arena</h1>
                    <p className="text-slate-400 text-sm">Live project bids in real-time.</p>
                </div>
                {role === "user" && (
                    <button onClick={() => setShowForm(v => !v)} className={showForm ? "btn-dark px-6 py-3 rounded-xl" : "btn-primary px-6 py-3 rounded-xl"}>
                        {showForm ? "✕ Cancel" : "+ Post Project"}
                    </button>
                )}
            </div>

            {/* New auction form */}
            {showForm && (
                <div className="bg-white rounded-3xl border border-indigo-100 shadow-xl p-8 mb-10 animate-slide-down space-y-4">
                    <p className="font-bold text-[11px] uppercase tracking-widest text-indigo-500 mb-2">New Project Listing</p>
                    <input className="field" placeholder="Project Title *" value={newAuc.title} onChange={e => setNewAuc(p => ({ ...p, title: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-4">
                        <input className="field" type="number" placeholder="Budget ($) *" value={newAuc.budget} onChange={e => setNewAuc(p => ({ ...p, budget: e.target.value }))} />
                        <select className="field" value={newAuc.time} onChange={e => setNewAuc(p => ({ ...p, time: e.target.value }))}>
                            <option value="24">24-hour auction</option>
                            <option value="48">48-hour auction</option>
                        </select>
                    </div>
                    <textarea className="field h-28 resize-none" placeholder="Project description and requirements…" value={newAuc.desc} onChange={e => setNewAuc(p => ({ ...p, desc: e.target.value }))} />
                    <button onClick={createAuction} className="btn-primary w-full py-4 rounded-2xl">Broadcast Project</button>
                </div>
            )}

            {/* Auction list */}
            <div className="space-y-6">
                {auctions.length === 0 && (
                    <div className="text-center py-24 text-slate-300">
                        <p className="text-5xl mb-4">📭</p>
                        <p className="font-bold text-lg">No auctions yet</p>
                        <p className="text-sm mt-1">{role === "user" ? "Post the first project!" : "Check back soon for projects."}</p>
                    </div>
                )}
                {auctions.map(auc => {
                    const isOwner = auc.owner === user.uid;
                    const statusDone = auc.status === "completed";
                    const statusClosed = auc.status === "closed";

                    return (
                        <div
                            key={auc.id}
                            className={`bg-white rounded-3xl border shadow-sm p-8 transition-all ${
                                statusDone    ? "border-amber-200 bg-amber-50/40"
                                : statusClosed ? "opacity-75 border-slate-200"
                                :               "border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-transform"
                            }`}
                        >
                            {/* Auction header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                                        <AuctionTimer deadline={auc.deadline} status={auc.status} />
                                        <span className="pill bg-indigo-50 text-indigo-600">Budget: ${auc.budget}</span>
                                        {statusDone && <span className="pill bg-amber-100 text-amber-600">🏆 Completed</span>}
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight mb-1">{auc.title}</h3>
                                    <p className="text-slate-400 text-sm italic">"{auc.desc}"</p>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-300">{auc.ownerEmail?.split("@")[0]}</p>
                            </div>

                            {/* Active auction actions */}
                            {auc.status === "active" && (
                                role === "employee" ? (
                                    <div className="flex gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                        <input
                                            type="number"
                                            className="field flex-1 bg-white"
                                            placeholder="Your bid amount ($)"
                                            value={bidPrices[auc.id] || ""}
                                            onChange={e => setBidPrices(p => ({ ...p, [auc.id]: e.target.value }))}
                                        />
                                        <button onClick={() => placeBid(auc.id)} className="btn-primary px-8 py-3 rounded-xl whitespace-nowrap">Place Bid</button>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                                            Incoming Offers ({auc.bids?.length || 0})
                                        </p>
                                        {auc.bids?.length === 0 ? (
                                            <p className="text-sm text-slate-300 italic text-center py-4">No bids yet — waiting for freelancers…</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {auc.bids.map((b, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                        <div>
                                                            <p className="font-bold text-sm">{b.bidder.split("@")[0]}</p>
                                                            <p className="text-[10px] text-slate-400">{new Date(b.time).toLocaleString()}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-green-600 text-xl">${b.amount}</span>
                                                            <button onClick={() => handleAccept(auc.id, b.bidder)} className="btn-dark text-[10px] px-4 py-2 rounded-xl hover:!bg-green-600">Hire</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            )}

                            {/* Closed / completed status */}
                            {auc.status !== "active" && (
                                <div className={`rounded-2xl px-6 py-4 text-center font-bold text-sm uppercase tracking-wider ${
                                    statusDone ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-indigo-50 text-indigo-500 border border-indigo-100"
                                }`}>
                                    {statusClosed ? "✅ In Progress — Winner assigned" : "🏆 Mission Accomplished"}
                                </div>
                            )}

                            {/* Review form */}
                            {statusDone && role === "user" && isOwner && !auc.review && (
                                <div className="mt-6 bg-white rounded-2xl border-2 border-amber-200 p-6 animate-slide-up space-y-4">
                                    <p className="font-bold text-[11px] uppercase tracking-widest text-amber-500 text-center">Rate Your Experience ⭐</p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <select
                                            className="field sm:w-32"
                                            value={reviewData.rating}
                                            onChange={e => setReviewData(p => ({ ...p, rating: e.target.value }))}
                                        >
                                            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
                                        </select>
                                        <input
                                            className="field flex-1"
                                            placeholder="How did the professional perform?"
                                            onChange={e => setReviewData(p => ({ ...p, comment: e.target.value }))}
                                        />
                                        <button onClick={() => submitReview(auc.id)} className="bg-amber-500 hover:bg-amber-400 text-white px-6 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wide transition whitespace-nowrap shadow-md">
                                            Publish
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Review display */}
                            {auc.review && (
                                <div className="mt-5 bg-amber-50 border-l-4 border-amber-400 rounded-xl p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Verified Review · ★ {auc.review.rating}</p>
                                    <p className="text-sm text-slate-600 italic">"{auc.review.comment}"</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Assignments List ─────────────────────────────────────────────────────────
function AssignmentsList({ user, role }) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const key = role === "employee" ? "winner" : "ownerEmail";
        const q = window.fb.query(window.fb.collection(window.db, "auctions"), window.fb.where(key, "==", user.email));
        return window.fb.onSnapshot(q, snap =>
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.status !== "active"))
        );
    }, [user.email, role]);

    const markComplete = async (aucId) => {
        if (!confirm("Deliver the finalized project?")) return;
        await window.fb.updateDoc(window.fb.doc(window.db, "auctions", aucId), { status: "completed" });
        // Update completedJobs counter
        const q = window.fb.query(window.fb.collection(window.db, "users"), window.fb.where("email", "==", user.email));
        const snap = await window.fb.getDocs(q);
        if (!snap.empty) {
            const uid = snap.docs[0].id;
            await window.fb.updateDoc(window.fb.doc(window.db, "users", uid), {
                completedJobs: (snap.docs[0].data().completedJobs || 0) + 1
            });
        }
    };

    return (
        <div className="px-6 md:px-10 py-10 max-w-4xl mx-auto">
            <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight mb-1">Assignments</h1>
                <p className="text-slate-400 text-sm">Your active and completed project assignments.</p>
            </div>

            {items.length === 0 && (
                <div className="text-center py-24 text-slate-300">
                    <p className="text-5xl mb-4">📋</p>
                    <p className="font-bold text-lg">No assignments yet</p>
                    <p className="text-sm mt-1">Assignments will appear here once you win a bid.</p>
                </div>
            )}

            <div className="space-y-6">
                {items.map(auc => (
                    <div
                        key={auc.id}
                        className={`bg-white rounded-3xl border p-8 transition-all ${
                            auc.status === "completed" ? "opacity-60 border-slate-100" : "border-indigo-100 shadow-md"
                        }`}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <span className={`pill ${auc.status === "completed" ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-600"}`}>
                                {auc.status === "completed" ? "✅ Completed" : "🔄 In Progress"}
                            </span>
                            <span className="font-bold text-indigo-600 text-xl">${auc.budget}</span>
                        </div>

                        <h3 className="text-xl font-bold mb-1">{auc.title}</h3>
                        <p className="text-slate-400 text-sm italic mb-5">"{auc.desc}"</p>

                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Partner</p>
                                <p className="font-semibold text-sm">{role === "employee" ? auc.ownerEmail : auc.winner}</p>
                            </div>
                            {auc.status !== "completed" && role === "employee" && (
                                <button onClick={() => markComplete(auc.id)} className="btn-dark text-[11px] px-6 py-3 rounded-xl hover:!bg-amber-500">
                                    Mark as Done ✓
                                </button>
                            )}
                        </div>

                        {auc.status === "closed" && <DirectChat auctionId={auc.id} currentUserEmail={user.email} />}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Profile Editor ───────────────────────────────────────────────────────────
function ProfileEditor({ userData, refresh }) {
    const [form, setForm]     = useState({ ...userData });
    const [saved, setSaved]   = useState(false);
    const [loading, setLoading] = useState(false);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        await window.fb.updateDoc(window.fb.doc(window.db, "users", userData.uid), form);
        await refresh();
        setLoading(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const rep = getReputationBadge(form.completedJobs || 0, form.rating || 5);

    const Field = ({ label, children }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
            {children}
        </div>
    );

    return (
        <div className="px-6 md:px-10 py-10 max-w-4xl mx-auto">
            <div className="mb-10">
                <h2 className="text-4xl font-bold tracking-tight mb-1">Digital Persona</h2>
                <p className="text-slate-400 text-sm">Manage your public profile and settings.</p>
            </div>

            <form onSubmit={handleUpdate} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Banner */}
                <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
                    {form.bannerURL && <img src={form.bannerURL} className="w-full h-full object-cover opacity-60" alt="banner" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                <div className="p-8 -mt-2">
                    {/* Reputation badge */}
                    <div className="flex items-center justify-between mb-8">
                        <span className={`inline-flex items-center gap-2 text-white text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg ${rep.color}`}>
                            {rep.icon} {rep.label}
                        </span>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Completed Jobs</p>
                            <p className="text-2xl font-bold text-indigo-600">{form.completedJobs || 0}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left column */}
                        <div className="space-y-5">
                            <Field label="Public Name">
                                <input className="field" value={form.name || ""} onChange={e => set("name", e.target.value)} />
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Rate ($/hr)">
                                    <input type="number" className="field" value={form.hourlyRate || ""} onChange={e => set("hourlyRate", e.target.value)} />
                                </Field>
                                <Field label="Availability">
                                    <select className="field" value={form.status || "active"} onChange={e => set("status", e.target.value)}>
                                        <option value="active">🟢 Active</option>
                                        <option value="away">🟡 Away</option>
                                    </select>
                                </Field>
                            </div>
                            <Field label="Bio / Past Work">
                                <textarea className="field h-36 resize-none" value={form.pastWork || ""} onChange={e => set("pastWork", e.target.value)} />
                            </Field>
                        </div>

                        {/* Right column */}
                        <div className="space-y-5">
                            <Field label="Field of Work">
                                <select
                                    className="field bg-white"
                                    value={form.fieldOfWork || form.category || ""}
                                    onChange={e => setForm(p => ({ ...p, fieldOfWork: e.target.value, category: e.target.value }))}
                                >
                                    <option value="" disabled>Select your professional field…</option>
                                    <option value="Technical">💻 Technical</option>
                                    <option value="Home Services">🏠 Home Services</option>
                                    <option value="Creative">🎨 Creative</option>
                                    <option value="Health">❤️ Health</option>
                                    <option value="Digital Marketing">📣 Digital Marketing</option>
                                    <option value="Finance">💰 Finance</option>
                                    <option value="Education">📚 Education</option>
                                    <option value="Legal">⚖️ Legal</option>
                                    <option value="Other">🔧 Other</option>
                                </select>
                            </Field>
                            <Field label="Expert Skills">
                                <input className="field" placeholder="React, Plumbing, Marketing…" value={form.skills || ""} onChange={e => set("skills", e.target.value)} />
                            </Field>
                            <Field label="Banner Image URL">
                                <input className="field" placeholder="https://…" value={form.bannerURL || ""} onChange={e => set("bannerURL", e.target.value)} />
                            </Field>
                            <Field label="Avatar Image URL">
                                <input className="field" placeholder="https://…" value={form.photoURL || ""} onChange={e => set("photoURL", e.target.value)} />
                            </Field>
                            <Field label="Portfolio / Website">
                                <input className="field" placeholder="https://yoursite.com" value={form.website || ""} onChange={e => set("website", e.target.value)} />
                            </Field>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4">
                        <button className="btn-primary flex-1 py-4 rounded-2xl text-sm" disabled={loading}>
                            {loading ? "Saving…" : "Save Changes"}
                        </button>
                        {saved && <span className="text-green-600 font-bold text-sm animate-fade-in">✓ Saved!</span>}
                    </div>
                </div>
            </form>
        </div>
    );
}

// ── Mount ────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
