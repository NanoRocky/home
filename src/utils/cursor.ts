import { isEqual } from "lodash-es";

let mainCursor: Cursor | null = null;

const lerp = (a: number, b: number, n: number) => {
  if (Math.round(a) === b) {
    return b;
  }
  return (1 - n) * a + n * b;
};

const getStyle = (el: HTMLElement, attr: string) => {
  try {
    return window.getComputedStyle ? window.getComputedStyle(el)[attr as any] : (el as any).currentStyle[attr];
  } catch (e) {
    console.error(e);
  }
  return false;
};

const cursorInit = () => {
  mainCursor = new Cursor();
  return mainCursor;
};

class Cursor {
  pos: {
    curr: { x: number; y: number } | null;
    prev: { x: number; y: number } | null;
  };
  pt: string[];
  cursor: HTMLDivElement | null = null;
  scr: HTMLStyleElement | null = null;

  constructor() {
    this.pos = {
      curr: null,
      prev: null,
    };
    this.pt = [];
    this.create();
    this.init();
    this.render();
  }

  move(left: number, top: number) {
    if (!this.cursor) return;
    this.cursor.style["left"] = `${left}px`;
    this.cursor.style["top"] = `${top}px`;
  }

  create() {
    if (!this.cursor) {
      this.cursor = document.createElement("div");
      this.cursor.id = "cursor";
      this.cursor.classList.add("is-xs-hidden");
      this.cursor.classList.add("hidden");
      document.body.append(this.cursor);
    }

    const el = document.getElementsByTagName("*");
    for (let i = 0; i < el.length; i++) {
      if (getStyle(el[i] as HTMLElement, "cursor") === "pointer") {
        this.pt.push(el[i].outerHTML);
      };
    };
    this.scr = document.createElement("style");
    document.body.appendChild(this.scr);
    this.scr.innerHTML = `* {cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='10px' height='10px'><circle cx='4' cy='4' r='4' fill='white' /></svg>") 4 4, auto !important}`;
  }
  refresh() {
    if (this.scr) {
      this.scr.remove();
    }
    if (this.cursor) {
      this.cursor.classList.remove("active");
    }
    this.pos = {
      curr: null,
      prev: null,
    };
    this.pt = [];

    this.create();
    this.init();
    this.render();
  }

  init() {
    document.onmousemove = (e) => {
      this.pos.curr == null && this.move(e.clientX - 8, e.clientY - 8);
      this.pos.curr = {
        x: e.clientX - 8,
        y: e.clientY - 8,
      };
      if (this.cursor) {
        this.cursor.classList.remove("is-xs-hidden");
        this.cursor.classList.remove("hidden");
      }
      this.render();
    };
    document.onmouseenter = () => {
      if (this.cursor) this.cursor.classList.remove("is-xs-hidden");
      if (this.cursor) this.cursor.classList.remove("hidden");
    };
    document.onmouseleave = () => {
      if (this.cursor) this.cursor.classList.add("is-xs-hidden");
      if (this.cursor) this.cursor.classList.add("hidden");
    };
    document.onmousedown = () => {
      if (this.cursor) this.cursor.classList.add("active");
    };
    document.onmouseup = () => {
      if (this.cursor) this.cursor.classList.remove("active");
    };
  }

  render() {
    if (this.pos.prev && this.pos.curr) {
      this.pos.prev.x = lerp(this.pos.prev.x, this.pos.curr.x, 0.35);
      this.pos.prev.y = lerp(this.pos.prev.y, this.pos.curr.y, 0.35);
      this.move(this.pos.prev.x, this.pos.prev.y);
    } else if (this.pos.curr) {
      this.pos.prev = this.pos.curr;
    }
    if (this.pos.prev && this.pos.curr && !isEqual(this.pos.curr, this.pos.prev)) {
      requestAnimationFrame(() => this.render());
    }
  }
}

export default cursorInit;
