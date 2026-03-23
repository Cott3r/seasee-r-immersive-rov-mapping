import * as THREE from "three";

function createUniforms() {
  return {
    map: { value: null },
    fullWidth: { value: 1 },
    fullHeight: { value: 1 },
    cropWidth: { value: 1 },
    cropHeight: { value: 1 },
    cropLeft: { value: 0 },
    cropTop: { value: 0 },
  };
}

export function createPerspectiveMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: createUniforms(),
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      varying vec2 vUv;

      void main() {
        float lower = 0.0;
        float upper = 1.0;

        if (vUv.y < lower || vUv.y > upper) {
          discard;
        }

        float stretchedV = (vUv.y - lower) / (upper - lower);
        vec2 sampledUv = vec2(vUv.x, stretchedV);

        gl_FragColor = texture2D(map, sampledUv);
      }
    `,
  });
}

export function createEquirectangularMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: createUniforms(),
    vertexShader: `varying vec3 vWorldDirection;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldDirection = worldPosition.xyz - cameraPosition;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
    `,
    fragmentShader: `uniform sampler2D map;

uniform float cropWidth;
uniform float cropHeight;

varying vec3 vWorldDirection;

void main() {
  vec3 dir = normalize(vWorldDirection);

  // Perspective projection directly from direction
  float z = -dir.z;
  if (z <= 0.0) discard;

  float x = dir.x / z;
  float y = dir.y / z;

  float fov = radians(75.0);
  float aspect = cropWidth / cropHeight;

  float u = 0.5 + x / (2.0 * tan(fov * 0.5) * aspect);
  float v = 0.5 + y / (2.0 * tan(fov * 0.5));

  if (u < 0.0 || u > 1.0 || v < 0.0 || v > 1.0) {
    discard;
  }

  gl_FragColor = texture2D(map, vec2(u, v));
}
    `,
  });
}
