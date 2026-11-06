import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three';

export interface XrayUniforms {
  readonly uColor: { value: Color };
  readonly uOpacity: { value: number };
}

/**
 * Le matériau « rayons X » : une face presque transparente quand on la regarde en face, qui
 * s'illumine quand elle fuit le regard (le bord des volumes). Additif et sans profondeur, comme une
 * radio : tout se voit à travers tout, y compris ce qu'une enveloppe cache.
 */
export function xrayMaterial(): { readonly material: ShaderMaterial; readonly uniforms: XrayUniforms } {
  const uniforms: XrayUniforms = { uColor: { value: new Color() }, uOpacity: { value: 1 } };
  const material = new ShaderMaterial({
    uniforms: { ...uniforms },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
        float alpha = clamp(uOpacity * (0.05 + 0.95 * pow(rim, 2.4)), 0.0, 1.0);
        gl_FragColor = vec4(uColor, alpha);
        #include <colorspace_fragment>
        gl_FragColor.rgb *= gl_FragColor.a;
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    premultipliedAlpha: true,
    side: DoubleSide,
  });
  return { material, uniforms };
}
