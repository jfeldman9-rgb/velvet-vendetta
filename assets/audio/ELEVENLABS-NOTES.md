# ElevenLabs audio pass (branch `audio-elevenlabs`)

## Voices
- Bob: Benedict – Premium British (RP) Male, `6q6UVsvekS0UjrUXFz79`, model `eleven_v3`
- Cory: William – Flamboyant and Sassy, `4HvexEZMAmq2M66Ae0nD`, model `eleven_v3`
- Announcer: Jason (announcer) Instant Voice Clone, `kOmN1X3x5295JqsHsD4q`, model `eleven_v4` with `[shouting]` tags. Three takes per line; punchiest take shipped. Flow `2aTP4DTO0FxSI94W0r2m`.

## Music (`eleven_music_v2_5`, one take each, 48 kHz 24-bit stereo WAV)
- `menu.wav` — 140 s midnight opera-house instrumental (2,100 credits)
- `opera.wav` — 145 s dark combat theme with a BDB choir chant (2,175 credits)
- `glasshouse.wav` — 144 s botanical combat instrumental (2,160 credits)

## Character lines (three takes each; tightest take shipped)
- `intro-bob.mp3` — "The name is Bob. Big Dick Bob. I brought the eggplant."
- `line-bob-special.mp3` — "BDB arise! Eggplant gun's live."
- `line-bob-win.mp3` — "I'm the Papacito! Score one, Bob."
- `intro-cory.mp3` — "Easy, handsome. That little black suit is doing things for me. Try to keep up."
- `line-cory-special.mp3` — "Oh Bob... let me dress this fight in plum."
- `line-cory-win.mp3` — "Keep the shades, baby. I'll take the rest of the look."


## Announcer (Jason clone, three takes each; punchiest take shipped)
- `round1.mp3` — "Round one!"
- `round2.mp3` — "Round two!"
- `round3.mp3` — "Final round!"
- `fight.mp3` — "Fight!"
- `finish.mp3` — "Finish it with eggplant!"
- `finale-bob.mp3` — "Protocol Violet!"
- `finale-cory.mp3` — "Aubergine Ovation!"
- `bob-wins.mp3` — "Bob wins!"
- `cory-wins.mp3` — "Cory wins!"
- `time.mp3` — "Time!" (time-out with both fighters still standing)
- `perfect.mp3` — "Perfect!" (knockout with the winner at full health)
- `ko.mp3` — "K.O.!" (other knockouts; does not replace the `knockout.mp3` impact SFX)

## SFX (`eleven_text_to_sound_v3`, two takes, louder take shipped)
`punch`, `kick`, `block`, `jump`, `whoosh`, `menu-select`, `knockout`, `special-charge`, `special-bob`, `special-cory`, `finale-hit-bob`, `finale-hit-cory`

## Wiring
- Character select still plays `intro-*`.
- Punch/kick startup plays `whoosh`; hits keep distinct light/heavy impacts.
- Specials play `special-charge` plus the fighter's special SFX and banter line.
- Match results play the Jason announcer "* wins" clip, then the winner's character line.
- Round end plays `ko`, `time`, or `perfect` according to how the round ended; knockout and perfect also keep the `knockout` impact SFX.
- The finish caption and call now say "Finish it with eggplant!".
- Sound toggle, focus-loss pause, and offline local assets are unchanged.

## Credits
Live subscription balance could not be read (ElevenLabs `account_get_usage` still requires a `user_read` grant). Measured spend from generation receipts:
- Music: 6,435 credits
- SFX: about 104 credits (24 clips)
- Character TTS: 1,266 credits (18 clips)
- Announcer TTS: 795 credits (36 clips, 12 lines × 3 takes)
- Total so far: about 8,600 credits
