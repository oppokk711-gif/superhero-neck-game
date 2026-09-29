const W=420,H=560;

const skel=document.getElementById('skel');
skel.width=W;
skel.height=H;

const vid=document.getElementById('vid');

let detector=null;
let latestKP=null;
let baselineNeck=null;
let actx=null;

/* =========================
   AUDIO
========================= */

function ensureAudio(){
  if(!actx){
    actx=new (window.AudioContext||window.webkitAudioContext)();
  }

  if(actx.state==='suspended'){
    actx.resume();
  }
}

function beep(freq,dur,type,vol,delay){
  if(!actx) return;

  const t0=actx.currentTime+(delay||0);

  const osc=actx.createOscillator();
  const gain=actx.createGain();

  osc.type=type||'sine';
  osc.frequency.setValueAtTime(freq,t0);

  gain.gain.setValueAtTime(vol||0.2,t0);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    t0+dur
  );

  osc.connect(gain);
  gain.connect(actx.destination);

  osc.start(t0);
  osc.stop(t0+dur+0.03);
}

function sfxClick(){
  beep(700,0.06,'sine',0.15);
}

function sfxHit(){
  beep(180,0.12,'square',0.25);
  beep(90,0.18,'square',0.2,0.05);
}

function sfxKO(){
  beep(70,0.4,'sawtooth',0.3);
  beep(50,0.5,'square',0.25,0.1);
}

function sfxVictory(){
  beep(523,0.15,'sine',0.2);
  beep(659,0.15,'sine',0.2,0.15);
  beep(784,0.3,'sine',0.25,0.3);
}


/* =========================
   POSE HELPERS
========================= */

function kp(name){

  if(!latestKP) return null;

  const k=latestKP.find(
    p=>p.name===name
  );

  return (k&&k.score>0.3)?k:null;
}

function shoulderScale(){

  const ls=kp('left_shoulder');
  const rs=kp('right_shoulder');

  return (ls&&rs)
    ?Math.hypot(
        ls.x-rs.x,
        ls.y-rs.y
      )
    :null;
}


/* =========================
   MISSIONS
========================= */

const missions=[

  {
    label:'ยกแขนเหนือศีรษะ',

    instr:
      'ยกแขนสองข้างขึ้นเหนือหัว ค้างไว้!',

    story:
      '⚔️ จอมมารเมื่อยล้าโผล่มากลางเมือง! ยกแขนเหนือศีรษะเพื่อสะสม "พลังฟ้าผ่า" แล้วปล่อยใส่มัน!',

    demo:{
      type:'arms',
      neutral:15,
      target:175
    },

    check:()=>{

      const s=shoulderScale();

      const lw=kp('left_wrist');
      const rw=kp('right_wrist');
      const n=kp('nose');

      return s&&lw&&rw&&n&&
        lw.y<n.y-0.15*s&&
        rw.y<n.y-0.15*s;
    }
  },


  {
    label:'กางแขนท่า T',

    instr:
      'กางแขนออกด้านข้างระดับไหล่ ค้างไว้!',

    story:
      'โจมตีโดนแล้ว! จอมมารเจ็บไปหนึ่งดาว ต่อไปกางแขนท่า T ปล่อย "คลื่นพลังบ่า" ใส่มันอีกดอก!',

    demo:{
      type:'arms',
      neutral:15,
      target:92
    },

    check:()=>{

      const s=shoulderScale();

      const ls=kp('left_shoulder');
      const rs=kp('right_shoulder');

      const lw=kp('left_wrist');
      const rw=kp('right_wrist');

      return s&&ls&&rs&&lw&&rw&&

        Math.abs(lw.y-ls.y)<0.7*s&&
        Math.abs(rw.y-rs.y)<0.7*s&&

        Math.abs(lw.x-ls.x)>0.6*s&&
        Math.abs(rw.x-rs.x)>0.6*s;
    }
  },


  {
    label:'ยักไหล่ขึ้น',

    instr:
      'ยักไหล่ขึ้นสูงสุด ค้างไว้!',

    story:
      'เจ็บไปอีก! จอมมารเริ่มโซเซ ยักไหล่ขึ้นให้สุดเพื่อชาร์จ "หมัดสะบัดไหล่" น็อกมันให้อยู่!',

    demo:{
      type:'shrug',
      target:-14
    },

    check:()=>{

      const s=shoulderScale();

      const ls=kp('left_shoulder');
      const rs=kp('right_shoulder');

      const le=kp('left_ear');
      const re=kp('right_ear');

      if(
        !s||
        !ls||
        !rs||
        !le||
        !re||
        baselineNeck===null
      ){
        return false;
      }

      const cur=
        (
          Math.hypot(
            ls.x-le.x,
            ls.y-le.y
          )+

          Math.hypot(
            rs.x-re.x,
            rs.y-re.y
          )
        )/2;

      return (baselineNeck-cur)>0.09*s;
    }
  },


  {
    label:'เอียงศีรษะ',

    instr:
      'เอียงศีรษะไปด้านใดด้านหนึ่งเบาๆ ค้างไว้!',

    story:
      'จอมมารเหลือพลังนิดเดียว! ท่าไม้ตายสุดท้าย เอียงศีรษะปล่อย "รังสีคอเหล็ก" จบเกมมันซะ!',

    demo:{
      type:'tilt',
      target:20
    },

    check:()=>{

      const s=shoulderScale();

      if(!s) return false;

      const le=kp('left_ear');
      const re=kp('right_ear');

      if(
        le&&
        re&&
        Math.abs(le.y-re.y)>0.28*s
      ){
        return true;
      }

      const lee=kp('left_eye');
      const ree=kp('right_eye');

      if(
        lee&&
        ree&&
        Math.abs(lee.y-ree.y)>0.20*s
      ){
        return true;
      }

      const ls=kp('left_shoulder');
      const rs=kp('right_shoulder');
      const n=kp('nose');

      if(
        ls&&
        rs&&
        n&&
        Math.abs(
          n.x-(ls.x+rs.x)/2
        )>0.16*s
      ){
        return true;
      }

      return false;
    }
  }

];


