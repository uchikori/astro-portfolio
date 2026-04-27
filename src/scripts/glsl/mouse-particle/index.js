import { Ob } from "../Ob.js";
import Vertex, { getHoleScale } from "./vertex.js";
import Fragment from "./fragment.js";

import { utils } from "../../helper/index.js";
import mouse from "../../component/mouse";
import {
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  PlaneGeometry,
} from "three/webgpu";
import { attribute, add, mul, positionLocal, uniform, vec2 } from "three/tsl";

export default class extends Ob {
  intensityVertices;
  isMeshActive = false;

  setupGeometry() {
    const width = Math.floor(this.rect.width);
    const height = Math.floor(this.rect.height);
    const wSeg = width / 4;
    const hSeg = height / 4;

    const plane = new PlaneGeometry(width, height, wSeg, hSeg);

    this.intensityVertices = utils.getDiagonalVertices(
      hSeg,
      wSeg,
      () => random(0, 1500),
      0,
    );

    function random(a, b) {
      return a + (b - a) * Math.random();
    }

    plane.setAttribute(
      "aIntensity",
      new Float32BufferAttribute(this.intensityVertices, 1),
    );

    return plane;
  }

  setupVertexCount() {
    return this.geometry.attributes.position.count;
  }

  setupMesh() {
    const instanceGeometry = new PlaneGeometry(1, 1, 2, 2);

    if (this._instancedMesh) return this._instancedMesh;

    this._instancedMesh = new InstancedMesh(
      instanceGeometry,
      this.material,
      this.setupVertexCount(),
    );

    return this._instancedMesh;
  }

  setupOptions() {
    const options = super.setupOptions();
    const instancedMesh = this.setupMesh();
    const vertexCount = this.setupVertexCount();

    const planePositionArray = this.geometry.attributes.position.array;
    const uvArray = this.geometry.attributes.uv.array;
    const instancePlanePositions = new Float32Array(vertexCount * 3);
    const instanceDelays = new Float32Array(vertexCount);
    const instanceUVs = new Float32Array(vertexCount * 2);

    for (let i = 0; i < vertexCount; i++) {
      instancePlanePositions[i * 3] = planePositionArray[i * 3];
      instancePlanePositions[i * 3 + 1] = planePositionArray[i * 3 + 1];
      instancePlanePositions[i * 3 + 2] = planePositionArray[i * 3 + 2];

      instanceDelays[i] = this.intensityVertices[i];

      instanceUVs[i * 2] = uvArray[i * 2];
      instanceUVs[i * 2 + 1] = uvArray[i * 2 + 1];
    }

    instancedMesh.geometry.setAttribute(
      "instancePlanePosition",
      new InstancedBufferAttribute(instancePlanePositions, 3),
    );
    instancedMesh.geometry.setAttribute(
      "instanceDelay",
      new InstancedBufferAttribute(instanceDelays, 1),
    );
    instancedMesh.geometry.setAttribute(
      "instanceUV",
      new InstancedBufferAttribute(instanceUVs, 2),
    );

    options.aInstancePlanePosition = attribute("instancePlanePosition", "vec3");
    options.aInstanceDelay = attribute("instanceDelay", "float");
    options.aInstanceUV = attribute("instanceUV", "vec2");

    return options;
  }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    const size = this.rect.width / 300;

    uniforms.uPointSize = uniform(size * 1.15);
    uniforms.uPlaneSize = uniform(vec2(this.rect.width, this.rect.height));
    uniforms.uRadius = uniform(0.16);
    uniforms.uHoleRadius = uniform(56.0);
    uniforms.uFeather = uniform(5.5);
    uniforms.uStrength = uniform(Math.max(this.rect.width * 0.16, 48));
    uniforms.uRelax = uniform(0.2);

    return uniforms;
  }

  setupVertex(options) {
    const transformedInstancePos = Vertex(options);
    const holeScale = getHoleScale(options);
    const scaledLocalPos = mul(
      positionLocal,
      this.uniforms.uPointSize,
      holeScale,
    ).toVar();

    return add(transformedInstancePos, scaledLocalPos);
  }

  setupFragment(options) {
    return Fragment(options);
  }

  syncDisplayState(isHover) {
    const hoverVal = this.uniforms.uHover.value;

    this.mesh.visible = true;
    this.DOM.el.style.opacity = isHover ? 0 : 1.0 - hoverVal;
  }

  render(tick) {
    super.render(tick);

    const rect = this.DOM.el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const pointerX = (mouse.current.x - rect.left) / rect.width;
    const pointerY = (mouse.current.y - rect.top) / rect.height;
    const isHover =
      pointerX >= 0 && pointerX <= 1 && pointerY >= 0 && pointerY <= 1;

    if (isHover) {
      this.uniforms.uMouse.value.x = Math.min(Math.max(pointerX, 0), 1);
      this.uniforms.uMouse.value.y = 1 - Math.min(Math.max(pointerY, 0), 1);
    }

    // This effect is a shader-positioned InstancedMesh, so CPU raycasting in
    // world.js cannot reliably detect hover on the visual particle plane.
    this.uniforms.uHover.__endValue = isHover ? 1.0 : 0.0;
    this.uniforms.uHover.value = utils.lerp(
      this.uniforms.uHover.value,
      this.uniforms.uHover.__endValue,
      this.uniforms.uRelax.value,
    );

    if (
      Math.abs(this.uniforms.uHover.value - this.uniforms.uHover.__endValue) <
      0.001
    ) {
      this.uniforms.uHover.value = this.uniforms.uHover.__endValue;
    }

    this.syncDisplayState(isHover);
  }

  afterInit() {
    this.DOM.el.style.opacity = 1;
    this.mesh.visible = false;
    this.isMeshActive = false;
  }

  resize() {
    super.resize();

    const size = this.rect.width / 300;
    this.uniforms.uPointSize.value = size * 1.15;
    this.uniforms.uPlaneSize.value.x = this.rect.width;
    this.uniforms.uPlaneSize.value.y = this.rect.height;
    this.uniforms.uStrength.value = Math.max(this.rect.width * 0.16, 48);

    const attr = this.mesh.geometry.attributes.instancePlanePosition;
    const planePositionArray = this.geometry.attributes.position.array;

    for (let i = 0; i < attr.count; i++) {
      attr.array[i * 3] = planePositionArray[i * 3];
      attr.array[i * 3 + 1] = planePositionArray[i * 3 + 1];
      attr.array[i * 3 + 2] = planePositionArray[i * 3 + 2];
    }

    attr.needsUpdate = true;
  }

  debug(folder) {
    folder.add(this.uniforms.uRadius, "value", 0.06, 0.3, 0.005).name("radius");
    folder.add(this.uniforms.uHoleRadius, "value", 8, 60, 1).name("holeRadius");
    folder.add(this.uniforms.uFeather, "value", 1.5, 10, 0.1).name("feather");
    folder
      .add(
        this.uniforms.uStrength,
        "value",
        12,
        Math.max(this.rect.width * 0.35, 120),
        1,
      )
      .name("strength");
    folder.add(this.uniforms.uPointSize, "value", 1, 8, 0.1).name("pointSize");
    folder.add(this.uniforms.uRelax, "value", 0.05, 0.3, 0.01).name("relax");
  }
}
