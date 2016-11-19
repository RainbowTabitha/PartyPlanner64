PP64.ns("patches");

PP64.patches.__patches = Object.create(null);

PP64.patches.addPatch = function(patch) {
  PP64.patches.__patches[patch.id] = patch;
};

PP64.patches.getPatches = function(game) {
  let patches = [];
  for (let id in PP64.patches.__patches) {
    let patch = PP64.patches.__patches[id];
    if (patch.supports.indexOf(game) >= 0)
      patches.push(patch);
  }
  return patches;
};

// PP64.patches.PatchBase = {
//   id: "",
//   name: "",
//   desc: "",

//   supports: [],

//   apply: function(romView, game) {
//     throw `Patch does not implement apply`;
//   },
// };