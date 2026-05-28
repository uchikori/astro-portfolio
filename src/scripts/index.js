import "../styles/style.scss";
import { init } from "./bootstrap";

void init().catch((error) => {
  console.error(error);
});
