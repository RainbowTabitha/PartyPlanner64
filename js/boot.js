// I AM THE SUPERSTAR

var $$debug = false; // see settings.jsx for real value

window.PP64 = Object.create(null);

// Namespace creation helper.
PP64.ns = function(namespace) {
  let nameParts = namespace.split(".");
  if (!nameParts.length)
    return;

  if (nameParts[0] === "PP64")
    nameParts.splice(0, 1);

  if (!nameParts.length)
    return;

  let curPartIndex = 0;
  let curObj = PP64;
  while (curPartIndex < nameParts.length) {
    curObj[nameParts[curPartIndex]] = curObj[nameParts[curPartIndex]] || Object.create(null);
    curObj = curObj[nameParts[curPartIndex]];
    curPartIndex++;
  }
};

// Something broke? This resets user data.
function BowserRevolution() {
  if (window.localStorage)
    window.localStorage.clear();

  // Could do cookies too, but cookies are a PITA
}