const highlight = {
  enter: (event) => {
    const el = event.currentTarget;
    const scale = INode.getDS(el, "mouseScale");

    target.scale = Number(scale);
    target.fillOpacity = 1;
  },
  leave: (event) => {
    const el = event.currentTarget;
    target.scale = mouse.initial.scale;
    target.fillOpacity = mouse.initial.fillOpacity;
  },
};

const handlers = {
  highlight,
};

export { handlers };
