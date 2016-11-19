PP64.ns("patches");

PP64.patches.addPatch({
  id: "DEBUGMENU",
  name: "Debug Menu",
  desc: "Boot into the debug menu",

  supports: [
    $gameType.MP1_USA,
    $gameType.MP2_USA,
    $gameType.MP3_USA,
  ],

  apply: function(romView, game) {
    switch (game) {
      case $gameType.MP1_USA:
        romView.setUint16(0x002BAF82, 0x0083);
        break;
      case $gameType.MP2_USA:
        romView.setUint16(0x0001D316, 0x0000);
        break;
      case $gameType.MP3_USA:
        romView.setUint16(0x0046854E, 0x0000);
        break;
    }
  }
});