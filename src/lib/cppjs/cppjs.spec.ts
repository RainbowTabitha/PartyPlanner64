/** Some test cases to confirm cpp.js works as expected. */

import * as cpp from "./cppjs";

describe("cpp.js", () => {
  it("replaces basic macros", () => {
    const instance = cpp.create();

    const result = instance.run(`
#define PI 3.14159

int main () {
    cout << "Value of PI :" << PI << endl;
    return 0;
}
`);

    expect(result).toBe(`

int main () {
    cout << "Value of PI :" << 3.14159 << endl;
    return 0;
}
`);
  });

  it("replaces function macros", () => {
    const instance = cpp.create();

    const result = instance.run(`
#define MIN(a,b) (((a)<(b)) ? a : b)

int main () {
    int i, j;
    i = 100;
    j = 30;
    cout <<"The minimum is " << MIN(i, j) << endl;
    return 0;
}`);

    expect(result).toBe(`

int main () {
    int i, j;
    i = 100;
    j = 30;
    cout <<"The minimum is " << (((i)<(j)) ? i : j) << endl;
    return 0;
}`);
  });

  it("can do file includes", (done) => {
    const instance = cpp.create({
      include_func: (file, is_global, resumer) => {
        expect(file).toBe("test.h");
        expect(is_global).toBe(false);
        resumer("int test = 0;");
      },

      completion_func: (result) => {
        expect(result).toBe(`int test = 0;


int main () {
    return 0;
}`)
        done();
      }
    });

    instance.run(`
#include "test.h"

int main () {
    return 0;
}`);
  });
});
