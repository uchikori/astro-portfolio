import { Fn, positionLocal } from "three/tsl";

export default function Vertex(options) {
  return Fn(() => {
    const position = positionLocal;
    return position;
  })();
}
