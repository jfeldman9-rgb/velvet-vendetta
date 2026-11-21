# ElevenLabs audio pass (branch `audio-elevenlabs`)

## Voices
- Bob: Benedict – Premium British (RP) Male, `6q6UVsvekS0UjrUXFz79`, model `eleven_v3`
- Cory: William – Flamboyant and Sassy, `4HvexEZMAmq2M66Ae0nD`, model `eleven_v3`
- Announcer: Jason asked for an Instant Voice Clone named "Jason (announcer)" from `/workspace/jasonvoice/jason_full.wav` (34.6 s). No existing personal Jason clone was in the workspace library (only public voices named Jason). The ElevenLabs MCP in this session has no Instant Voice Clone tool, and no API key was available on the box, so the original announcer clips (`round1`, `round2`, `round3`, `fight`, `finish`, `finale-bob`, `finale-cory`, `bob-wins`, `cory-wins`) are unchanged for now.

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

## SFX (`eleven_text_to_sound_v3`, two takes, louder take shipped)
`punch`, `kick`, `block`, `jump`, `whoosh`, `menu-select`, `knockout`, `special-charge`, `special-bob`, `special-cory`, `finale-hit-bob`, `finale-hit-cory`

## Wiring
- Character select still plays `intro-*`.
- Punch/kick startup plays `whoosh`; hits keep distinct light/heavy impacts.
- Specials play `special-charge` plus the fighter's special SFX and banter line.
- Match results play the existing announcer "* wins" clip, then the winner's character line.
- Sound toggle, focus-loss pause, and offline local assets are unchanged.

## Credits
Live subscription balance could not be read (ElevenLabs `account_get_usage` still requires a `user_read` grant). Measured spend from generation receipts:
- Music: 6,435 credits
- SFX: about 104 credits (24 clips)
- Character TTS: 1,266 credits (18 clips)
- Total: about 7,805 credits