/* =========================
   CAMERA
   ลดภาระเครื่อง
========================= */

async function initCamera(){

  const stream=
    await navigator.mediaDevices.getUserMedia({

      video:{
        width:{
          ideal:320,
          max:320
        },

        height:{
          ideal:480,
          max:480
        },

        frameRate:{
          ideal:30,
          max:30
        },

        facingMode:'user'
      },

      audio:false
    });

  vid.srcObject=stream;

  await new Promise(resolve=>{

    if(vid.readyState>=1){

      resolve();

    }else{

      vid.onloadedmetadata=resolve;

    }

  });

  await vid.play();
}


/* =========================
   MOVE NET
========================= */

async function initDetector(){

  await tf.setBackend('webgl');

  await tf.ready();

  detector=
    await poseDetection.createDetector(

      poseDetection.SupportedModels.MoveNet,

      {
        modelType:
          poseDetection
            .movenet
            .modelType
            .SINGLEPOSE_LIGHTNING
      }
    );
}


/* =========================
   OPTIMIZED POSE LOOP
========================= */

let detecting=false;

let lastPoseTime=0;
let lastDrawTime=0;

/*
  ตรวจจับ Pose ประมาณ 14 FPS
  วาดกล้องประมาณ 30 FPS
*/

const POSE_INTERVAL=70;
const DRAW_INTERVAL=33;


async function detectLoop(
  time=performance.now()
){

  /* -------------------------
     วาดกล้อง
  ------------------------- */

  if(
    time-lastDrawTime>=DRAW_INTERVAL
  ){

    drawSkeleton();

    lastDrawTime=time;
  }


  /* -------------------------
     ยังไม่ถึงเวลาตรวจ Pose
  ------------------------- */

  if(
    time-lastPoseTime<POSE_INTERVAL
  ){

    requestAnimationFrame(
      detectLoop
    );

    return;
  }


  /* -------------------------
     ป้องกัน Pose Detection ซ้อน
  ------------------------- */

  if(
    !detecting&&
    detector&&
    vid.readyState>=2
  ){

    detecting=true;

    lastPoseTime=time;

    try{

      const poses=
        await detector.estimatePoses(
          vid
        );

      if(
        poses&&
        poses[0]
      ){

        latestKP=
          poses[0].keypoints;
      }

    }catch(e){

      console.warn(
        'Pose detection error:',
        e
      );

    }finally{

      detecting=false;
    }
  }


  requestAnimationFrame(
    detectLoop
  );
}


