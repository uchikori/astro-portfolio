import {
  Group,
  Mesh,
  PlaneGeometry,
  Vector3,
  VideoTexture,
} from "three/webgpu";
import { Ob } from "../Ob";
import Fragment from "./fragment";
import Vertex from "./vertex";
import { utils } from "../../helper";
import { uniform } from "three/tsl";
import { DoubleSide } from "three";

export default class extends Ob {
  beforeCreateMesh() {
    //現在表示しているスライドのインデックス番号
    this.activeSlideIdx = 0;
  }

  setupGeometry() {
    const planeGeo = new PlaneGeometry(
      this.rect.width * this.texes.size,
      this.rect.height,
      // 円柱に添わせるために分割数を増やす
      1,
      1,
    );
    return planeGeo;
  }

  setupUniforms() {
    const uniforms = super.setupUniforms();
    uniforms.uSlideIdx = uniform(0);
    uniforms.uSlideTotal = uniform(this.texes.size);
    uniforms.uActiveSlideIdx = uniform(this.activeSlideIdx);
    uniforms.uIsReflect = uniform(0);
    return uniforms;
  }

  setupMesh() {
    const mesh = super.setupMesh();

    const reflect = mesh.clone();
    reflect.material = this.material.clone();

    reflect.material.alphaTest = 0;

    //reflectメッシュ専用のuniforms
    const reflectUniforms = {
      ...this.uniforms,
      uIsReflect: uniform(1),
      uTick: this.uniforms.uTick,
      uActiveSlideIdx: this.uniforms.uActiveSlideIdx,
    };

    //reflectメッシュのfragmentシェーダーをセット
    reflect.material.colorNode = this.setupFragment({
      vUv: this.vUv,
      uniforms: reflectUniforms,
    });

    reflect.position.y = -(this.rect.height + 8);
    reflect.scale.y = -1;

    const group = new Group();

    group.rotation.y = 0.4;
    group.add(mesh, reflect);

    return group;
  }

  setupVertex(options) {
    return Vertex(options);
  }
  setupFragment(options) {
    return Fragment(options);
  }

  goTo(idx) {
    this.activeSlideIdx = idx;

    this.playVideo(idx);
  }

  render(tick) {
    super.render(tick);

    //activeSlideIdxを線形補間で更新
    const uActiveSlideIdx = this.uniforms.uActiveSlideIdx.value;
    const idx = utils.lerp(uActiveSlideIdx, this.activeSlideIdx, 0.1);

    this.uniforms.uActiveSlideIdx.value = idx;
  }

  playVideo(idx) {
    const total = this.uniforms.uSlideTotal.value;
    const offset = 2;
    const i = ((idx + offset) % total) + 1;

    const texValue = this.uniforms.uTexes["tex" + i];

    // 全てのスライドを確認し、再生中の全ビデオを強制的に停止して暴走を防ぐ
    this.texes.forEach((s) => {
      const tex = s;
      if (tex instanceof VideoTexture) {
        tex.source.data.pause?.();
      }
    });

    // videoテクスチャの場合
    if (texValue instanceof VideoTexture) {
      //videoが再生されるまで待機
      this.interval = setInterval(() => {
        // アクティブなスライドのインデックス番号と自身のインデックス番号が一致した場合
        if (this.uniforms.uActiveSlideIdx.value === idx) {
          //videoを再生
          texValue.source.data.play?.();
          //インターバルをクリア
          clearInterval(this.interval);
          this.interval = null;
        }
      }, 100);
    }
  }

  afterInit() {
    // 初期状態で全てのvideoを停止
    // this.texes.forEach((tex) => {
    //   if (tex instanceof VideoTexture) {
    //     tex.source.data.pause?.();
    //   }
    // });

    // 初期状態でgoToメソッドを呼ぶことでplayVideoメソッドが実行され、最初のスライドが再生される
    this.goTo(this.activeSlideIdx);
  }

  debug(folder) {
    const sliderIdx = { value: 0 };
    folder
      .add(sliderIdx, "value", 0, this.texes.size - 1, 1)
      .name("sliderIdx")
      .listen()
      .onChange(() => {
        this.goTo(sliderIdx.value);
      });
    folder
      .add(this.mesh.rotation, "y", -Math.PI / 2, Math.PI / 2, 0.01)
      .name("RotationY")
      .listen();
  }
}
