# ElevenLabs audio pass (branch `audio-elevenlabs`)

## Voices
- Bob: Benedict – Premium British (RP) Male, `6q6UVsvekS0UjrUXFz79`, model `eleven_v3`
- Cory: William – Flamboyant and Sassy, `4HvexEZMAmq2M66Ae0nD`, model `eleven_v3`
- Announcer: Jason Instant Voice Clone (app re-clone), `Of6MrggueGNHio3zxb9C`, model `eleven_multilingual_v2`. Jason said the prior `eleven_v4` + `[shouting]` pack on this branch was too excited, so every announcer line was redone with period punctuation, no caps, and no audio tags such as `[excited]` or `[shouting]`. The Creative MCP tool cannot set stability or style sliders; `eleven_multilingual_v2` was used instead because it is naturally more even than v4. Three takes per line; the calmest clear Whisper take shipped (exact or near-exact transcript, then lowest RMS). Flow `2aTP4DTO0FxSI94W0r2m`. This replaces the earlier `kOmN1X3x5295JqsHsD4q` announcer pack and the hyped v4 pack on this branch.

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


## Announcer (Jason clone, three calm takes each; calmest clear take shipped)
Wording is unchanged; prompts used periods instead of exclamation marks.
- `round1.mp3` — "Round one."
- `round2.mp3` — "Round two."
- `round3.mp3` — "Final round."
- `fight.mp3` — "Cory and Big Dick Bob, fight. May the best eggplant win." (default, ~2.93 s)
- `fight-cory-and-bob.mp3` — shorter alternate, "Cory and Bob, fight." (in the repo and sampler; not wired)
- `finish.mp3` — "Finish it with eggplant."
- `finale-bob.mp3` — "Protocol Violet."
- `finale-cory.mp3` — "Aubergine Ovation."
- `bob-wins.mp3` — "Bob wins."
- `cory-wins.mp3` — "Cory wins."
- `time.mp3` — "Time." (time-out with both fighters still standing)
- `perfect.mp3` — "Perfect." (knockout with the winner at full health)
- `ko-bob.mp3` — "Buck 75 down." (Bob wins by knockout)
- `ko-cory.mp3` — "Tell the Colombian to bring a body bag." (Cory wins by knockout)
- `ko.mp3` — "Knockout." unused fallback only; does not replace the `knockout.mp3` impact SFX. The old "K.O.!" wording was dropped because the clone did not say it clearly.

## SFX (`eleven_text_to_sound_v3`, two takes, louder take shipped)
`punch`, `kick`, `block`, `jump`, `whoosh`, `menu-select`, `knockout`, `special-charge`, `special-bob`, `special-cory`, `finale-hit-bob`, `finale-hit-cory`

## Wiring
- Character select still plays `intro-*`.
- Punch/kick startup plays `whoosh`; hits keep distinct light/heavy impacts.
- Specials play `special-charge` plus the fighter's special SFX and banter line.
- Match results play the Jason announcer "* wins" clip, then the winner's character line.
- Round end plays `time` or `perfect` as before. A regular knockout plays `ko-bob` or `ko-cory` by winner; knockout and perfect also keep the `knockout` impact SFX.
- Intro holds long enough for the default fight call (~5.0 s) before live combat starts. The hold was tightened from 6.2 s because the calm long fight line is about 2.93 s (cued at 1.50 s).
- The finish caption and call now say "Finish it with eggplant!".
- Sound toggle, focus-loss pause, and offline local assets are unchanged.

## Credits
Live subscription balance could not be read (ElevenLabs `account_get_usage` still requires a `user_read` grant). Measured spend from generation receipts:
- Music: 6,435 credits
- SFX: about 104 credits (24 clips)
- Character TTS: 1,266 credits (18 clips)
- Announcer TTS (Jason app-clone pass, hyped v4 pack): 1,769 credits (original 12 lines × 3 takes = 795; fight/KO wording retries and sampler labels = 705; winner-specific KO lines and labels = 269)
- Announcer TTS (calm multilingual v2 redo on this branch): 865 credits (15 lines × 3 takes = 777; four sampler labels × 1 take = 88)
- Total so far: about 11,234 credits