/* =========================
   DRAW CAMERA + SKELETON
========================= */

function drawSkeleton(){

  const ctx=
    skel.getContext('2d');

  ctx.save();

  ctx.clearRect(
    0,
    0,
    W,
    H
  );


  /* กลับด้านกล้อง */

  ctx.translate(
    W,
    0
  );

  ctx.scale(
    -1,
    1
  );


  /* วาดกล้อง */

  if(
    vid.readyState>=2
  ){

    ctx.drawImage(
      vid,
      0,
      0,
      W,
      H
    );
  }


  /* วาด Skeleton */

  if(latestKP){

    ctx.strokeStyle='#4ade80';

    ctx.fillStyle='#4ade80';

    ctx.lineWidth=3;


    const bones=[

      [
        'left_shoulder',
        'right_shoulder'
      ],

      [
        'left_shoulder',
        'left_elbow'
      ],

      [
        'left_elbow',
        'left_wrist'
      ],

      [
        'right_shoulder',
        'right_elbow'
      ],

      [
        'right_elbow',
        'right_wrist'
      ],

      [
        'left_shoulder',
        'left_hip'
      ],

      [
        'right_shoulder',
        'right_hip'
      ]

    ];


    bones.forEach(
      ([a,b])=>{

        const p1=kp(a);
        const p2=kp(b);

        if(
          p1&&
          p2
        ){

          ctx.beginPath();

          ctx.moveTo(
            p1.x,
            p1.y
          );

          ctx.lineTo(
            p2.x,
            p2.y
          );

          ctx.stroke();
        }
      }
    );


    latestKP.forEach(
      p=>{

        if(
          p.score>0.3
        ){

          ctx.beginPath();

          ctx.arc(
            p.x,
            p.y,
            4,
            0,
            Math.PI*2
          );

          ctx.fill();
        }
      }
    );
  }


  ctx.restore();
}


/* =========================
   PHASER
========================= */

let missionIdx=0;
let holdTime=0;
let active=false;

const NEED=2000;

let instrTxt;
let barBg;
let bar;
let crystalTxt;
let missionTxt;

let heroG;
let enemyG;
let enemyHpBar;

let sceneRef;

let enemyHP=4;
let enemyFlash=0;


/* =========================
   CREATE
========================= */

