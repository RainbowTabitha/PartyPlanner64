PP64.ns("patches.gameshark.hook");

PP64.patches.gameshark.hook.apply = function(romBuffer) {
  const cheatCount = PP64.patches.gameshark.currentCheats.length;
  if (!cheatCount) {
    // This would leave existing cheats if they were already present; doesn't clear them.
    return;
  }

  let gameID = PP64.romhandler.getROMGame();
  switch(gameID) {
    case $gameType.MP1_USA:
      PP64.patches.gameshark.hook.MP1U.apply(romBuffer);
      break;
    case $gameType.MP1_JPN:
    case $gameType.MP2_USA:
    case $gameType.MP3_USA:
    default:
      console.warn("Cannot write cheats for this game");
      return;
  }

  $$log(`Applied ${cheatCount} Gameshark cheats`);
}

PP64.patches.gameshark.romSupportsCheats = function() {
  let gameID = PP64.romhandler.getROMGame();
  switch(gameID) {
    case $gameType.MP1_USA:
      return true;
    case $gameType.MP1_JPN:
    case $gameType.MP2_USA:
    case $gameType.MP3_USA:
    default:
      return false;
  }
}
