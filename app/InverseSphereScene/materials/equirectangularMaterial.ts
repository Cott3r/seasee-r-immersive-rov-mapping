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

export function createEquirectangularMaterial() {
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
      uniform float fullWidth;
      uniform float fullHeight;
      uniform float cropWidth;
      uniform float cropHeight;
      uniform float cropLeft;
      uniform float cropTop;
      
      varying vec2 vUv;

      void main() {
        // Calculate the normalized position in the full sphere
        float fullU = vUv.x;
        // GPano CroppedAreaTopPixels is measured from the top edge.
        // Shader UV space grows upward, so invert Y when mapping to full panorama pixels.
        float fullV = 1.0 - vUv.y;

        // Convert to pixel coordinates in the full panorama
        float fullPixelX = clamp(fullU * fullWidth, 0.0, fullWidth);
        float fullPixelY = clamp(fullV * fullHeight, 0.0, fullHeight);
        
        // Check if this pixel falls within the cropped area
        if (fullPixelX < cropLeft || fullPixelX > (cropLeft + cropWidth) ||
            fullPixelY < cropTop || fullPixelY > (cropTop + cropHeight)) {
          discard;
        }
        
        // Map to texture coordinates within the cropped image
        float textureU = 1.0 - (fullPixelX - cropLeft) / cropWidth;
        float textureV = 1.0 - ((fullPixelY - cropTop) / cropHeight);
        
        gl_FragColor = texture2D(map, vec2(textureU, textureV));
      }
    `,
    wireframe: false
  });
}
