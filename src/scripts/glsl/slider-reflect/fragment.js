import {
  add,
  div,
  floor,
  Fn,
  fract,
  mix,
  mod,
  mul,
  step,
  sub,
  texture,
  uniform,
  uv,
  vec2,
  vec4,
} from "three/tsl";
import { utils } from "../../helper";

export default function Fragment(opt) {
  return Fn(() => {
    // 展開したのでトップレベルで受け取れる
    const { vUv, uniforms } = opt;

    function blockStep(f, x) {
      return Fn(() => {
        return sub(
          step(div(f, uniforms.uSlideTotal), x),
          step(div(add(f, 1.0), uniforms.uSlideTotal), x),
        );
      })();
    }

    //現在表示しているスライドのインデックス
    // 0~1の範囲に正規化
    //1枚目のインデックスが0.2
    //2枚目のインデックスが0.4
    //3枚目のインデックスが0.6
    //4枚目のインデックスが0.8
    //5枚目のインデックスが1.0
    const activeIdx = div(
      mod(uniforms.uActiveSlideIdx, uniforms.uSlideTotal),
      uniforms.uSlideTotal,
    );

    //スライドの枚数
    const slideNum = uniforms.uSlideTotal;
    //現在表示しているスライドのuvを計算
    const activeUv = add(vUv.x, activeIdx);
    //mul(vUv.x, slideNum)でuvをスライドの枚数分だけ引き伸ばす
    //fract()で0~1の範囲に正規化=>0~1を5回繰り返イメージ
    const fractUv = vec2(fract(mul(activeUv, slideNum)), vUv.y);

    const coverUv = utils.coverUv(fractUv, uniforms.uResolution);

    const tex1 = texture(uniforms.uTexes.tex1, coverUv); //0~0.2
    const tex2 = texture(uniforms.uTexes.tex2, coverUv); //0.2~0.4
    const tex3 = texture(uniforms.uTexes.tex3, coverUv); //0.4~0.6
    const tex4 = texture(uniforms.uTexes.tex4, coverUv); //0.6~0.8
    const tex5 = texture(uniforms.uTexes.tex5, coverUv); //0.8~1.0

    const bs1 = blockStep(0, fract(add(vUv.x, activeIdx)));
    const bs2 = blockStep(1, fract(add(vUv.x, activeIdx)));
    const bs3 = blockStep(2, fract(add(vUv.x, activeIdx)));
    const bs4 = blockStep(3, fract(add(vUv.x, activeIdx)));
    const bs5 = blockStep(4, fract(add(vUv.x, activeIdx)));

    // どちらか存在する方をサンプル
    // const color = mix(tex1, tex2, step(0.5, clipUv.x));
    const color = mul(tex1, bs1)
      .add(mul(tex2, bs2))
      .add(mul(tex3, bs3))
      .add(mul(tex4, bs4))
      .add(mul(tex5, bs5))
      .toVar();

    //カラーからグレースケールに変換
    const gray = utils.grayScale(color);

    // 中央のインデックス番号
    const center = floor(div(uniforms.uSlideTotal, 2.0));

    const bsActive = blockStep(center, vUv.x);

    color.assign(mix(gray, color, bsActive));

    color.a.assign(mul(color.a, mix(0.7, 1.0, bsActive)));

    color.a.assign(
      mul(color.a, mix(1.0, sub(1.0, vUv.y).mul(0.6), uniforms.uIsReflect)),
    );

    return color;
  })();
}
