PP64.ns("patches");

PP64.patches.addPatch({
  id: "NOGAME",
  name: "Happening spaces trigger NO GAME",
  desc: "Happening spaces will prevent Mini-Games for the current turn",

  supports: [
    $gameType.MP1_USA
  ],

  apply: function(romView, game) {
    romView.setUint8(0x4DB57, 3); // Instead of type 4, use 3 for NO GAME

    // Jump table is at 0x000CBC60
    // Code is at 0x0004DB40
  }
});