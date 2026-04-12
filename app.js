const { useState } = React

function App() {
  const [screen, setScreen] = useState("lobby")
  const [hostName, setHostName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [joinName, setJoinName] = useState("")
  const [err, setErr] = useState("")

  const S = {
    wrap: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--color-background-tertiary)", padding: "2rem" },
    tag: { fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 6 },
    brand: { fontFamily: "var(--font-mono)", fontSize: "2.4rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-text-primary)", marginBottom: "2.5rem" },
    card: { display: "grid", gridTemplateColumns: "1fr 0.5px 1fr", maxWidth: 580, width: "100%", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" },
    col: { padding: "1.75rem 2rem" },
    h: { fontSize: "0.68rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: "1rem" },
    inp: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: "6px 10px", fontSize: "0.85rem", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", outline: "none", width: "100%" },
    inpC: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: 8, fontSize: "2rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", textAlign: "center", color: "var(--color-text-primary)", outline: "none", width: "100%" },
    btnA: { background: "#EF9F27", border: "none", borderRadius: "var(--border-radius-md)", padding: 8, fontSize: "0.85rem", cursor: "pointer", color: "#412402", fontWeight: 500, fontFamily: "var(--font-sans)", width: "100%" },
    btn: { background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: 8, fontSize: "0.82rem", cursor: "pointer", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", width: "100%" },
    err: { fontSize: "0.8rem", color: "var(--color-text-danger)", fontFamily: "var(--font-mono)", marginTop: "0.75rem" },
    hint: { marginTop: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", letterSpacing: "0.05em" },
  }

  const onCreate = () => {
    if (!hostName.trim()) return setErr("Enter your name")
    setErr(""); alert("Room creation coming next — this is v1 deploy.")
  }
  const onJoin = () => {
    if (!joinName.trim()) return setErr("Enter your name")
    if (joinCode.trim().length !== 4) return setErr("4-letter code required")
    setErr(""); alert("Join flow coming next — this is v1 deploy.")
  }

  return (
    <div style={S.wrap}>
      <div style={S.tag}>Interactive Work Planning</div>
      <div style={S.brand}>TASK IAP</div>
      <div style={S.card}>
        <div style={S.col}>
          <div style={S.h}>Lead a Session</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <input style={S.inp} placeholder="Your name" value={hostName} onChange={e => setHostName(e.target.value)} onKeyDown={e => e.key === "Enter" && onCreate()} />
            <button style={S.btnA} onClick={onCreate}>Create Room</button>
          </div>
        </div>
        <div style={{ background: "var(--color-border-tertiary)" }} />
        <div style={S.col}>
          <div style={S.h}>Join a Session</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <input style={S.inpC} placeholder="CODE" maxLength={4} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && onJoin()} />
            <input style={S.inp} placeholder="Your name" value={joinName} onChange={e => setJoinName(e.target.value)} onKeyDown={e => e.key === "Enter" && onJoin()} />
            <button style={S.btn} onClick={onJoin}>Join Room</button>
          </div>
        </div>
      </div>
      {err && <div style={S.err}>{err}</div>}
      <div style={S.hint}>taskiap.com · v0.1</div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />)
