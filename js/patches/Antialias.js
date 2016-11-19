PP64.ns("patches");

PP64.patches.addPatch({
  id: "ANTIALIAS",
  name: "Remove antialiasing",
  desc: "Removes some blurring seen on N64 hardware",

  supports: [
    $gameType.MP1_USA
  ],

  apply: function(romView, game) {
    romView.setUint8(0x9306B, 0);
    romView.setUint8(0x9306D, 0);
    romView.setUint8(0x93094, 0);
    romView.setUint8(0x93095, 0);
    romView.setUint8(0x93097, 0);
  }
});