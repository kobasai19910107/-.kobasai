import {DURATIONS,CONTACT} from './motion.js';
export const CONFIG = {
  maxHp:100, heal:20, heroSpeed:170, dodgeCooldown:2.4,
  skills:{punch:{name:'連続格闘',icon:'✊',cooldown:.30,damage:13},upper:{name:'アッパー',icon:'↑',cooldown:2.4,damage:25},gun:{name:'空中銃撃',icon:'✦',cooldown:.85,damage:22},spin:{name:'回転蹴り',icon:'↻',cooldown:2.6,damage:24},hammer:{name:'巨大ハンマー',icon:'🔨',cooldown:0,damage:60}},
  enemies:{slime:{name:'スライム',hp:32,damage:4,speed:30,color:'#8de4bc',size:24},goblin:{name:'ゴブリン',hp:46,damage:6,speed:43,color:'#b5dc77',size:29},boar:{name:'森の猪',hp:65,damage:9,speed:52,color:'#ba8c73',size:31},golem:{name:'ゴーレム',hp:210,damage:16,speed:22,color:'#9eabbc',size:49}},
  waves:[['slime','slime','goblin','slime','goblin'],['slime','goblin','boar','slime','goblin','boar'],['golem','goblin','slime','boar','slime']]
};
export const fresh = () => ({version:1,phase:'battle',wave:0,hp:100,gauge:0,skills:{punch:1},choices:[]});
export class Game {
 constructor(saved=fresh()){this.run=structuredClone(saved);this.events=[];this.time=0;this.begin();}
 begin(){this.hero={x:350,face:1,pose:'idle',poseTime:0,invincible:0,stride:0,motion:0,hurt:0,renderX:350};this.pending=null;this.dash=null;this.cooldowns={};this.combo=0;this.dodge=0;this.enemies=CONFIG.waves[this.run.wave].map((type,i)=>({type,...CONFIG.enemies[type],maxHp:CONFIG.enemies[type].hp,x:i%2?610+i*19:90-i*12,y:0,vy:0,vx:0,attack:1+i*.25,windup:0,dead:false,stride:i,motion:0,hurt:0,landing:0,deathTime:0,strike:0}));}
 emit(type,data={}){this.events.push({type,...data});}
 choices(){const s=this.run.skills;if(this.run.wave===1)return ['upper','spin','hammer'].map(id=>({id,upgrade:false}));const list=['upper','spin','hammer'].filter(id=>!s[id]);if(s.upper&&!s.gun)list.unshift('gun');const owned=Object.keys(s).filter(id=>id!=='gun');return [...list.map(id=>({id,upgrade:false})),...owned.map(id=>({id,upgrade:true}))].slice(0,3);}
 choose(index){if(this.run.phase!=='upgrade')return false;const c=this.run.choices[index];if(!c)return false;this.run.skills[c.id]=(this.run.skills[c.id]||0)+1;this.run.phase='battle';this.run.choices=[];this.begin();return true;}
 finish(){if(this.run.phase!=='battle')return;if(this.run.hp<=0){this.run.hp=0;this.run.phase='defeat';this.emit('defeat');return;}if(this.enemies.every(e=>e.dead)){if(this.run.wave===2){this.run.phase='clear';this.emit('clear');}else{this.run.hp=Math.min(CONFIG.maxHp,this.run.hp+CONFIG.heal);this.run.wave++;this.run.phase='upgrade';this.run.choices=this.choices();this.emit('win');}}}
 attack(id,targets){if(this.pending||this.hero.poseTime>0)return false;this.cooldowns[id]=CONFIG.skills[id].cooldown;this.hero.pose=id;this.hero.poseTime=DURATIONS[id];this.hero.comboPose=this.combo%3;this.pending={id,targets:[...targets],remaining:CONTACT[id],face:this.hero.face,combo:this.combo%3};this.emit('prepare',{id});return true;}
 impact(action){const {id,targets,face,combo}=action,skill=CONFIG.skills[id],level=this.run.skills[id];if(['punch','upper'].includes(id)){const nearest=targets.find(e=>!e.dead);if(nearest){const gap=Math.abs(nearest.x-this.hero.x);this.hero.x=Math.max(50,Math.min(650,this.hero.x+face*Math.min(12,Math.max(0,gap-35))));this.hero.renderX=this.hero.x;}}const range={punch:83,upper:95,spin:120,hammer:210,gun:280}[id];const hits=targets.filter(e=>!e.dead&&Math.abs(e.x-this.hero.x)<range&&(id!=='gun'||e.y>5));
 this.emit('attack',{id,x:this.hero.x,face});
 for(const e of hits){const damage=Math.round(skill.damage*(1+(level-1)*.4)*(id==='punch'&&combo===2?1.5:1));e.hp-=damage;e.hurt=e.type==='golem'?.13:.3;const force=id==='hammer'?300:id==='spin'||combo===2?180:100;e.vx=face*force*(e.type==='golem'?.28:1);if(id==='upper'&&e.type!=='golem')e.vy=240;else if((id==='hammer'||id==='spin')&&e.type!=='golem')e.vy=110;
 if(e.hp<=0){e.dead=true;e.deathTime=.65;if(e.type!=='golem')e.vy=Math.max(e.vy,130);this.emit('kill',{x:e.x,color:e.color});}
 this.emit('hit',{x:e.x,y:e.y,damage,id});this.run.gauge=Math.min(100,this.run.gauge+(id==='punch'?10:7));}
 if(id==='punch')this.combo++;if(id==='hammer'&&hits.length)this.run.gauge=0;}
 update(dt){if(this.run.phase!=='battle')return;this.time+=dt;for(const e of this.enemies.filter(e=>e.dead&&e.deathTime>0)){e.deathTime=Math.max(0,e.deathTime-dt);e.x=Math.max(25,Math.min(675,e.x+e.vx*dt));e.vx*=Math.exp(-4*dt);e.y=Math.max(0,e.y+e.vy*dt);e.vy=e.y>0?e.vy-450*dt:0;}const oldX=this.hero.x;this.hero.hurt=Math.max(0,this.hero.hurt-dt);this.hero.poseTime=Math.max(0,this.hero.poseTime-dt);this.hero.invincible=Math.max(0,this.hero.invincible-dt);this.dodge=Math.max(0,this.dodge-dt);for(const id in this.cooldowns)this.cooldowns[id]=Math.max(0,this.cooldowns[id]-dt);
 if(this.pending){this.pending.remaining-=dt;if(this.pending.remaining<=0){const action=this.pending;this.pending=null;this.impact(action);}}
 const alive=this.enemies.filter(e=>!e.dead);if(!alive.length){this.finish();return;}const h=this.hero;
 for(const e of alive){const oldEnemyX=e.x,oldY=e.y;e.hurt=Math.max(0,e.hurt-dt);e.strike=Math.max(0,e.strike-dt);e.landing=Math.max(0,e.landing-dt);e.x+=e.vx*dt;e.vx*=Math.exp(-7*dt);e.y=Math.max(0,e.y+e.vy*dt);if(e.y>0)e.vy-=450*dt;else {e.vy=0;if(oldY>0)e.landing=.2;}e.x=Math.max(28,Math.min(672,e.x));const distance=Math.abs(e.x-h.x);if(e.y>0||e.hurt>.12){e.windup=0;e.motion=0;continue;}if(e.windup>0){e.windup-=dt;if(e.windup<=0)e.strike=.22;if(e.windup<=0&&distance<68&&h.invincible<=0){this.run.hp-=e.damage;h.invincible=.24;h.hurt=.25;this.emit('hurt',{x:h.x,damage:e.damage});}}else{e.attack-=dt;if(distance>46)e.x+=Math.sign(h.x-e.x)*e.speed*dt;else if(e.attack<=0){e.windup=.38;e.attack=e.type==='golem'?2.2:1.7;}}e.motion=(e.x-oldEnemyX)/dt;e.stride+=Math.abs(e.motion)*dt/(e.type==='golem'?15:8);}
 const target=alive.reduce((a,b)=>Math.abs(a.x-h.x)<Math.abs(b.x-h.x)?a:b);if(h.poseTime<=0)h.face=target.x>=h.x?1:-1;const near=alive.filter(e=>Math.abs(e.x-h.x)<95),danger=near.some(e=>e.windup>0&&e.windup<.2);
 if(this.dash){this.dash.elapsed=Math.min(DURATIONS.dodge,this.dash.elapsed+dt);const u=this.dash.elapsed/DURATIONS.dodge;h.x=this.dash.start+(this.dash.end-this.dash.start)*(1-(1-u)**3);if(u>=1)this.dash=null;}
 if(h.poseTime>0||this.pending){}
 else if(danger&&this.dodge<=0){this.dash={start:h.x,end:Math.max(70,Math.min(630,h.x-h.face*65)),elapsed:0};h.invincible=.42;this.dodge=CONFIG.dodgeCooldown;h.pose='dodge';h.poseTime=DURATIONS.dodge;this.emit('dodge',{x:h.x});}
 else if(this.run.skills.hammer&&this.run.gauge>=100&&near.length)this.attack('hammer',alive.filter(e=>Math.abs(e.x-h.x)<190));
 else if(this.run.skills.gun&&!this.cooldowns.gun&&alive.some(e=>e.y>10&&Math.abs(e.x-h.x)<250))this.attack('gun',alive.filter(e=>e.y>10&&Math.abs(e.x-h.x)<250));
 else if(this.run.skills.spin&&!this.cooldowns.spin&&near.length>=2)this.attack('spin',near);
 else if(this.run.skills.upper&&!this.cooldowns.upper&&Math.abs(target.x-h.x)<72)this.attack('upper',[target]);
 else if(!this.cooldowns.punch&&Math.abs(target.x-h.x)<60)this.attack('punch',[target]);
 else if(Math.abs(target.x-h.x)>50)h.x+=h.face*CONFIG.heroSpeed*dt;
 h.motion=(h.x-oldX)/dt;h.stride+=Math.min(140,Math.abs(h.motion))*dt/9;h.renderX=h.x;h.anticipation=h.poseTime<=0&&Math.abs(target.x-h.x)<70&&this.cooldowns.punch>0&&this.cooldowns.punch<.13?1-this.cooldowns.punch/.13:0;
 this.finish();}
}
