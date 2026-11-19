-- Your game! Change anything and watch it update.

dot : {x : W / 2, y : H / 2}

update : [dt |
  touching [(
    dot.x := touch-x
    dot.y := touch-y
  )]
]

draw : [
  clear "#223344"
  circle dot.x dot.y 30 "#ffaa00"
  text "Drag me!" (W / 2) 40 24 "#ffffff"
]
