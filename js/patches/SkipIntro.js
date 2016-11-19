PP64.ns("patches");

PP64.patches.addPatch({
  id: "INTROSKIP",
  name: "Skip Intro",
  desc: "Booting the game leads right to the village",

  supports: [
    $gameType.MP1_USA
  ],

  apply: function(romView, game) {
    romView.setUint16(0x2BAF82, 0x0069);
  }
});