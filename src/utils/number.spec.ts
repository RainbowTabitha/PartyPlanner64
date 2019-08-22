import { distance, makeDivisibleBy } from "./number";

describe("distance", () => {
  it("does basic straight line distance", () => {
    expect(distance(1, 1, 1, 2)).toBe(1);
  });
});

describe("makeDivisibleBy", () => {
  it("returns same number if already divisible", () => {
    expect(makeDivisibleBy(4, 4)).toBe(4);
    expect(makeDivisibleBy(16, 4)).toBe(16);
  });

  it("returns 0 for 0 in the numerator", () => {
    expect(makeDivisibleBy(0, 4)).toBe(0);
  });

  it("increases number when not divisible", () => {
    expect(makeDivisibleBy(1, 4)).toBe(4);
    expect(makeDivisibleBy(2, 4)).toBe(4);
    expect(makeDivisibleBy(3, 4)).toBe(4);
    expect(makeDivisibleBy(13, 4)).toBe(16);
    expect(makeDivisibleBy(14, 4)).toBe(16);
    expect(makeDivisibleBy(15, 4)).toBe(16);
  });
});
