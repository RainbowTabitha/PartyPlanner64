/**
 * Stores junk that the events want to keep around.
 * In particular, cached data from parsing the original game events.
 */
const _cache = Object.create(null);

export const EventCache = {
  get: function (key: string) {
    return _cache[key];
  },
  set: function (key: string, value: any) {
    _cache[key] = value;
  },
};
