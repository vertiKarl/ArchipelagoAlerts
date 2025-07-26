
export function stringToHue(str: string) {
    let num = 0;
    let i = 0;
    for(const char of str.split("")) {
      const c = char.charCodeAt(0);
      const weight = 1 - (i / 12);
      num += c * weight;
      i++;
    }

    return num;
}