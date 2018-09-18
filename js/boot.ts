// I AM THE SUPERSTAR

var $$debug = false; // see settings.jsx for real value

namespace PP64 {
  /** Namespace creation helper. */
  export function ns(namespace: string) {
    let nameParts = namespace.split(".");
    if (!nameParts.length)
      return;

    if (nameParts[0] === "PP64")
      nameParts.splice(0, 1);

    if (!nameParts.length)
      return;

    let curPartIndex = 0;
    let curObj: any = PP64;
    while (curPartIndex < nameParts.length) {
      curObj[nameParts[curPartIndex]] = curObj[nameParts[curPartIndex]] || Object.create(null);
      curObj = curObj[nameParts[curPartIndex]];
      curPartIndex++;
    }
  }
}

// Something broke? This resets user data.
function BowserRevolution() {
  if (window.localStorage)
    window.localStorage.clear();

  // Could do cookies too, but cookies are a PITA
}