function create(){

  sceneRef=this;


  const topPanel=
    this.add.graphics();

  topPanel.fillStyle(
    0x0b1020,
    0.6
  );

  topPanel.fillRoundedRect(
    10,
    6,
    W-20,
    52,
    14
  );

  topPanel.lineStyle(
    2,
    0x4ade80,
    0.5
  );

  topPanel.strokeRoundedRect(
    10,
    6,
    W-20,
    52,
    14
  );


  instrTxt=
    this.add.text(
      W/2,
      26,
      '',
      {
        fontFamily:'Kanit',
        fontSize:'14px',
        color:'#ffffff',
        align:'center',
        wordWrap:{
          width:W-40
        }
      }
    ).setOrigin(0.5);


  barBg=
    this.add.rectangle(
      W/2,
      52,
      W-40,
      10,
      0x222222,
      0.7
    ).setOrigin(0.5);


  bar=
    this.add.rectangle(
      20,
      47,
      0,
      10,
      0x4ade80
    ).setOrigin(0,0);


  crystalTxt=
    this.add.text(
      W-10,
      H-14,
      '',
      {
        fontFamily:'Kanit',
        fontSize:'20px'
      }
    ).setOrigin(1,1);


  missionTxt=
    this.add.text(
      10,
      H-14,
      '',
      {
        fontFamily:'Kanit',
        fontSize:'12px',
        color:'#94a3b8',
        fontStyle:'600'
      }
    ).setOrigin(0,1);


  /* -------------------------
     Hero Panel
  ------------------------- */

  const heroPanel=
    this.add.graphics();

  heroPanel.fillStyle(
    0x000000,
    0.4
  );

  heroPanel.fillRoundedRect(
    8,
    64,
    100,
    150,
    16
  );

  heroPanel.lineStyle(
    2,
    0x4ade80,
    0.65
  );

  heroPanel.strokeRoundedRect(
    8,
    64,
    100,
    150,
    16
  );


  this.add.text(
    58,
    78,
    'ทำตามนี้!',
    {
      fontFamily:'Kanit',
      fontSize:'11px',
      color:'#4ade80',
      fontStyle:'bold'
    }
  ).setOrigin(0.5);


  heroG=
    this.add.graphics();


  /* -------------------------
     Enemy
  ------------------------- */

  const enemyPanel=
    this.add.graphics();

  enemyPanel.fillStyle(
    0x1a0b28,
    0.45
  );

  enemyPanel.fillRoundedRect(
    312,
    60,
    100,
    20,
    10
  );

  enemyPanel.lineStyle(
    2,
    0xef4444,
    0.6
  );

  enemyPanel.strokeRoundedRect(
    312,
    60,
    100,
    20,
    10
  );


  this.add.text(
    362,
    72,
    'จอมมารเมื่อยล้า',
    {
      fontFamily:'Kanit',
      fontSize:'10px',
      color:'#ef4444',
      fontStyle:'bold'
    }
  ).setOrigin(0.5);


  this.add.rectangle(
    362,
    90,
    70,
    8,
    0x222222,
    0.85
  ).setOrigin(0.5);


  enemyHpBar=
    this.add.rectangle(
      327,
      86,
      70,
      8,
      0xef4444
    ).setOrigin(0,0);


  enemyG=
    this.add.graphics();
}


/* =========================
   ENEMY DRAW
========================= */

function drawEnemy(time){

  enemyG.clear();

  const bob=
    Math.sin(time*0.003)*3;

  const ex=362;
  const ey=136+bob;

  const col=
    enemyFlash>0
      ?0xffffff
      :0x581c87;


  enemyG.fillStyle(
    col,
    1
  );

  enemyG.fillCircle(
    ex,
    ey,
    26
  );


  enemyG.lineStyle(
    2,
    0x0f172a,
    0.7
  );

  enemyG.strokeCircle(
    ex,
    ey,
    26
  );


  enemyG.fillStyle(
    0x3b0764,
    1
  );


  enemyG.beginPath();

  enemyG.moveTo(
    ex-18,
    ey-20
  );

  enemyG.lineTo(
    ex-8,
    ey-38
  );

  enemyG.lineTo(
    ex-2,
    ey-18
  );

  enemyG.closePath();

  enemyG.fillPath();


  enemyG.beginPath();

  enemyG.moveTo(
    ex+18,
    ey-20
  );

  enemyG.lineTo(
    ex+8,
    ey-38
  );

  enemyG.lineTo(
    ex+2,
    ey-18
  );

  enemyG.closePath();

  enemyG.fillPath();


  enemyG.fillStyle(
    0xef4444,
    0.35
  );

  enemyG.fillCircle(
    ex-9,
    ey-2,
    9
  );

  enemyG.fillCircle(
    ex+9,
    ey-2,
    9
  );


  enemyG.fillStyle(
    0xef4444,
    1
  );

  enemyG.fillCircle(
    ex-9,
    ey-2,
    5
  );

  enemyG.fillCircle(
    ex+9,
    ey-2,
    5
  );


  enemyG.fillStyle(
    0x0f172a,
    1
  );


  enemyG.beginPath();

  enemyG.moveTo(
    ex-16,
    ey-11
  );

  enemyG.lineTo(
    ex-3,
    ey-7
  );

  enemyG.lineTo(
    ex-16,
    ey-4
  );

  enemyG.closePath();

  enemyG.fillPath();


  enemyG.beginPath();

  enemyG.moveTo(
    ex+16,
    ey-11
  );

  enemyG.lineTo(
    ex+3,
    ey-7
  );

  enemyG.lineTo(
    ex+16,
    ey-4
  );

  enemyG.closePath();

  enemyG.fillPath();
}


/* =========================
   ATTACK
========================= */

