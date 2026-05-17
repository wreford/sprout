const { useState, useEffect, useCallback, useRef } = React

// ── Config
const COLS = 5
const ROWS = 7
const STARTERS = [
  { name: "Nyah", code: "NYAHW" },
  { name: "Keira", code: "KEIRA" },
  { name: "Lily", code: "LILYW" },
  { name: "Jacky", code: "JACKY" },
  { name: "Troy", code: "TROYW" },
]

// ── Dictionary (loaded from CDN)
let DICT = new Set()
let ANSWERS = []
const DICT_URL = "https://raw.githubusercontent.com/benhoyt/genesis/master/five-letter-words.txt"

async function loadDict() {
  try {
    const res = await fetch(DICT_URL)
    const text = await res.text()
    const words = text.trim().split(/\s+/).map(w => w.toUpperCase()).filter(w => w.length === 5 && /^[A-Z]+$/.test(w))
    DICT = new Set(words)
    ANSWERS = words.filter(w => {
      const vowels = (w.match(/[AEIOU]/g) || []).length
      return vowels >= 1 && vowels <= 3
    })
    // Add our starter words to dictionary so they're valid
    STARTERS.forEach(s => DICT.add(s.code))
  } catch {
    // Fallback
    const fallback = ["CRANE","SLATE","BRAIN","CLOTH","TREND","FROST","GRIND","SWIRL","PLUME","DWELT","CHUNK","BLAZE","DRIFT","STOMP","CRISP","PLANT","SWIFT","CHARM","BRIEF","GLYPH","WALTZ","PERCH","STORK","QUILT","RELIC","BUDGE","VIGOR","JEWEL","NYMPH","PSALM"]
    DICT = new Set(fallback)
    ANSWERS = fallback
    STARTERS.forEach(s => DICT.add(s.code))
  }
}

function pickAnswer() {
  if (ANSWERS.length === 0) return "CRANE"
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
}

// ── Stats
function loadStats() {
  try { return JSON.parse(localStorage.getItem("wrefle-stats")) || { played: 0, won: 0, streak: 0, maxStreak: 0, dist: [0,0,0,0,0,0,0] } }
  catch { return { played: 0, won: 0, streak: 0, maxStreak: 0, dist: [0,0,0,0,0,0,0] } }
}
function saveStats(s) { localStorage.setItem("wrefle-stats", JSON.stringify(s)) }

// ── Sound
let audioCtx = null
function getAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx }
function playTone(freq, dur, type = "sine", vol = 0.06) {
  const ctx = getAudio()
  const osc = ctx.createOscillator(); const gain = ctx.createGain()
  osc.type = type; osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(); osc.stop(ctx.currentTime + dur)
}
const sndType = () => playTone(880, 0.04, "square", 0.03)
const sndFlip = (i) => playTone(300 + i * 60, 0.12, "triangle", 0.05)
const sndWin = () => { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f, 0.25, "sine", 0.08), i * 100)) }
const sndLose = () => { [300,250,200].forEach((f,i) => setTimeout(() => playTone(f, 0.3, "sawtooth", 0.04), i * 180)) }
const sndError = () => playTone(150, 0.15, "square", 0.05)

