const { useState, useEffect, useCallback, useRef } = React

// ── Words (6 letters)
const WORDS = ["BREATH","CHANGE","CALMLY","BRIGHT","SLOWLY","FLIGHT","BLANCH","GROWTH","BRUNCH","CLUTCH","FROSTY","CLUMSY","BELFRY","PLENTY","QUIRKY","SWATCH","TROPHY","WRAITH","GHOSTY","CRAWLS","GLITCH","SKETCH","THWACK","BOTFLY","CRAFTY","DEFTLY","FLUNKY","JUSTLY","FRISKY","SNARKY"]
const ANSWER = WORDS[Math.floor(Math.random() * WORDS.length)]
const ROWS = 7
const COLS = 6

const STARTERS = [
  { name: "Nyah", code: "NYAHBW" },
  { name: "Keira", code: "KEIRAW" },
  { name: "Lily", code: "LILYYW" },
  { name: "Jacky", code: "JACKYW" },
  { name: "Troy", code: "TROYDW" },
]

// ── Sound
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
function playTone(freq, dur, type = "sine", vol = 0.08) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = type; osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur)
  osc.connect(gain); gain.connect(audioCtx.destination)
  osc.start(); osc.stop(audioCtx.currentTime + dur)
}
const sndType = () => playTone(880, 0.05, "square", 0.04)
const sndFlip = (i) => playTone(300 + i * 80, 0.15, "triangle", 0.06)
const sndWin = () => { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f, 0.3, "sine", 0.1), i * 120)) }
const sndLose = () => { [300,250,200].forEach((f,i) => setTimeout(() => playTone(f, 0.4, "sawtooth", 0.05), i * 200)) }
const sndError = () => playTone(150, 0.2, "square", 0.06)
const sndMeow = () => { playTone(600, 0.1, "sine", 0.08); setTimeout(() => playTone(450, 0.2, "sine", 0.08), 100) }

// ── Color logic
function getColor(letter, idx) {
  if (ANSWER[idx] === letter) return "var(--green)"
  if (ANSWER.includes(letter)) return "var(--yellow)"
  return "var(--gray)"
}

// ── Jackson the Cat
function Jackson({ mood }) {
  const faces = { neutral: "😺", happy: "😸", sad: "😿", love: "😻", sleep: "😽" }
  const face = faces[mood] || faces.neutral
  return (
    <div style={{ textAlign: "center", marginBottom: 12, animation: "catBlink 4s infinite" }}>
      <div style={{ fontSize: "2.5rem", filter: "drop-shadow(0 0 8px rgba(83,141,78,0.4))" }}>{face}</div>
      <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)", marginTop: 2 }}>Jackson</div>
    </div>
  )
}

