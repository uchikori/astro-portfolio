import { Fn, positionLocal } from "three/tsl";

export default function Vertex(options) {
  return Fn(() => {
    return positionLocal;
  })();
}
