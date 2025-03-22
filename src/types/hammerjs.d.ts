declare module 'hammerjs' {
  export default class Hammer {
    constructor(element: HTMLElement);
    on(event: string, callback: () => void): void;
  }
}
