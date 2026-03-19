import { PlaneGeometry, Float32BufferAttribute, Points } from "three";
import gsap from "gsap";

import { Ob } from "../Ob";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

import { utils } from "../../helper";

export default class extends Ob {
  setupGeometry() {
    const width = this.rect.width,
      height = this.rect.height,
      wSeg = width / 4,
      hSeg = height / 4;

    const plane = new PlaneGeometry(width, height, wSeg, hSeg);

    // 対角線上に詰められた遅延時間用の頂点データ
    const intensityVertices = utils.getDiagonalVertices(
      hSeg,
      wSeg,
      () => random(0, 1500),
      0
    );
    //  printMat(delayVertices, wSeg + 1, '遅延時間行列');

    function random(a, b) {
      return a + (b - a) * Math.random();
    }

    plane.setAttribute(
      "aIntensity",
      new Float32BufferAttribute(intensityVertices, 1)
    );

    return plane;
  }
  setupMesh() {
    return new Points(this.geometry, this.material);
  }
  setupVertex() {
    return vertexShader;
  }
  setupFragment() {
    return fragmentShader;
  }
  setupTexes(uniforms) {
    uniforms.texCurrent = { value: this.texes.get("tex1") };
    uniforms.texNext = { value: null };
    return uniforms;
  }

  running = false;
  goTo(idx, duration = 3) {
    const _idx = (idx % 5) + 1;

    if (this.running) return;
    this.running = true;

    const nextTex = this.texes.get("tex" + _idx);
    this.uniforms.texNext.value = nextTex;
    gsap.to(this.uniforms.uProgress, {
      value: 1,
      duration,
      ease: "none",
      onStart: () => {
        this.$.el.nextElementSibling?.remove();
        this.mesh.visible = true;
      },
      onComplete: () => {
        this.uniforms.texCurrent.value = this.uniforms.texNext.value;
        this.uniforms.uProgress.value = 0;
        const imgEl = this.texes.get("tex" + _idx).source.data;
        const parentElement = this.$.el.parentElement;
        parentElement.append(imgEl);
        this.mesh.visible = false;
        this.running = false;
      },
    });
  }
  afterInit() {
    this.goTo(0, 0);
  }
  debug(folder) {
    folder
      .add(this.uniforms.uProgress, "value", 0, 1, 0.1)
      .name("progress")
      .listen();
    const sliderIdx = { value: 0 };
    folder
      .add(sliderIdx, "value", 0, 12, 1)
      .name("goTo")
      .listen()
      .onChange(() => {
        this.goTo(sliderIdx.value);
      });
  }
}