// ── Picker screen
function PickerScreen({ onPick }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", gap: "1.5rem" }}>
      <Jackson mood="love" />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "2.2rem", fontWeight: 700, letterSpacing: "0.1em" }}>WREFLE</div>
      <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", maxWidth: 320, textAlign: "center", lineHeight: 1.5 }}>
        Pick your starting word. This locks in your first guess — then you have 6 more tries to find the secret word!
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280, marginTop: 8 }}>
        {STARTERS.map(s => (
          <button key={s.code} onClick={() => { sndType(); onPick(s) }} style={{ background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s, transform 0.1s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.transform = "scale(1.02)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "scale(1)" }}>
            <span>{s.code}</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: 400 }}>{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Game
function Game({ starter }) {
  const [guesses, setGuesses] = useState([starter.code])
  const [current, setCurrent] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState("")
  const [shakeRow, setShakeRow] = useState(-1)
  const [flipRow, setFlipRow] = useState(-1)
  const [bounceRow, setBounceRow] = useState(-1)
  const [catMood, setCatMood] = useState("neutral")
  const won = useRef(false)

  // Check if starter already won
  useEffect(() => {
    if (starter.code === ANSWER) {
      setGameOver(true)
      setMessage("Incredible! First guess!")
      setCatMood("happy")
      sndWin()
      won.current = true
    } else {
      setFlipRow(0)
      for (let i = 0; i < 6; i++) setTimeout(() => sndFlip(i), i * 80)
    }
  }, [])

  const submit = useCallback(() => {
    if (current.length !== 6) {
      setShakeRow(guesses.length)
      sndError()
      setTimeout(() => setShakeRow(-1), 400)
      return
    }
    const guess = current.toUpperCase()
    const next = [...guesses, guess]
    setGuesses(next)
    setCurrent("")
    setFlipRow(next.length - 1)
    for (let i = 0; i < 6; i++) setTimeout(() => sndFlip(i), i * 80)

    if (guess === ANSWER) {
      won.current = true
      setTimeout(() => {
        setGameOver(true)
        setMessage("You got it! 🎉")
        setCatMood("happy")
        setBounceRow(next.length - 1)
        sndWin()
        sndMeow()
      }, 500)
    } else if (next.length >= ROWS) {
      setTimeout(() => {
        setGameOver(true)
        setMessage(`The word was ${ANSWER}`)
        setCatMood("sad")
        sndLose()
      }, 500)
    } else {
      setTimeout(() => setCatMood("neutral"), 600)
    }
  }, [current, guesses])

  const onKey = useCallback((key) => {
    if (gameOver) return
    if (key === "ENTER") return submit()
    if (key === "BACKSPACE" || key === "⌫") { setCurrent(c => c.slice(0, -1)); return }
    if (/^[A-Z]$/.test(key) && current.length < 6) { setCurrent(c => c + key); sndType() }
  }, [current, gameOver, submit])

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) return
      const k = e.key.toUpperCase()
      if (k === "ENTER" || k === "BACKSPACE" || (/^[A-Z]$/.test(k) && k.length === 1)) {
        e.preventDefault()
        onKey(k)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onKey])

  // Keyboard colors
  const usedColors = {}
  guesses.forEach(g => {
    for (let i = 0; i < 6; i++) {
      if (!g[i]) continue
      const c = getColor(g[i], i)
      const prev = usedColors[g[i]]
      if (c === "var(--green)" || !prev) usedColors[g[i]] = c
      else if (c === "var(--yellow)" && prev !== "var(--green)") usedColors[g[i]] = c
    }
  })

  const kbRows = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    ["ENTER", ..."ZXCVBNM".split(""), "⌫"]
  ]

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem 1rem 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, width: "100%", maxWidth: 400, justifyContent: "center" }}>
        <span style={{ fontSize: "1.4rem" }}>😺</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "0.1em" }}>WREFLE</span>
        <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
          {starter.name}'s game
        </span>
      </div>

      <div style={{ height: 1, background: "var(--border)", width: "100%", maxWidth: 400, marginBottom: 12 }} />

      {/* Message */}
      {message && (
        <div className="fade-in" style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", marginBottom: 10, padding: "6px 16px", background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 6, fontWeight: 600 }}>
          {message}
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
        {Array.from({ length: ROWS }).map((_, row) => {
          const guess = guesses[row]
          const isCurrentRow = row === guesses.length && !gameOver
          const isFirst = row === 0
          return (
            <div key={row}
              className={shakeRow === row ? "shake" : bounceRow === row ? "bounce" : ""}
              style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 5 }}>
              {Array.from({ length: COLS }).map((_, col) => {
                let letter = ""
                let bg = "transparent"
                let border = "2px solid var(--border)"
                if (guess) {
                  letter = guess[col]
                  bg = getColor(letter, col)
                  border = `2px solid ${bg}`
                } else if (isCurrentRow && current[col]) {
                  letter = current[col]
                  border = "2px solid var(--text-dim)"
                }
                return (
                  <div key={col}
                    className={flipRow === row && guess ? "flip" : (isCurrentRow && current.length === col + 1 ? "pop" : "")}
                    style={{
                      width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.4rem", fontWeight: 700, fontFamily: "var(--font-mono)",
                      background: bg, border, borderRadius: 4, color: "var(--text)",
                      animationDelay: guess ? `${col * 0.08}s` : "0s",
                      opacity: isFirst ? 0.85 : 1,
                      textTransform: "uppercase",
                    }}>
                    {letter}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Jackson */}
      <Jackson mood={catMood} />

      {/* Keyboard */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {kbRows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 5 }}>
            {row.map(k => {
              const isWide = k === "ENTER" || k === "⌫"
              const color = usedColors[k]
              return (
                <button key={k} onClick={() => onKey(k === "⌫" ? "BACKSPACE" : k)}
                  style={{
                    minWidth: isWide ? 56 : 32, height: 50, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 4, fontSize: isWide ? "0.68rem" : "0.85rem", fontWeight: 600,
                    fontFamily: "var(--font-mono)", cursor: "pointer", border: "none",
                    background: color || "var(--key-bg)", color: "var(--text)", padding: "0 6px",
                    transition: "transform 0.1s",
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.92)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  {k}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-dim)", paddingBottom: 16 }}>
        wrefle · taskiap.com
      </div>
    </div>
  )
}

// ── Root
function App() {
  const [starter, setStarter] = useState(null)
  if (!starter) return <PickerScreen onPick={setStarter} />
  return <Game starter={starter} />
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
