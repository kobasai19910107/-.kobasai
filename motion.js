// Time-based keyframes: preparation -> contact -> follow-through -> guard.
export const DURATIONS={punch:.27,upper:.32,spin:.36,hammer:.52,gun:.22,dodge:.22};
export const CONTACT={punch:.065,upper:.11,spin:.13,hammer:.22,gun:.06};
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const guard={hip:[0,-25],chest:[2,-47],head:[2,-68],leftHand:[-11,-45],rightHand:[17,-49],leftFoot:[-14,0],rightFoot:[17,0],turn:1,hammerAngle:-1.7};
const frames={
 jab:[{chest:[-6,-46],head:[-7,-67],rightHand:[1,-46]}, {hip:[5,-25],chest:[12,-47],head:[12,-68],rightHand:[46,-48],leftHand:[-5,-50],rightFoot:[22,0]}, {chest:[6,-46],rightHand:[30,-47]}],
 cross:[{hip:[-4,-24],chest:[-9,-46],head:[-8,-67],leftHand:[-19,-42],rightHand:[12,-53]}, {hip:[7,-25],chest:[14,-47],head:[15,-68],leftHand:[46,-45],rightHand:[10,-51],leftFoot:[-7,-3],rightFoot:[23,0]}, {chest:[9,-47],leftHand:[30,-46]}],
 kick:[{hip:[-3,-24],chest:[-7,-47],head:[-9,-69],rightFoot:[12,-21],rightHand:[13,-51]}, {hip:[2,-28],chest:[-9,-48],head:[-13,-69],rightFoot:[44,-34],leftFoot:[-11,0],rightHand:[9,-51]}, {hip:[1,-26],chest:[-7,-47],rightFoot:[22,-17]}],
 upper:[{hip:[-5,-19],chest:[-7,-37],head:[-6,-57],rightHand:[4,-25],leftHand:[-9,-45]}, {hip:[4,-30],chest:[10,-53],head:[9,-75],rightHand:[23,-88],leftHand:[-7,-49],rightFoot:[23,-3]}, {hip:[3,-28],chest:[8,-51],head:[6,-72],rightHand:[20,-75]}],
 spin:[{hip:[-4,-26],chest:[-7,-48],rightFoot:[7,-19],turn:.65}, {hip:[0,-29],chest:[0,-51],head:[0,-72],rightFoot:[49,-31],leftFoot:[-7,0],leftHand:[-27,-45],rightHand:[29,-45],turn:1}, {hip:[0,-28],chest:[0,-50],rightFoot:[25,-16],turn:-.65}],
 hammer:[{hip:[-7,-21],chest:[-8,-45],head:[-9,-68],leftHand:[-3,-70],rightHand:[5,-74],hammerAngle:-.65}, {hip:[6,-19],chest:[20,-34],head:[24,-56],leftHand:[25,-29],rightHand:[36,-28],leftFoot:[-16,0],rightFoot:[28,0],hammerAngle:1.92}, {hip:[4,-20],chest:[14,-37],head:[19,-59],leftHand:[23,-32],rightHand:[33,-30],hammerAngle:1.65}],
 gun:[{chest:[-5,-47],rightHand:[13,-53],leftHand:[10,-48]}, {chest:[1,-48],head:[-3,-70],leftHand:[29,-55],rightHand:[38,-56]}, {chest:[-7,-47],head:[-8,-69],rightHand:[30,-53]}],
 dodge:[{hip:[-3,-21],chest:[-10,-39],head:[-16,-58],rightFoot:[20,0]}, {hip:[-9,-15],chest:[-24,-30],head:[-31,-48],rightFoot:[26,0],leftFoot:[-20,-4],leftHand:[-29,-23],rightHand:[-7,-24]}, {hip:[-5,-21],chest:[-11,-39],head:[-15,-59]}]
};
function complete(part){return {...guard,...part};}
function blend(a,b,t){const out={};for(const key in guard)out[key]=Array.isArray(a[key])?a[key].map((v,i)=>mix(v,b[key][i],t)):mix(a[key],b[key],t);return out;}
export function poseAt(h){
 const walk=Math.min(1,Math.abs(h.motion||0)/100),stride=h.stride||0;
 let p=complete({});
 // Feet travel backwards on the ground; the returning foot lifts in an arc.
 for(const [key,offset] of [['leftFoot',0],['rightFoot',Math.PI]]){const phase=((stride+offset)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),stance=phase<Math.PI;const u=stance?phase/Math.PI:(phase-Math.PI)/Math.PI;p[key]=[mix(stance?15:-15,stance?-15:15,u)*walk+(key==='leftFoot'?-14:17)*(1-walk),stance?0:-Math.sin(u*Math.PI)*11*walk];}
 p.hip=[0,-25+Math.cos(stride*2)*1.5*walk];p.chest=[2+2*walk,-47+Math.cos(stride*2)*walk];p.head=[2+3*walk,-68+Math.cos(stride*2)*.7*walk];p.leftHand=[-11-Math.sin(stride)*9*walk,-45];p.rightHand=[17+Math.sin(stride)*9*walk,-49];
 if(h.poseTime>0){const id=h.pose,d=DURATIONS[id],elapsed=d-h.poseTime,contact=id==='dodge'?.08:CONTACT[id];const f=frames[id==='punch'?['jab','cross','kick'][h.comboPose||0]:id];if(f){const keys=[{time:0,pose:guard},{time:contact*.65,pose:complete(f[0])},{time:contact,pose:complete(f[1])},{time:contact+(d-contact)*.35,pose:complete(f[2])},{time:d,pose:guard}];let n=1;while(n<keys.length-1&&elapsed>keys[n].time)n++;const a=keys[n-1],b=keys[n];p=blend(a.pose,b.pose,smooth(Math.max(0,Math.min(1,(elapsed-a.time)/(b.time-a.time)))));}}
 if(h.hurt>0){p.chest[0]-=h.hurt*35;p.head[0]-=h.hurt*45;}
 return p;
}
export function joint(a,b,length,bend=1){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;const offset=Math.sqrt(Math.max(0,length*length-d*d/4));return [(a[0]+b[0])/2-dy/d*offset*bend,(a[1]+b[1])/2+dx/d*offset*bend];}
