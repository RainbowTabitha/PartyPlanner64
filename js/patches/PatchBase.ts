namespace PP64.patches {
  const __patches = Object.create(null);

  export interface IPatch {
    id: string;
    name: string;
    desc: string;
    supports: any[];
    apply: (...args: any[]) => any;
  }

  export const addPatch = function(patch: IPatch) {
    __patches[patch.id] = patch;
  };

  export const getPatches = function(game: any): IPatch[] {
    let patches = [];
    for (let id in __patches) {
      let patch = __patches[id];
      if (patch.supports.indexOf(game) >= 0)
        patches.push(patch);
    }
    return patches;
  };
}



// PP64.patches.PatchBase = {
//   id: "",
//   name: "",
//   desc: "",

//   supports: [],

//   apply: function(romView, game) {
//     throw `Patch does not implement apply`;
//   },
// };