// ── Giphy
const GIPHY_KEY = "dc6zaTOxFJmzC" // Public beta key
async function fetchGif(tag) {
  try {
    const res = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_KEY}&tag=${encodeURIComponent(tag)}&rating=g`)
    const data = await res.json()
    return data.data?.images?.fixed_height?.url || null
  } catch { return null }
}

// ── Color
function getColor(letter, idx, answer) {
  if (answer[idx] === letter) return "var(--green)"
  if (answer.includes(letter)) return "var(--yellow)"
  return "var(--gray)"
}

// ── Jackson
function Jackson({ mood, size = "2rem" }) {
  const faces = { neutral: "😺", happy: "😸", sad: "😿", love: "😻", think: "🐱" }
  return <span style={{ fontSize: size }}>{faces[mood] || faces.neutral}</span>
}

// ── Picker
function PickerScreen({ onPick, stats }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", gap: "1rem" }}>
      <Jackson mood="love" size="2.5rem" />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.8rem,8vw,2.4rem)", fontWeight: 700, letterSpacing: "0.1em" }}>WREFLE</div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>
        Pick your starter word — it locks in as guess #1. Then find the 5-letter word!
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 260 }}>
        {STARTERS.map(s => (
          <button key={s.code} onClick={() => { sndType(); onPick(s) }} style={{ background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{s.code}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontWeight: 400 }}>{s.name}</span>
          </button>
        ))}
      </div>
      {stats.played > 0 && (
        <div style={{ marginTop: 12, background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 16px", display: "flex", gap: 16, fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.2rem", color: "var(--text)", fontWeight: 700 }}>{stats.played}</div>Played</div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.2rem", color: "var(--text)", fontWeight: 700 }}>{stats.played ? Math.round(stats.won / stats.played * 100) : 0}%</div>Win</div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.2rem", color: "var(--text)", fontWeight: 700 }}>{stats.streak}</div>Streak</div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.2rem", color: "var(--green)", fontWeight: 700 }}>{stats.maxStreak}</div>Best</div>
        </div>
      )}
    </div>
  )
}

// ── Game
function Game({ starter, onDone, stats }) {
  const [answer] = useState(() => pickAnswer())
  const [guesses, setGuesses] = useState([starter.code])
  const [current, setCurrent] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState("")
  const [shakeRow, setShakeRow] = useState(-1)
  const [flipRow, setFlipRow] = useState(-1)
  const [bounceRow, setBounceRow] = useState(-1)
  const [catMood, setCatMood] = useState("neutral")
  const [gif, setGif] = useState(null)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    if (starter.code === answer) {
      setGameOver(true); setMessage("No way! First try!"); setCatMood("happy"); sndWin()
      const s = { ...stats, played: stats.played + 1, won: stats.won + 1, streak: stats.streak + 1, maxStreak: Math.max(stats.maxStreak, stats.streak + 1) }
      s.dist[0]++; saveStats(s)
      fetchGif("excited cat").then(setGif)
    } else {
      setFlipRow(0)
      for (let i = 0; i < 5; i++) setTimeout(() => sndFlip(i), i * 70)
    }
  }, [])

  const submit = useCallback(() => {
    if (current.length !== 5) { setShakeRow(guesses.length); sndError(); setTimeout(() => setShakeRow(-1), 400); return }
    const guess = current.toUpperCase()
    if (!DICT.has(guess)) {
      setMessage("Not in dictionary"); setShakeRow(guesses.length); sndError()
      setTimeout(() => { setShakeRow(-1); setMessage("") }, 1000)
      return
    }
    const next = [...guesses, guess]
    setGuesses(next); setCurrent(""); setFlipRow(next.length - 1)
    for (let i = 0; i < 5; i++) setTimeout(() => sndFlip(i), i * 70)

    if (guess === answer) {
      setTimeout(() => {
        setGameOver(true); setMessage("You got it!"); setCatMood("happy"); setBounceRow(next.length - 1); sndWin()
        const s = { ...stats, played: stats.played + 1, won: stats.won + 1, streak: stats.streak + 1, maxStreak: Math.max(stats.maxStreak, stats.streak + 1) }
        s.dist[next.length - 1]++; saveStats(s); setShowStats(true)
        fetchGif("happy cat celebration").then(setGif)
      }, 450)
    } else if (next.length >= ROWS) {
      setTimeout(() => {
        setGameOver(true); setMessage(`It was ${answer}`); setCatMood("sad"); sndLose()
        const s = { ...stats, played: stats.played + 1, streak: 0 }; saveStats(s); setShowStats(true)
        fetchGif("sad cat").then(setGif)
      }, 450)
    }
  }, [current, guesses, answer, stats])

  const onKey = useCallback((key) => {
    if (gameOver) return
    if (key === "ENTER") return submit()
    if (key === "BACKSPACE" || key === "⌫") return setCurrent(c => c.slice(0, -1))
    if (/^[A-Z]$/.test(key) && current.length < 5) { setCurrent(c => c + key); sndType() }
  }, [current, gameOver, submit])

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) return
      const k = e.key.toUpperCase()
      if (k === "ENTER" || k === "BACKSPACE" || (/^[A-Z]$/.test(k) && k.length === 1)) { e.preventDefault(); onKey(k) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onKey])

  const usedColors = {}
  guesses.forEach(g => {
    for (let i = 0; i < 5; i++) {
      if (!g[i]) continue
      const c = getColor(g[i], i, answer)
      const prev = usedColors[g[i]]
      if (c === "var(--green)" || !prev) usedColors[g[i]] = c
      else if (c === "var(--yellow)" && prev !== "var(--green)") usedColors[g[i]] = c
    }
  })

  const kbRows = ["QWERTYUIOP".split(""),"ASDFGHJKL".split(""),["ENTER",..."ZXCVBNM".split(""),"⌫"]]
  const cellSize = Math.min(56, (window.innerWidth - 60) / 5)
  const keyW = Math.min(34, (window.innerWidth - 80) / 10)

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", padding: "0.5rem 0.5rem 0", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 360, padding: "6px 0", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
        <Jackson mood={catMood} size="1.4rem" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.08em" }}>WREFLE</span>
        <span style={{ fontSize: "0.6rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>{starter.name}</span>
      </div>

      {/* Message */}
      {message && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", margin: "4px 0", padding: "4px 12px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 5, fontWeight: 600 }}>
          {message}
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "6px 0" }}>
        {Array.from({ length: ROWS }).map((_, row) => {
          const guess = guesses[row]
          const isCurrentRow = row === guesses.length && !gameOver
          return (
            <div key={row} className={shakeRow === row ? "shake" : bounceRow === row ? "bounce" : ""}
              style={{ display: "grid", gridTemplateColumns: `repeat(5, 1fr)`, gap: 4 }}>
              {Array.from({ length: COLS }).map((_, col) => {
                let letter = ""; let bg = "transparent"; let border = "2px solid var(--border)"
                if (guess) { letter = guess[col]; bg = getColor(letter, col, answer); border = `2px solid ${bg}` }
                else if (isCurrentRow && current[col]) { letter = current[col]; border = "2px solid var(--text-dim)" }
                return (
                  <div key={col} className={flipRow === row && guess ? "flip" : (isCurrentRow && current.length === col + 1 ? "pop" : "")}
                    style={{ width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${cellSize * 0.5}px`, fontWeight: 700, fontFamily: "var(--font-mono)", background: bg, border, borderRadius: 4, color: "var(--text)", animationDelay: guess ? `${col * 0.07}s` : "0s", textTransform: "uppercase" }}>
                    {letter}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Gif */}
      {gif && <img src={gif} alt="reaction" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 8, margin: "8px 0" }} />}

      {/* Stats popup */}
      {showStats && (
        <div style={{ background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", margin: "6px 0", display: "flex", gap: 14, fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.1rem", color: "var(--text)", fontWeight: 700 }}>{stats.played + 1}</div>Played</div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.1rem", color: "var(--text)", fontWeight: 700 }}>{Math.round((stats.won + (guesses[guesses.length-1] === answer ? 1 : 0)) / (stats.played + 1) * 100)}%</div>Win</div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.1rem", color: "var(--text)", fontWeight: 700 }}>{guesses[guesses.length-1] === answer ? stats.streak + 1 : 0}</div>Streak</div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.1rem", color: "var(--green)", fontWeight: 700 }}>{Math.max(stats.maxStreak, guesses[guesses.length-1] === answer ? stats.streak + 1 : 0)}</div>Best</div>
        </div>
      )}

      {/* Play Again */}
      {gameOver && (
        <button onClick={onDone} style={{ margin: "8px 0", background: "var(--green)", border: "none", borderRadius: 6, padding: "10px 24px", color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
          Play Again
        </button>
      )}

      {/* Keyboard */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center", marginTop: "auto", paddingBottom: 10 }}>
        {kbRows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 4 }}>
            {row.map(k => {
              const isWide = k === "ENTER" || k === "⌫"
              const color = usedColors[k]
              return (
                <button key={k} onClick={() => onKey(k === "⌫" ? "BACKSPACE" : k)}
                  style={{ minWidth: isWide ? keyW * 1.6 : keyW, height: 46, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: isWide ? "0.6rem" : "0.78rem", fontWeight: 600, fontFamily: "var(--font-mono)", cursor: "pointer", border: "none", background: color || "var(--key-bg)", color: "var(--text)", padding: "0 4px" }}>
                  {k}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Root
function App() {
  const [ready, setReady] = useState(false)
  const [starter, setStarter] = useState(null)
  const [stats, setStats] = useState(loadStats)
  const [key, setKey] = useState(0)

  useEffect(() => { loadDict().then(() => setReady(true)) }, [])

  const reset = () => { setStarter(null); setStats(loadStats()); setKey(k => k + 1) }

  if (!ready) return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Jackson mood="think" size="2rem" />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-dim)" }}>Loading dictionary...</div>
    </div>
  )
  if (!starter) return <PickerScreen onPick={setStarter} stats={stats} />
  return <Game key={key} starter={starter} onDone={reset} stats={stats} />
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
