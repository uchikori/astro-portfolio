import { INode } from "#/helper/INode";

const highlight = {
  enter: (mouse, event) => {
    const currentTarget = event.currentTarget;
    const scale = INode.getDS(currentTarget, "mouseScale") || 1;

    mouse.DOM.innerCircle.style.visibility = "hidden";

    mouse.setTarget({
      scale: Number(scale),
      fillOpacity: 1,
    });
  },
  leave: (mouse, event) => {
    mouse.DOM.innerCircle.style.visibility = "visible";

    mouse.setTarget({
      scale: mouse.initial.scale,
      fillOpacity: mouse.initial.fillOpacity,
    });
  },
};

const stuck = {
  enter: (mouse, event) => {
    const currentTarget = event.currentTarget;
    mouse.stopTrackMousePos();
    const scale = INode.getDS(currentTarget, "mouseScale") || 1;
    const rect = INode.getRect(currentTarget);
    const cursorShape = INode.getDS(currentTarget, "mouseShape");

    mouse.DOM.innerCircle.style.visibility = "hidden";

    if (cursorShape === "element") {
      const elementScale = Number(scale);
      const radius = Number.parseFloat(
        window.getComputedStyle(currentTarget).borderTopLeftRadius,
      );

      mouse.setTarget({
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        width: rect.width * elementScale,
        height: rect.height * elementScale,
        radius: Math.min(
          Number.isFinite(radius) ? radius * elementScale : 0,
          (rect.width * elementScale) / 2,
          (rect.height * elementScale) / 2,
        ),
        cursorShape: "element",
        fillOpacity: 1,
      });
      return;
    }

    mouse.setTarget({
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      cursorShape: "circle",
      scale: (rect.width / 2 / mouse.initial.r) * scale,
      fillOpacity: 1,
    });
  },
  leave: (mouse, event) => {
    mouse.DOM.innerCircle.style.visibility = "visible";

    mouse.setTarget({
      width: mouse.initial.width,
      height: mouse.initial.height,
      radius: mouse.initial.radius,
      cursorShape: mouse.initial.cursorShape,
      scale: mouse.initial.scale,
      fillOpacity: mouse.initial.fillOpacity,
    });
    mouse.startTrackMousePos();
  },
};

const handlers = {
  highlight,
  stuck,
};

export { handlers };
