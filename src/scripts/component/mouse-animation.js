import { INode } from "../helper";

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

    mouse.DOM.innerCircle.style.visibility = "hidden";

    mouse.setTarget({
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      scale: (rect.width / 2 / mouse.initial.r) * scale,
      fillOpacity: 1,
    });
  },
  leave: (mouse, event) => {
    mouse.DOM.innerCircle.style.visibility = "visible";

    mouse.setTarget({
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
