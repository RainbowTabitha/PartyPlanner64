// CodeMirror syntax highlighting for MIPS + PP64 enhancements.

// Derived originally from https://github.com/naphipps/brackets-mips-syntax-highlighter

(function () {
  if (!window.CodeMirror) {
    console.error("mips-pp64: CodeMirror global not found");
    return;
  }

  CodeMirror.defineMode("mips-pp64", function() {
    const directives = /\.(ascii|asciiz|align|byte|definelabel|fill|float|halfword|skip|word)\b/i;
    const regs = /\$?(a([0-3]|t)|f(p)|g(p)|k([0-1])|r(0|a)|s([0-8]|p)|t(\d)|v([0-1])|zero)\b/i;
    const opcodes = /\b(a(bs|ddiu|ddi|ddu|dd|ndi|nd)|b(czt|czf|eqz|eq|gezal|gez|geu|ge|gtu|gtz|gt|leu|lez|le|ltu|lt|nez|ltzal|ltz|ne|qez|)|c(lo|lz)|d(ivu|iv)|e(ret)|j(alr|al|r|)|l(a|bu|b|d|hu|h|i|ui|wcl|wl|wr|w)|m(addu|add|fc0|flo|fhi|ove|sub|ulou|ulo|ult|ul|tc0)|n(egu|eg|omove|op|or|ot)|o(ri|r)|r(emu|em|ol|or)|s(b|c|dcl|d|eq|geu|ge|gtu|gt|h|leu|le|ne|llv|ll|ltiu|lti|ltu|lt|rav|ra|rlv|rl|ubu|ub|wcl|wr|wl|w|yscall)|t(eqi|eq|geu|geiu|gei|ge|ltu|ltiu|lti|lt)|u(lhu|lh|lw|sc|sh|sw)|x(ori|or))\b/i;
    const numbers = /\b(0x[\da-f]+|o[0-7]+|b[0-1]+|\d+)\b/i;

    return {
      startState: function() {
        return { context: 0 };
      },

      token: function(stream, state) {
        if (stream.eatSpace()) {
          return null;
        }

        let thisItem;

        if (stream.eat(";") || stream.match("//")) {
          stream.skipToEnd();
          return "comment";
        }
        if (stream.eat('"')) {
          while (thisItem = stream.next()) {
            if (thisItem == '"') {
              break;
            }
          }
          return "string";
        }
        if (stream.eat(".")) {
          if (stream.eatWhile(/\w/)) {
            thisItem = stream.current();
            if (directives.test(thisItem)) {
              return "def";
            }
            return null;
          }
        }
        else if (stream.eatWhile(/[\$\w]/)) {
          thisItem = stream.current();

          if (regs.test(thisItem)) {
            return "atom";
          }
          if (numbers.test(thisItem)) {
            return "number";
          }
          if (opcodes.test(thisItem)) {
            let tokenType = "keyword";
            if (thisItem.toLowerCase() === "nop")
              tokenType += " nop";
            return tokenType;
          }
        }

        stream.next();
        return null;
      }
    };
  });
})();
