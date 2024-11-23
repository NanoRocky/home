/**
 * Decode yrc text
 * Made by Pizero
 * @param {string} i - yrc input
 * @returns {[number,number,[[number,number],string,number,number][]]}
 */
export function decodeYrc(i) {
  return i
    .trim()
    .split("\n")
    .filter((it) => it != "[ch:0]")
    .map((rawLine, lineIndex) => {
      const line = rawLine.split(/\[([0-9]+),([0-9]+)\](.+)/).slice(1, -1);
      const start = parseInt(line[0]);
      const dur = parseInt(line[1]);
      let frame = [];
      let stack = [];
      let y = 0;
      if (line[2] == undefined) {
        return;
      };
      if (line.every((it) => it == undefined)) {
        return;
      };
      line[2]
        .split(/(\([0-9]+,[0-9]+,[0-9]+\))/)
        .slice(1)
        .forEach((it, rowIndex) => {
          if (frame.length == 0) {
            const ir = it.split(/\(([0-9]+),([0-9]+),[0-9]+\)/).slice(1, -1);
            frame.push([parseInt(ir[0]), parseInt(ir[1])]);
            return;
          };
          frame.push(it.replace(' ',"&nbsp;"));
          frame.push(lineIndex);
          frame.push(rowIndex);
          stack.push(frame);
          frame = [];
        });
      return [start, dur, stack];
    })
    .filter((i) => i != undefined);
}
