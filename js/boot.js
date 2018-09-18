"use strict";
// I AM THE SUPERSTAR
var $$debug = false; // see settings.jsx for real value
var PP64;
(function (PP64) {
    /** Namespace creation helper. */
    function ns(namespace) {
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
    }
    PP64.ns = ns;
})(PP64 || (PP64 = {}));
// Something broke? This resets user data.
function BowserRevolution() {
    if (window.localStorage)
        window.localStorage.clear();
    // Could do cookies too, but cookies are a PITA
}
