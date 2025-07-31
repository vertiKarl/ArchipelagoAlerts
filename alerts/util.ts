export function stringToHue(str: string) {
  if (typeof str !== "string") return;
  let num = 0;
  let i = 0;
  for (const char of str.split("")) {
    const c = char.charCodeAt(0);
    const weight = 1 - i / 12;
    num += c * weight;
    i++;
  }

  return num;
}

export function pickRandom(arr: any[]) {
  if (arr.length <= 0) return null;
  const rng = Math.random() * arr.length;
  return arr[Math.floor(rng)];
}