function launchAttack(){

  const proj=
    sceneRef.add.circle(
      58,
      116,
      7,
      0xfacc15
    );


  sceneRef.tweens.add({

    targets:proj,

    x:362,
    y:136,

    duration:320,

    ease:'Quad.easeIn',

    onComplete:()=>{

      proj.destroy();

      sfxHit();


      enemyHP=
        Math.max(
          0,
          enemyHP-1
        );


      enemyHpBar.width=
        70*(enemyHP/4);


      enemyFlash=12;


      sceneRef.cameras.main.shake(
        150,
        0.012
      );


      for(
        let i=0;
        i<7;
        i++
      ){

        const ang=
          (Math.PI*2/7)*i;


        const spark=
          sceneRef.add.circle(
            362,
            136,
            3,
            0xfacc15
          );


        sceneRef.tweens.add({

          targets:spark,

          x:
            362+
            Math.cos(ang)*30,

          y:
            136+
            Math.sin(ang)*30,

          alpha:0,

          duration:400,

          onComplete:()=>{
            spark.destroy();
          }

        });
      }


      const dmg=
        sceneRef.add.text(
          362,
          116,
          'โดนแล้ว!',
          {
            fontFamily:'Kanit',
            fontSize:'14px',
            color:'#fde047',
            fontStyle:'bold'
          }
        ).setOrigin(0.5);


      sceneRef.tweens.add({

        targets:dmg,

        y:86,

        alpha:0,

        duration:600,

        onComplete:()=>{
          dmg.destroy();
        }

      });

    }

  });
}


/* =========================
   DEMO HERO
========================= */

function drawDemo(time,m){

  heroG.clear();


  const cx=58;

  const headY=98;

  const shoulderY=116;

  const hipY=152;

  const armLen=32;


  let leftDeg=15;
  let rightDeg=15;

  let shoulderOffY=0;

  let headTilt=0;


  const d=m.demo;


  const osc01=
    (Math.sin(
      time*0.0025
    )+1)/2;


  const oscPM=
    Math.sin(
      time*0.0025
    );


  if(
    d.type==='arms'
  ){

    const ang=
      d.neutral+
      (d.target-d.neutral)*
      osc01;

    leftDeg=ang;
    rightDeg=ang;


  }else if(
    d.type==='shrug'
  ){

    shoulderOffY=
      d.target*osc01;


  }else if(
    d.type==='tilt'
  ){

    headTilt=
      d.target*oscPM;
  }


  const bob=
    Math.sin(
      time*0.004
    )*2;


  const sY=
    shoulderY+
    shoulderOffY+
    bob;


  const headX=
    cx+
    headTilt*0.7;


  const headY2=
    headY+
    shoulderOffY+
    bob;


  if(active){

    const pulse=
      (Math.sin(
        time*0.006
      )+1)/2;


    heroG.fillStyle(
      0xfacc15,
      0.12+
      0.13*pulse
    );


    heroG.fillCircle(
      cx,
      (headY2+hipY)/2,
      44+6*pulse
    );
  }


  /* cape */

  heroG.fillStyle(
    0xdc2626,
    0.95
  );

  heroG.beginPath();

  heroG.moveTo(
    cx-10,
    sY-2
  );

  heroG.lineTo(
    cx+10,
    sY-2
  );

  heroG.lineTo(
    cx+19,
    hipY+12
  );

  heroG.lineTo(
    cx-19,
    hipY+12
  );

  heroG.closePath();

  heroG.fillPath();


  /* legs */

  heroG.lineStyle(
    6,
    0x1e293b,
    1
  );


  heroG.beginPath();

  heroG.moveTo(
    cx,
    hipY
  );

  heroG.lineTo(
    cx-11,
    hipY+30
  );

  heroG.strokePath();


  heroG.beginPath();

  heroG.moveTo(
    cx,
    hipY
  );

  heroG.lineTo(
    cx+11,
    hipY+30
  );

  heroG.strokePath();


  /* boots */

  heroG.fillStyle(
    0xb91c1c,
    1
  );

  heroG.fillRect(
    cx-16,
    hipY+27,
    10,
    8
  );

  heroG.fillRect(
    cx+6,
    hipY+27,
    10,
    8
  );


  /* torso */

  heroG.fillStyle(
    0x2563eb,
    1
  );

  heroG.fillRoundedRect(
    cx-12,
    sY,
    24,
    hipY-sY,
    6
  );


  heroG.lineStyle(
    2,
    0x0f172a,
    0.8
  );

  heroG.strokeRoundedRect(
    cx-12,
    sY,
    24,
    hipY-sY,
    6
  );


  /* emblem */

  heroG.fillStyle(
    0xfacc15,
    1
  );

  heroG.fillCircle(
    cx,
    sY+13,
    5
  );


  /* arms */

  heroG.lineStyle(
    6,
    0x2563eb,
    1
  );


  [
    [-1,leftDeg],
    [1,rightDeg]
  ].forEach(
    ([sign,deg])=>{

      const rad=
        Phaser.Math.DegToRad(
          deg
        );


      const ex=
        cx+
        sign*
        Math.sin(rad)*
        armLen;


      const ey=
        sY+
        Math.cos(rad)*
        armLen;


      heroG.beginPath();


      heroG.moveTo(
        cx+sign*10,
        sY+4
      );


      heroG.lineTo(
        ex,
        ey
      );


      heroG.strokePath();


      heroG.fillStyle(
        0xffcf9e,
        1
      );


      heroG.fillCircle(
        ex,
        ey,
        5
      );

    }
  );


  /* head */

  heroG.fillStyle(
    0xffcf9e,
    1
  );

  heroG.fillCircle(
    headX,
    headY2,
    10
  );


  heroG.lineStyle(
    2,
    0x0f172a,
    0.6
  );

  heroG.strokeCircle(
    headX,
    headY2,
    10
  );


  /* mask */

  heroG.fillStyle(
    0x1e3a8a,
    1
  );

  heroG.fillRect(
    headX-9,
    headY2-3,
    18,
    5
  );


  heroG.fillStyle(
    0x0f172a,
    1
  );


  [-6,0,6].forEach(
    dx=>{

      heroG.beginPath();

      heroG.moveTo(
        headX+dx-4,
        headY2-7
      );

      heroG.lineTo(
        headX+dx,
        headY2-15
      );

      heroG.lineTo(
        headX+dx+4,
        headY2-7
      );

      heroG.closePath();

      heroG.fillPath();

    }
  );
}


