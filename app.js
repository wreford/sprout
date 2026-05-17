const { useState, useEffect, useCallback } = React

const WORDS = ["CRANE","SLATE","TRAIL","PLUMB","FORGE","BRINE","SHALE","DRAFT","GLOBE","STOMP","BLAZE","FROST","GRIND","CLAMP","SWIRL","PLUME","STARK","DWELL","POISE","CHUNK","GLYPH","QUERY","VIVID","WALTZ","NEXUS","ADEPT","BLURT","CRYPT","FJORD","KNELT"]
const ANSWER = WORDS[Math.floor(Math.random() * WORDS.length)]
const ROWS = 6
const COLS = 5

function getColor(letter, idx, guess) {
  if (ANSWER[idx] === letter) return "#6aaa64"
  if (ANSWER.includes(letter)) return "#c9b458"
  return "#787c7e"
}

function App() {
  const [guesses, setGuesses] = useState([])
  const [current, setCurrent] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState("")

  const submit = useCallback(() => {
    if (current.length !== 5) return
    const next = [...guesses, current]
    setGuesses(next)
    setCurrent("")
    if (current === ANSWER) {
      setGameOver(true)
      setMessage("Nice! You got it!")
    } else if (next.length >= ROWS) {
      setGameOver(true)
      setMessage(`Game over — the word was ${ANSWER}`)
    }
  }, [current, guesses])

  const onKey = useCallback((key) => {
    if (gameOver) return
    if (key === "ENTER") return submit()
    if (key === "BACKSPACE" || key === "⌫") return setCurrent(c => c.slice(0, -1))
    if (/^[A-Z]$/.test(key) && current.length < 5) setCurrent(c => c + key)
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

  const usedColors = {}
  guesses.forEach(g => {
    for (let i = 0; i < 5; i++) {
      const c = getColor(g[i], i, g)
      const prev = usedColors[g[i]]
      if (c === "#6aaa64" || (!prev)) usedColors[g[i]] = c
      else if (c === "#c9b458" && prev !== "#6aaa64") usedColors[g[i]] = c
    }
  })

  const S = {
    wrap: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", background: "var(--color-background-tertiary)", padding: "1.5rem" },
    tag: { fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 4 },
    brand: { fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-text-primary)", marginBottom: "1.5rem" },
    grid: { display: "grid", gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: 6, marginBottom: "1.5rem" },
    row: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 },
    cell: { width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-mono)", border: "2px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", textTransform: "uppercase" },
    filled: { borderColor: "#878a8c" },
    revealed: (color) => ({ background: color, borderColor: color, color: "#fff" }),
    msg: { fontFamily: "var(--font-mono)", fontSize: "0.9rem", marginBottom: "1rem", color: "var(--color-text-primary)", fontWeight: 600 },
    kb: { display: "flex", flexDirection: "column", gap: 6, alignItems: "center" },
    kbRow: { display: "flex", gap: 5 },
    key: (color) => ({ minWidth: 36, height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--border-radius-md)", fontSize: "0.82rem", fontWeight: 600, fontFamily: "var(--font-mono)", cursor: "pointer", border: "none", background: color || "#d3d6da", color: color ? "#fff" : "var(--color-text-primary)", padding: "0 8px" }),
    wide: { minWidth: 60 },
    hint: { marginTop: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", letterSpacing: "0.05em" },
  }

  const kbRows = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    ["ENTER", ..."ZXCVBNM".split(""), "⌫"]
  ]

  return (
    <div style={S.wrap}>
      <div style={S.tag}>taskiap.com</div>
      <div style={S.brand}>TASK IAP</div>

      {message && <div style={S.msg}>{message}</div>}

      <div style={S.grid}>
        {Array.from({ length: ROWS }).map((_, row) => {
          const guess = guesses[row]
          const isCurrentRow = row === guesses.length && !gameOver
          return (
            <div key={row} style={S.row}>
              {Array.from({ length: COLS }).map((_, col) => {
                let letter = ""
                let style = { ...S.cell }
                if (guess) {
                  letter = guess[col]
                  Object.assign(style, S.revealed(getColor(letter, col, guess)))
                } else if (isCurrentRow && current[col]) {
                  letter = current[col]
                  Object.assign(style, S.filled)
                }
                return <div key={col} style={style}>{letter}</div>
              })}
            </div>
          )
        })}
      </div>

      <div style={S.kb}>
        {kbRows.map((row, ri) => (
          <div key={ri} style={S.kbRow}>
            {row.map(k => {
              const isWide = k === "ENTER" || k === "⌫"
              const color = usedColors[k] || null
              return (
                <button key={k} style={{ ...S.key(color), ...(isWide ? S.wide : {}) }} onClick={() => onKey(k === "⌫" ? "BACKSPACE" : k)}>
                  {k}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div style={S.hint}>v0.2 · wordle</div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
