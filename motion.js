// Poses use seconds from the simulation, so pause and 2× speed affect every limb.
export const DURATIONS={punch:.34,upper:.48,spin:.5,hammer:.65,gun:.3,dodge:.32};
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
export function poseAt(h){
 const stride=Math.sin(h.stride||0),walk=Math.min(1,Math.abs(h.motion||0)/100);
 const p={hip:[0,-25+Math.abs(stride)*2*walk],chest:[2*walk,-47],head:[3*walk,-67],leftHand:[-17-stride*9*walk,-33],rightHand:[17+stride*9*walk,-33],leftFoot:[-12+stride*14*walk,-Math.max(0,stride)*9*walk],rightFoot:[12-stride*14*walk,-Math.max(0,-stride)*9*walk],turn:1,hammer:0};
 const id=h.poseTime>0?h.pose:'idle',duration=DURATIONS[id]||.34,t=1-Math.max(0,h.poseTime||0)/duration;
 let target=null,weight=0;
 if(id==='punch'){const kick=h.comboPose===2;target=kick?{chest:[-9,-46],head:[-12,-66],rightFoot:[43,-33],rightHand:[12,-48],leftHand:[-22,-44]}:{chest:[10,-45],head:[12,-65],rightHand:[43,-45],leftHand:[-8,-43]};weight=1-smooth(Math.min(1,t));}
 if(id==='upper'){target={hip:[-3,-23],chest:[7,-49],head:[5,-71],rightHand:[22,-90],leftHand:[-13,-42],rightFoot:[21,-2]};weight=Math.sin(Math.PI*(.5+t*.5));}
 if(id==='gun'){target={chest:[-5,-48],head:[-8,-68],leftHand:[28,-56],rightHand:[40,-57]};weight=1-smooth(t);}
 if(id==='spin'){p.turn=Math.cos(t*Math.PI*2);target={hip:[0,-28],chest:[0,-50],head:[0,-70],rightFoot:[51,-29],leftHand:[-32,-46],rightHand:[31,-46]};weight=Math.sin(Math.PI*t);}
 if(id==='hammer'){target={hip:[-4,-21],chest:[12,-38],head:[17,-58],leftHand:[27,-31],rightHand:[37,-29]};weight=1-smooth(t);p.hammer=weight;}
 if(id==='dodge'){target={hip:[-8,-16],chest:[-19,-30],head:[-27,-47],rightFoot:[28,0],leftHand:[-31,-21],rightHand:[-2,-22]};weight=Math.sin(Math.PI*t);}
 if(h.anticipation){target={hip:[-4,-23],chest:[-8,-44],head:[-10,-64],rightHand:[-7,-37],leftHand:[6,-43]};weight=h.anticipation;}
 if(target)for(const key in target)p[key]=p[key].map((v,i)=>mix(v,target[key][i],weight));
 if(h.hurt>0){p.chest[0]-=h.hurt*28;p.head[0]-=h.hurt*35;}
 return p;
}
export function joint(a,b,length,bend=1){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;const offset=Math.sqrt(Math.max(0,length*length-d*d/4));return [(a[0]+b[0])/2-dy/d*offset*bend,(a[1]+b[1])/2+dx/d*offset*bend];}
