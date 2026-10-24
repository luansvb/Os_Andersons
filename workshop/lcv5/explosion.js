import * as THREE from 'three';

const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment=`
 varying vec2 vUv;uniform float time,alpha,seed,smoke;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float value=0.,a=.5;for(int i=0;i<5;i++){value+=a*noise(p);p=mat2(1.6,-1.2,1.2,1.6)*p+7.3;a*=.5;}return value;}
 void main(){
  vec2 p=(vUv-.5)*2.;float n=fbm(p*3.2+vec2(seed,-time*(smoke>.5?.25:1.2)));
  float radius=length(p*vec2(1.,.86));float edge=1.-smoothstep(.35,.99,radius+(n-.48)*.55);
  float heat=clamp((1.-radius)*1.15+n*.55-time*.08,0.,1.);
  vec3 fire=mix(vec3(.35,.015,.002),vec3(1.,.16,.005),smoothstep(.15,.45,heat));
  fire=mix(fire,vec3(1.8,.8,.08),smoothstep(.45,.8,heat));fire=mix(fire,vec3(2.5,1.9,.9),smoothstep(.8,1.,heat));
  vec3 cloud=mix(vec3(.07,.065,.065),vec3(.31,.29,.27),n)*(1.-radius*.3);
  float opacity=edge*alpha*(smoke>.5?.45+n*.55:.7+n*.3);
  if(opacity<.008)discard;gl_FragColor=vec4(mix(fire,cloud,smoke),opacity);
 }
`;

export function createExplosion(scene,{reduced=false}={}){
 const group=new THREE.Group();group.visible=false;scene.add(group);let time=-1;
 const origin=new THREE.Vector3(3.6,1.35,-1.2),geometry=new THREE.PlaneGeometry(1,1),clouds=[];
 for(let i=0;i<36;i++){
  const smoke=i>=14,angle=i*2.399;
  const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{time:{value:0},alpha:{value:0},seed:{value:i*9.17},smoke:{value:smoke?1:0}},transparent:true,depthWrite:false,blending:smoke?THREE.NormalBlending:THREE.AdditiveBlending,toneMapped:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=smoke?3:2;group.add(mesh);clouds.push({mesh,smoke,angle,delay:smoke?(i-14)*.045:0,index:i});
 }
 const count=180,positions=new Float32Array(count*3),velocities=[];
 for(let i=0;i<count;i++){const a=i*2.399,s=2+i%9;velocities.push(new THREE.Vector3(Math.cos(a)*s,2+i%7,Math.sin(a)*s));}
 const pointsGeometry=new THREE.BufferGeometry();pointsGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const embers=new THREE.Points(pointsGeometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,uniforms:{alpha:{value:0}},vertexShader:'void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(85./-p.z,1.,10.);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform float alpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(1.6,.42,.04,(1.-d)*alpha);}'}));group.add(embers);embers.frustumCulled=false;
 const flash=new THREE.PointLight('#ffac57',0,20);flash.position.copy(origin);scene.add(flash);
 const shock=new THREE.Mesh(new THREE.RingGeometry(.92,1,80),new THREE.MeshBasicMaterial({color:'#ffd297',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));shock.rotation.x=-Math.PI/2;shock.position.set(3.6,.07,-1.2);group.add(shock);
 return {
  start(){time=0;group.visible=!reduced;},
  reset(){time=-1;group.visible=false;flash.intensity=0;},
  update(dt,camera){
   if(time<0||reduced)return;time+=Math.min(dt,.08);const t=time;
   flash.intensity=Math.max(0,1-t/.7)*65;
   shock.scale.setScalar(1+t*7);shock.material.opacity=Math.max(0,.55-t*.8);
   for(const p of clouds){
    const age=t-p.delay,smoke=p.smoke,life=smoke?7:1.85;
    const fade=age<0?0:Math.min(1,age/(smoke?.65:.06))*Math.max(0,1-age/life);
    p.mesh.visible=fade>0;p.mesh.material.uniforms.alpha.value=fade*(smoke?.65:1);p.mesh.material.uniforms.time.value=t;
    p.mesh.position.copy(origin).add(new THREE.Vector3(Math.cos(p.angle)*age*(smoke?.32:.95),age*(smoke?1.05:1.45)+(p.index%4)*.08,Math.sin(p.angle)*age*(smoke?.32:.8)));
    const scale=smoke?1.4+Math.max(0,age)*.85:.9+Math.min(1,Math.max(0,age)*4)*(1.4+p.index%4*.3);
    p.mesh.scale.set(scale,scale*(smoke?1.05:1.15),1);if(camera)p.mesh.quaternion.copy(camera.quaternion);
   }
   for(let i=0;i<count;i++){const v=velocities[i],x=origin.x+v.x*t,y=Math.max(.1,origin.y+v.y*t-3.5*t*t),z=origin.z+v.z*t;positions.set([x,y,z],i*3);}
   pointsGeometry.attributes.position.needsUpdate=true;embers.material.uniforms.alpha.value=Math.max(0,1-t/3.2);
   if(t>8)group.visible=false;
  },
  get shake(){return reduced||time<0?0:Math.max(0,1-time/.85)*.12;},
  get active(){return time>=0&&time<8&&!reduced;}
 };
}

