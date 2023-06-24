export function copyObject(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

export function equals(obj1: any, obj2: any) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function isEmpty(obj: any) {
  for (const _ in obj) {
    return false;
  }
  return true;
}