/* =========================
   UPDATE
========================= */

function update(
  time,
  delta
){

  const m0=
    missions[
      Math.min(
        missionIdx,
        missions.length-1
      )
    ];


  missionTxt.setText(
    'ด่าน '+
    Math.min(
      missionIdx+1,
      4
    )+
    '/4'
  );


  drawDemo(
    time,
    m0
  );


  if(enemyFlash>0){

    enemyFlash--;
  }


  drawEnemy(
    time
  );


  if(!active) return;


  const m=
    missions[
      missionIdx
    ];


  instrTxt.setText(
    m.instr
  );


  const ok=
    m.check();


  holdTime=
    ok
      ?Math.min(
          NEED,
          holdTime+delta
        )
      :Math.max(
          0,
          holdTime-
          delta*1.2
        );


  bar.width=
    (holdTime/NEED)*
    (W-40);


  bar.fillColor=
    ok
      ?0x4ade80
      :0xf59e0b;


  if(
    holdTime>=NEED
  ){

    succeedMission();
  }
}


/* =========================
   MISSION SUCCESS
========================= */

function succeedMission(){

  active=false;

  holdTime=0;

  bar.width=0;


  launchAttack();


  missionIdx++;


  crystalTxt.setText(
    '💎'.repeat(
      missionIdx
    )
  );


  setTimeout(()=>{

    if(
      missionIdx>=
      missions.length
    ){

      showKO();

    }else{

      showStory(
        missions[
          missionIdx
        ].story,
        false
      );
    }

  },450);
}


/* =========================
   KO
========================= */

