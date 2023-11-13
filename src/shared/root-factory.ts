import { RefObject, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { Root } from "react-dom/client";

import { Factory } from "@/lib/factory";

export class RootWrapper implements Root {
  private innerDOM: Root | null = null;

  constructor(private readonly rootElement: HTMLElement) {}

  render(children: ReactNode): void {
    this.innerDOM = ReactDOM.createRoot(this.rootElement);
    this.innerDOM.render(children);
  }
  unmount(): void {
    if (this.innerDOM) {
      this.innerDOM.unmount();
    }
    this.rootElement.remove();
  }
}

export class RootFactory<E extends HTMLElement> implements Factory<void, Root> {
  constructor(private readonly rootRef: RefObject<E>) {}

  Create(): Root {
    const { current: root } = this.rootRef;
    if (!root) {
      throw new Error("Root not found");
    }
    const tmpElement = document.createElement("div");
    root.appendChild(tmpElement);
    return new RootWrapper(tmpElement);
  }
}
