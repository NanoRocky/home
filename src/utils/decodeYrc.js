/**
 * Decode yrc text
 * @param {string} i - yrc input
 * @returns {[number,number,[[number,number],string,number,number][]]}
 */
export function decodeYrc(i) {
  let x = 0;
  return i
    .trim()
    .split("\n")
    .filter((it) => it != "[ch:0]")
    .map((i) => {
      const line = i.split(/\[([0-9]+),([0-9]+)\](.+)/).slice(1, -1);
      const start = parseInt(line[0]);
      const dur = parseInt(line[1]);
      let frame = [];
      let stack = [];
      let y = 0;
      if (line[2] == undefined) {
        return;
      }
      line[2]
        .split(/(\([0-9]+,[0-9]+,[0-9]+\))/)
        .slice(1)
        .forEach((it) => {
          if (frame.length == 0) {
            const ir = it.split(/\(([0-9]+),([0-9]+),[0-9]+\)/).slice(1, -1);
            frame.push([parseInt(ir[0]), parseInt(ir[1])]);
            return;
          }
          frame.push(it.replace(' ',"&nbsp;"));
          frame.push(x);
          frame.push(y);
          y += 1;
          stack.push(frame);
          frame = [];
        });
      x += 1;
      return [start, dur, stack];
    });
}