function showKO(){

  sfxKO();


  const flash=
    document.getElementById(
      'koFlash'
    );


  flash.style.animation='none';

  void flash.offsetWidth;


  flash.style.animation=
    'flashOut .5s ease-out forwards';


  document.getElementById(
    'koOverlay'
  ).style.display='flex';


  setTimeout(()=>{

    document.getElementById(
      'koOverlay'
    ).style.display='none';


    showVictory();

  },1500);
}


/* =========================
   STORY
========================= */

function showStory(
  text,
  isEnd
){

  document.getElementById(
    'storyText'
  ).textContent=text;


  document.getElementById(
    'storyBtn'
  ).textContent=
    'ไปกันเลย!';


  document.getElementById(
    'storyOverlay'
  ).style.display='flex';


  document.getElementById(
    'storyBtn'
  ).onclick=()=>{

    sfxClick();


    document.getElementById(
      'storyOverlay'
    ).style.display='none';


    startMission();
  };
}


/* =========================
   VICTORY
========================= */

function showVictory(){

  sfxVictory();


  document.getElementById(
    'victoryText'
  ).textContent=
    '🏆 จอมมารเมื่อยล้าพ่ายแพ้แล้ว! เจ้าคือฮีโร่พิชิตคอ บ่า ไหล่ตัวจริง เมืองปลอดภัยแล้วเพราะเจ้า!';


  document.getElementById(
    'victoryOverlay'
  ).style.display='flex';


  document.getElementById(
    'victoryBtn'
  ).onclick=()=>{

    sfxClick();


    document.getElementById(
      'victoryOverlay'
    ).style.display='none';


    missionIdx=0;

    crystalTxt.setText('');

    enemyHP=4;

    enemyHpBar.width=70;


    showStory(
      missions[0].story,
      false
    );
  };
}


/* =========================
   START MISSION
========================= */

function startMission(){

  if(
    missionIdx===2
  ){

    baselineNeck=null;

    active=false;


    instrTxt.setText(
      'ยืนตัวตรง ผ่อนคลายไหล่ อย่าขยับ กำลังวัดค่าเริ่มต้น...'
    );


    let samples=[];
    let n=0;


    const sample=()=>{

      const ls=
        kp('left_shoulder');

      const rs=
        kp('right_shoulder');

      const le=
        kp('left_ear');

      const re=
        kp('right_ear');


      if(
        n>=10&&
        ls&&
        rs&&
        le&&
        re
      ){

        samples.push(

          (
            Math.hypot(
              ls.x-le.x,
              ls.y-le.y
            )+

            Math.hypot(
              rs.x-re.x,
              rs.y-re.y
            )
          )/2

        );
      }


      n++;


      if(
        n<45
      ){

        requestAnimationFrame(
          sample
        );

      }else{

        baselineNeck=
          samples.length

            ?samples.reduce(
                (a,b)=>a+b,
                0
              )/
              samples.length

            :null;


        active=true;
      }
    };


    sample();


  }else{

    active=true;
  }
}


/* =========================
   START BUTTON
========================= */

document.getElementById(
  'startBtn'
).onclick=async()=>{

  ensureAudio();


  document.getElementById(
    'hint'
  ).textContent=
    'กำลังเปิดกล้อง...';


  try{

    await initCamera();


    document.getElementById(
      'hint'
    ).textContent=
      'กำลังโหลดระบบตรวจจับท่าทาง...';


    await initDetector();


    /* เริ่มระบบตรวจจับแบบลดภาระ */

    requestAnimationFrame(
      detectLoop
    );


    document.getElementById(
      'startOverlay'
    ).style.display='none';


    new Phaser.Game({

      type:Phaser.AUTO,

      width:W,

      height:H,

      transparent:true,

      parent:
        'phaser-container',

      scene:{
        create,
        update
      }

    });


    document.getElementById(
      'vsOverlay'
    ).style.display='flex';


    document.getElementById(
      'vsBtn'
    ).onclick=()=>{

      sfxClick();


      document.getElementById(
        'vsOverlay'
      ).style.display='none';


      showStory(
        missions[0].story,
        false
      );
    };


  }catch(e){

    console.error(e);


    document.getElementById(
      'hint'
    ).textContent=
      'เปิดกล้องไม่สำเร็จ กรุณาอนุญาตการใช้กล้องแล้วลองใหม่';
  }

};