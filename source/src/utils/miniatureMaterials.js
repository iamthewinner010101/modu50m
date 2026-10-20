import * as THREE from 'three';

// World-space detail keeps paving/stone joints at a consistent scale on all
// georeferenced meshes. The grain is decorative, not photographic evidence.
export function miniatureMaterial(color,type='plain') {
  const m=new THREE.MeshStandardMaterial({color,roughness:type==='metal'?.36:type==='glass'?.24:.88,metalness:type==='metal'?.48:type==='glass'?.28:0,side:THREE.DoubleSide});
  if(type==='plain'||type==='glass'||type==='metal')return m;
  m.customProgramCacheKey=()=>`miniature-${type}`;
  m.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vMiniWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 miniPosition=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nminiPosition=instanceMatrix*miniPosition;\n#endif\nvMiniWorld=(modelMatrix*miniPosition).xyz;');
    shader.fragmentShader=`varying vec3 vMiniWorld;
      float miniHash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
      float miniSeam(float coordinate,float period,float width){float v=abs(fract(coordinate/period+.5)-.5)*period;return 1.0-smoothstep(width,width+fwidth(coordinate)*.8,v);}
      `+shader.fragmentShader;
    const expressions={
      stone:'float joints=max(miniSeam(vMiniWorld.y,1.15,.012),max(miniSeam(vMiniWorld.x+(floor(vMiniWorld.y/1.15)*.575),2.3,.009),miniSeam(vMiniWorld.z,2.3,.009))*.36);diffuseColor.rgb*=1.0-.15*joints+.055*(grain-.5);',
      paving:'float joints=max(miniSeam(vMiniWorld.x,.85,.014),miniSeam(vMiniWorld.z,.85,.014));diffuseColor.rgb*=1.0-.13*joints+.08*(grain-.5);',
      asphalt:'diffuseColor.rgb*=.93+.16*grain;',
      grass:'float clump=miniHash(floor(vMiniWorld*.35));diffuseColor.rgb*=.82+.2*grain+.17*clump;',
      base:'diffuseColor.rgb*=.96+.055*sin(vMiniWorld.x*.16+sin(vMiniWorld.z*.31)+vMiniWorld.y*.85)+.04*(grain-.5);',
    };
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat grain=miniHash(floor(vMiniWorld*23.0));\n${expressions[type]||''}`);
  };
  return m;
}
