# Sample SFX · Blended Zebra

Retro sound effects fetched from the Phaser examples asset library
(github.com/phaserjs/examples, public/assets/audio/SoundEffects) — the
demo assets that ship with the Phaser game framework's example suite.
Downloaded via raw.githubusercontent.com and committed here so the game
stays fully self-hosted with zero runtime dependencies.

Samples are decoded through WebAudio into the game's master bus
(compressor + volume), pitch-randomized per play, and LAYERED over the
existing synthesized effects — if a sample hasn't loaded (or ever fails),
the synth plays alone, so audio never breaks.

hit: shot1.wav · alt hit: shot2.wav · big hit / KO: explosion.mp3 +
blaster.mp3 · card play: key.wav · UI click: numkey.wav · stripes /
rewards: pickup.wav · blend: squit.wav
