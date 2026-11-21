/* On-screen captions only. No new audio. Campy, affectionate ribbing. */
(function (root) {
  "use strict";
  const table = {
    cory: {
      intro: [
        "Easy, handsome. The suit is working.",
        "Save me a bow. I wore the good feathers.",
        "I still get the last look. You know that.",
        "Do not go shy. I dressed for a crowd.",
        "That tie is a dare. I accept.",
        "Win two, then we talk lighting.",
        "Hands where I can see them, agent.",
        "Plum, gold, and no mercy tonight.",
        "If you win, I still pick the encore.",
        "Smile for the boxes, Bob."
      ],
      taunt: [
        "Watching the feathers, or the footwork?",
        "Cute guard. It will not save the tie.",
        "Closer. I work well in bad light.",
        "You are thinking about the suit.",
        "Buck 75 energy. Still no dance.",
        "I could end this. You look busy.",
        "Left, right, sigh. Come here.",
        "The Colombian can wait. I cannot.",
        "Hold that pose for the boxes.",
        "I flirt harder when I am ahead."
      ],
      bigHit: [
        "There. The suit has my wrinkle.",
        "Affectionate. The next one is art.",
        "Blink and you miss the encore.",
        "Gold rings. Clean contact.",
        "The cheap seats felt that.",
        "Regards to the Colombian, and a bruise.",
        "Feathers in. Textbook, darling.",
        "You can have that one back.",
        "Plum on the knuckles suits you.",
        "Big hit. I warned you about the smile."
      ],
      block: [
        "Sturdy. Do that again.",
        "Guarded, and still watching me.",
        "That all you brought, agent?",
        "I felt the intent. Not the hit.",
        "Block me right, or buy dinner.",
        "The plum does not bruise easy.",
        "Hold that guard. I can wait.",
        "Denied. I will be more charming.",
        "He sends flowers. You send blocks.",
        "Saved by the suit. I respect it."
      ],
      special: [
        "Orchid Rush. Look pretty in it.",
        "Petals. A plain hit would be rude.",
        "Hold still. The flowers have notes.",
        "This is where the room gasps.",
        "Plum, gold, a little violence.",
        "For you, Bob. Do not waste it.",
        "I dressed the exchange. Welcome.",
        "Signature, sweetheart. Well spent.",
        "Catch a petal. Call it a souvenir.",
        "This light. The orchids agree."
      ],
      meter: [
        "Meter is full. I am about to glow.",
        "Signature ready. Fix your tie.",
        "That glow is not a metaphor.",
        "Forty even. The orchids are impatient.",
        "Hold that thought. I am charged.",
        "The room can feel it. So can you.",
        "Full meter. Full feathers.",
        "I could spend this on you.",
        "Ready when you are. I have been.",
        "That bar just made me a promise."
      ],
      roundWin: [
        "Round to me. Applaud, or blush.",
        "The feathers were load-bearing.",
        "One for plum. Fix your square.",
        "You almost had me. Cute look.",
        "Score one. Defeat wears well on you.",
        "The boxes agree. They usually do.",
        "Round is mine. Come get the next.",
        "I will take the round and the view.",
        "Buck 75 can wait. This bell is mine.",
        "Winning looks good. You noticed."
      ],
      roundLoss: [
        "Fine. The round, not the encore.",
        "You got me. Rude, and a little warm.",
        "One for the suit. I will invoice you.",
        "Enjoy it. I am warming up.",
        "That round had your name. Briefly.",
        "I allowed that. Tell no one.",
        "Loss looks temporary in this outfit.",
        "You can have it. I keep the light.",
        "Noted, agent. I am just warming up.",
        "One down. Pride is theatrical."
      ],
      matchWin: [
        "Match mine. Keep the shades, darling.",
        "That is a velvet ending.",
        "Two rounds. You may kiss the winner.",
        "Tell the Colombian the house stands.",
        "I win. You brood. We are in character.",
        "The opera house will talk. Let them.",
        "Victory, plum edition. You were lovely.",
        "I promised a show. Best seat in it.",
        "Eggplant optional. Affection is not.",
        "Curtain. See you in the rematch."
      ],
      finisher: [
        "Aubergine Ovation. Watch the bouquet.",
        "Bow. The eggplant brought flowers.",
        "Disappear gracefully for me.",
        "Petals, gold, one perfect vegetable.",
        "Roses were too plain. You get aubergine.",
        "Hold for applause. The flowers finish.",
        "Aubergine Ovation. My best exit.",
        "Do not fight the petals. They like you.",
        "He wanted a bag. I brought a bouquet.",
        "Blow a kiss. The ovation does the rest."
      ]
    },
    bob: {
      intro: [
        "The name is Bob. Stay focused.",
        "Feathers noted. Threat still open.",
        "You talk. I close distance.",
        "Save the encore. Win the room.",
        "I brought the eggplant. You, the parade.",
        "Flirting is not cover. Not unpleasant.",
        "Two clean rounds. Then the collar.",
        "The shades stay on. Courtesy.",
        "No encores before the bell.",
        "I am listening. Guard stays up."
      ],
      taunt: [
        "Less speech. More guard.",
        "The kick telegraphs. The smile does not.",
        "I have been called worse. Nicer suits.",
        "Advance, then. I am not posing.",
        "Still not dropping the shades.",
        "Eggplant stays holstered. Earn it.",
        "You enjoy this. So do I.",
        "Talk after the round. I am working.",
        "Pretty collar. Predictable range.",
        "Keep the compliment. I keep center."
      ],
      bigHit: [
        "Clean hit. Admire it later.",
        "That was the job. Compliment is extra.",
        "Still standing. I was not done.",
        "Follow through. I agree with protocol.",
        "You leaned in. I accepted.",
        "Buck 75 down is a process.",
        "Noted on the ribs. Continuing.",
        "I do not gloat. I do connect.",
        "There. Less talking, briefly.",
        "Effective. Fine, satisfying."
      ],
      block: [
        "Blocked. You remain decorative.",
        "A breeze. Not the point.",
        "Again. I have the angle.",
        "Guard holds. Attention, also.",
        "Predictable. Still well dressed.",
        "No. Try the other side.",
        "Almost a compliment. Almost a hit.",
        "Shades on. Guard up.",
        "Denied. Eggplant stays in reserve.",
        "You get the block. Not the round."
      ],
      special: [
        "Null Protocol. Please hold.",
        "Less petals. More result.",
        "Eggplant is live. Stand clear.",
        "Short range. Clean exit.",
        "The cold one. Do not flirt with it.",
        "Protocol Violet starts with this.",
        "Meter spent. You look fine.",
        "BDB arise. That is the briefing.",
        "Cyan on black. It reads.",
        "A professional courtesy. Pulse."
      ],
      meter: [
        "Signature ready. Enjoy the briefing.",
        "Meter is full. I will be brief.",
        "Forty. Protocol is available.",
        "Charged. The eggplant is patient.",
        "Full meter. No speech required.",
        "I could end this. I might wait.",
        "Ready. You may stay distracting.",
        "The bar is full. So is my day.",
        "Null Protocol is on the table.",
        "Charged. Shades stay on for this."
      ],
      roundWin: [
        "Round to me. You can have the applause.",
        "Clean round. Messy collar.",
        "That is one. Excellent company.",
        "I took the round. You took the room.",
        "Still talking. Still behind.",
        "One round. I will not enjoy the lead.",
        "Efficient. Keep the feathers.",
        "Score one, Bob. You knew.",
        "The bell agrees with the file.",
        "Round secured. Quietly noted."
      ],
      roundLoss: [
        "You take that one. I have the file.",
        "Fair hit. Unfair amount of smiling.",
        "Round to you. I will adjust.",
        "Enjoy the bell. I am walking back.",
        "Yours. The next one is a talk.",
        "I slipped. The shades did not.",
        "One for you. I remain employed.",
        "Granted. Do not get poetic.",
        "You earned it. Annoyingly.",
        "Loss logged. Affection logged."
      ],
      matchWin: [
        "Match secured. You get the speech.",
        "Two rounds. Score it to Bob.",
        "File closed. You were the hard part.",
        "I win. Flirting can run off the clock.",
        "Victory. Buck 75 hears about it later.",
        "That is the match. You look fine.",
        "Clean work. Messy feelings. Fine.",
        "I took the long way. Still took it.",
        "Winner, Bob. The audience is yours.",
        "Done. It was fun. Do not quote me."
      ],
      finisher: [
        "Protocol Violet. Deletion, not a speech.",
        "Hold still. The eggplant is filing you.",
        "Tidy, digital, and a little fond.",
        "Scan complete. Worthy record.",
        "Protocol Violet. Shades stay on.",
        "No bouquet. A clean erase, and a nod.",
        "The pixels get the last word.",
        "Most files do not get a goodbye.",
        "Violet protocol. You can stop posing.",
        "Eggplant, execute. I will remember you."
      ]
    }
  };
  function Director(random) {
    this.random = random || Math.random;
    this.last = Object.create(null);
  }
  Director.prototype.take = function (id, category) {
    const list = table[id] && table[id][category];
    if (!list || !list.length) return "";
    const key = id + "\n" + category;
    let index = Math.floor(this.random() * list.length);
    if (list.length > 1 && index === this.last[key]) index = (index + 1) % list.length;
    this.last[key] = index;
    return list[index];
  };
  const api = { table: table, Director: Director };
  root.VelvetDialogue = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window === "undefined" ? globalThis : window);
