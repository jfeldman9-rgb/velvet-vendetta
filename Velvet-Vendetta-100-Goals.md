# Velvet Vendetta
## Planning session · November 20, 2026

Build a two-fighter arcade game for browser and offline desktop play. The labeled reference places Bob on the left and Cory on the right. The visual direction is a midnight opera house with spotlit couture, glossy black tailoring, antique gilt, and purple botanical magic. The working interpretation of “Legend of Claudia” is a request for richly detailed, layered fantasy battle art. Last Cloudia provides a possible point of reference. Visual parity is a matter of taste.

### Research decisions

- Warner Bros. describes fighter-specific abilities and Fatalities in Mortal Kombat 1. Give each fighter an original silhouette, signature attack, and separately staged finishing move. [WB Games](https://warnerbrosgames.com/index.php/article/mk1)
- Capcom’s Fighting Ground manual describes one-button specials and training. Give new players a simple special input and a practice mode. [Capcom manual](https://game.capcom.com/manual/SF6/en/ps5/page/6/1)
- AIDIS describes pixel characters moving through dimensional sets in Last Cloudia. Build illustrated characters, a layered stage, and real-time effects that preserve readable silhouettes. [AIDIS](https://www.aidis.co.jp/en/games/)

### Scope and acceptance goals

#### Art direction and identity
1. Title the original game Velvet Vendetta.
2. Establish an opera-house setting.
3. Use the supplied photo as the likeness reference.
4. Give Cory swept light hair and a clean-shaven face.
5. Dress Cory in flamboyant plum couture.
6. Add gold ornament and theatrical feathers to Cory.
7. Give Bob dark hair and a full beard.
8. Dress Bob in a tailored black agent suit.
9. Give Bob narrow dark glasses and a tie.
10. Commission original illustrated key art for the opening screen.

#### Interface and navigation
11. Make arcade play reachable from the opening screen.
12. Include an immediately visible way to learn the controls.
13. Offer a sound toggle on the opening screen.
14. Let players select Cory.
15. Let players select Bob.
16. Show the selected fighter’s name and fighting style.
17. Offer a way back from selection.
18. Show the two fighters’ names throughout a round.
19. Keep the match display usable on narrow screens.
20. Make menu actions keyboard accessible.

#### Movement and input
21. Implement walking left.
22. Implement walking right.
23. Implement jumping with a visible arc.
24. Implement crouching.
25. Implement a held guard.
26. Keep both fighters inside the arena.
27. Keep grounded fighters from overlapping indefinitely.
28. Turn fighters toward one another.
29. Implement touch movement and attack controls.
30. Clear held inputs when the window loses focus.

#### Combat
31. Give each fighter a quick strike.
32. Give each fighter a stronger kick.
33. Give Cory an orchid-colored special.
34. Give Bob a cold-colored special.
35. Require meter for special attacks.
36. Add meter through fighting.
37. Give strikes distinct startup timings.
38. Give strikes recovery timings.
39. Resolve attacks only when their range connects.
40. Count consecutive hits within a combo window.

#### Match structure
41. Run best-of-three arcade matches.
42. Announce the round number.
43. Show a visible round countdown clock.
44. End rounds on knockout.
45. Resolve clock expiry by remaining health.
46. Resolve a tied clock without an arbitrary winner.
47. Display round wins beside the health bars.
48. Restore fighter positions for a new round.
49. Award the match after a fighter wins two rounds.
50. Include a rematch action.

#### Opponent and practice
51. Have the CPU approach from outside striking range.
52. Give the CPU multiple attacks.
53. Let the CPU guard.
54. Allow breathing room between CPU decisions.
55. Give the CPU access to its signature move.
56. Include a practice mode.
57. Give practice an opponent that stays available for drills.
58. Let the player reset a practice session.
59. Let the player pause mid-round.
60. Let the player return to the title from pause.

#### Visual feedback
61. Draw a separate health bar for each fighter.
62. Animate recent damage on the health display.
63. Display each fighter’s special meter.
64. Show when a special is ready.
65. Animate an idle stance.
66. Show separate strike and kick poses.
67. Show the guard stance.
68. Display hit sparks at contact.
69. Distinguish blocked hits visually.
70. Give large impacts a brief hit stop.

#### Eggplant fatalities
71. Give the winning fighter a finisher window.
72. Teach the finisher input on screen.
73. Let players finish with one button.
74. Give Cory the finisher Aubergine Ovation.
75. Stage Cory’s finisher as a theatrical botanical disappearance.
76. Give Bob the finisher Protocol Violet.
77. Stage Bob’s finisher as an eggplant-powered digital deletion.
78. Give each finisher a dedicated illustrated reveal.
79. Clearly name the winning fighter on the results screen.
80. Allow an ordinary victory when the finisher window expires.

#### Audio
81. Include an original menu score.
82. Include an original combat score.
83. Loop music during longer sessions.
84. Include audible round calls.
85. Include a voiced fight cue.
86. Give Cory an original voiced line.
87. Give Bob an original voiced line.
88. Distinguish light and heavy hit sounds.
89. Add a distinct block sound.
90. Give each eggplant finisher its own sound cue.

#### Delivery and checks
91. Include keyboard controls in the download.
92. Include start instructions in the download.
93. Keep the offline edition playable without remote assets.
94. Ship the plan with the game.
95. Keep the downloadable game between 100 and 500 decimal MB.
96. Use playable media for the download’s size budget.
97. Verify all local asset references resolve.
98. Exercise round, match, and finisher transitions.
99. Check the desktop and phone layouts.
100. Verify the final archive opens and report its measured size.
