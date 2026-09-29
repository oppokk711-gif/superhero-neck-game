const W = 420;
const H = 560;

const skel = document.getElementById('skel');
skel.width = W;
skel.height = H;

const vid = document.getElementById('vid');

let detector = null;
let latestKP = null;
let baselineNeck = null;
let actx = null;


/* =========================================================
   BACKGROUND
========================================================= */

const gameBackground = new Image();

gameBackground.onload = () => {
  console.log('background.png loaded');
};

gameBackground.onerror = () => {
  console.warn('ไม่พบ background.png');
};

gameBackground.src = 'background.png';


/* =========================================================
   AUDIO
========================================================= */

function ensureAudio(){

  if(!actx){

    actx = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

  }

  if(actx.state === 'suspended'){
    actx.resume();
  }

}


function beep(
  freq,
  dur,
  type,
  vol,
  delay
){

  if(!actx) return;

  const t0 =
    actx.currentTime +
    (delay || 0);

  const osc =
    actx.createOscillator();

  const gain =
    actx.createGain();

  osc.type =
    type || 'sine';

  osc.frequency.setValueAtTime(
    freq,
    t0
  );

  gain.gain.setValueAtTime(
    vol || 0.2,
    t0
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    t0 + dur
  );

  osc.connect(gain);
  gain.connect(actx.destination);

  osc.start(t0);

  osc.stop(
    t0 + dur + 0.03
  );

}


function sfxClick(){

  beep(
    700,
    0.06,
    'sine',
    0.15
  );

}


function sfxHit(){

  beep(
    180,
    0.12,
    'square',
    0.25
  );

  beep(
    90,
    0.18,
    'square',
    0.2,
    0.05
  );

}


function sfxKO(){

  beep(
    70,
    0.4,
    'sawtooth',
    0.3
  );

  beep(
    50,
    0.5,
    'square',
    0.25,
    0.1
  );

}


function sfxVictory(){

  beep(
    523,
    0.15,
    'sine',
    0.2
  );

  beep(
    659,
    0.15,
    'sine',
    0.2,
    0.15
  );

  beep(
    784,
    0.3,
    'sine',
    0.25,
    0.3
  );

}


/* =========================================================
   POSE HELPERS
========================================================= */

function kp(name){

  if(!latestKP){
    return null;
  }

  const k =
    latestKP.find(
      p => p.name === name
    );

  if(
    k &&
    k.score > 0.3
  ){
    return k;
  }

  return null;

}


function shoulderScale(){

  const ls =
    kp('left_shoulder');

  const rs =
    kp('right_shoulder');

  if(
    !ls ||
    !rs
  ){
    return null;
  }

  return Math.hypot(
    ls.x - rs.x,
    ls.y - rs.y
  );

}


/* =========================================================
   MISSIONS
========================================================= */

const missions = [

  /* =======================================================
     1. ยกแขน
  ======================================================= */

  {

    label:
      'ยกแขนเหนือศีรษะ',

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

      const s =
        shoulderScale();

      const lw =
        kp('left_wrist');

      const rw =
        kp('right_wrist');

      const n =
        kp('nose');

      if(
        !s ||
        !lw ||
        !rw ||
        !n
      ){
        return false;
      }

      return (
        lw.y < n.y - 0.15 * s &&
        rw.y < n.y - 0.15 * s
      );

    }

  },


  /* =======================================================
     2. T POSE
  ======================================================= */

  {

    label:
      'กางแขนท่า T',

    instr:
      'กางแขนออกด้านข้างระดับไหล่ ค้างไว้!',

    story:
      '💥 โจมตีโดนแล้ว! จอมมารเจ็บไปหนึ่งดาว ต่อไปกางแขนท่า T ปล่อย "คลื่นพลังบ่า" ใส่มันอีกดอก!',

    demo:{
      type:'arms',
      neutral:15,
      target:92
    },

    check:()=>{

      const s =
        shoulderScale();

      const ls =
        kp('left_shoulder');

      const rs =
        kp('right_shoulder');

      const lw =
        kp('left_wrist');

      const rw =
        kp('right_wrist');

      if(
        !s ||
        !ls ||
        !rs ||
        !lw ||
        !rw
      ){
        return false;
      }

      const leftY =
        Math.abs(
          lw.y - ls.y
        ) < 0.7 * s;

      const rightY =
        Math.abs(
          rw.y - rs.y
        ) < 0.7 * s;

      const leftX =
        Math.abs(
          lw.x - ls.x
        ) > 0.6 * s;

      const rightX =
        Math.abs(
          rw.x - rs.x
        ) > 0.6 * s;

      return (
        leftY &&
        rightY &&
        leftX &&
        rightX
      );

    }

  },


  /* =======================================================
     3. SHRUG
  ======================================================= */

  {

    label:
      'ยักไหล่ขึ้น',

    instr:
      'ยักไหล่ขึ้นสูงสุด ค้างไว้!',

    story:
      '💥 เจ็บไปอีก! จอมมารเริ่มโซเซ ยักไหล่ขึ้นให้สุดเพื่อชาร์จ "หมัดสะบัดไหล่" น็อกมันให้อยู่!',

    demo:{
      type:'shrug',
      target:-14
    },

    check:()=>{

      const s =
        shoulderScale();

      const ls =
        kp('left_shoulder');

      const rs =
        kp('right_shoulder');

      const le =
        kp('left_ear');

      const re =
        kp('right_ear');

      if(
        !s ||
        !ls ||
        !rs ||
        !le ||
        !re ||
        baselineNeck === null
      ){
        return false;
      }

      const cur =
        (
          Math.hypot(
            ls.x - le.x,
            ls.y - le.y
          ) +

          Math.hypot(
            rs.x - re.x,
            rs.y - re.y
          )
        ) / 2;

      return (
        baselineNeck - cur
      ) > 0.09 * s;

    }

  },


  /* =======================================================
     4. TILT
  ======================================================= */

  {

    label:
      'เอียงศีรษะ',

    instr:
      'เอียงศีรษะไปด้านใดด้านหนึ่งเบา ๆ ค้างไว้!',

    story:
      '🔥 จอมมารเหลือพลังนิดเดียว! ท่าไม้ตายสุดท้าย เอียงศีรษะปล่อย "รังสีคอเหล็ก" จบเกมมันซะ!',

    demo:{
      type:'tilt',
      target:20
    },

    check:()=>{

      const s =
        shoulderScale();

      if(!s){
        return false;
      }


      /* -------------------------
         หู
      ------------------------- */

      const le =
        kp('left_ear');

      const re =
        kp('right_ear');

      if(
        le &&
        re &&
        Math.abs(
          le.y - re.y
        ) > 0.28 * s
      ){
        return true;
      }


      /* -------------------------
         ตา
      ------------------------- */

      const lee =
        kp('left_eye');

      const ree =
        kp('right_eye');

      if(
        lee &&
        ree &&
        Math.abs(
          lee.y - ree.y
        ) > 0.20 * s
      ){
        return true;
      }


      /* -------------------------
         จมูก
      ------------------------- */

      const ls =
        kp('left_shoulder');

      const rs =
        kp('right_shoulder');

      const n =
        kp('nose');

      if(
        ls &&
        rs &&
        n
      ){

        const centerX =
          (
            ls.x +
            rs.x
          ) / 2;

        if(
          Math.abs(
            n.x - centerX
          ) > 0.16 * s
        ){
          return true;
        }

      }

      return false;

    }

  }

];


/* =========================================================
   CAMERA
========================================================= */

async function initCamera(){

  if(
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ){

    throw new Error(
      'เบราว์เซอร์ไม่รองรับกล้อง'
    );

  }


  const stream =
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


  vid.srcObject =
    stream;


  await new Promise(
    resolve => {

      if(
        vid.readyState >= 1
      ){

        resolve();

      }else{

        vid.onloadedmetadata =
          resolve;

      }

    }
  );


  await vid.play();

}


/* =========================================================
   MOVE NET
========================================================= */

async function initDetector(){

  try{

    await tf.setBackend(
      'webgl'
    );

  }catch(e){

    console.warn(
      'WebGL ใช้ไม่ได้ กำลังใช้ backend อื่น'
    );

  }


  await tf.ready();


  detector =
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


/* =========================================================
   OPTIMIZED POSE LOOP
========================================================= */

let detecting = false;

let lastPoseTime = 0;

let lastDrawTime = 0;

const POSE_INTERVAL = 70;
const DRAW_INTERVAL = 33;


async function detectLoop(
  time = performance.now()
){

  /* -------------------------
     วาดกล้อง / skeleton
  ------------------------- */

  if(
    time -
    lastDrawTime >=
    DRAW_INTERVAL
  ){

    drawSkeleton();

    lastDrawTime =
      time;

  }


  /* -------------------------
     จำกัดความถี่ Pose
  ------------------------- */

  if(
    time -
    lastPoseTime <
    POSE_INTERVAL
  ){

    requestAnimationFrame(
      detectLoop
    );

    return;

  }


  /* -------------------------
     ป้องกัน estimate ซ้อนกัน
  ------------------------- */

  if(
    !detecting &&
    detector &&
    vid.readyState >= 2
  ){

    detecting = true;

    lastPoseTime =
      time;


    try{

      const poses =
        await detector.estimatePoses(
          vid
        );


      if(
        poses &&
        poses[0] &&
        poses[0].keypoints
      ){

        latestKP =
          poses[0].keypoints;

      }

    }catch(e){

      console.warn(
        'Pose detection error:',
        e
      );

    }finally{

      detecting = false;

    }

  }


  requestAnimationFrame(
    detectLoop
  );

}


/* =========================================================
   DRAW BACKGROUND + CAMERA + SKELETON
========================================================= */

function drawSkeleton(){

  const ctx =
    skel.getContext(
      '2d'
    );


  /*
    ตำแหน่งกรอบกล้อง
  */

  const camX = 10;
  const camY = 72;
  const camW = W - 20;
  const camH = 445;


  ctx.clearRect(
    0,
    0,
    W,
    H
  );


  /* =======================================================
     GAME BACKGROUND
  ======================================================= */

  if(
    gameBackground.complete &&
    gameBackground.naturalWidth > 0
  ){

    ctx.drawImage(
      gameBackground,
      0,
      0,
      W,
      H
    );

  }else{

    ctx.fillStyle =
      '#071126';

    ctx.fillRect(
      0,
      0,
      W,
      H
    );

  }


  /* =======================================================
     DARKEN BACKGROUND
  ======================================================= */

  ctx.fillStyle =
    'rgba(2,6,23,0.22)';

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /* =======================================================
     CAMERA SHADOW
  ======================================================= */

  ctx.save();

  ctx.shadowColor =
    'rgba(0,0,0,0.75)';

  ctx.shadowBlur =
    18;

  ctx.shadowOffsetY =
    6;

  ctx.fillStyle =
    '#000';

  ctx.beginPath();

  ctx.roundRect(
    camX,
    camY,
    camW,
    camH,
    18
  );

  ctx.fill();

  ctx.restore();


  /* =======================================================
     CAMERA CLIP
  ======================================================= */

  ctx.save();

  ctx.beginPath();

  ctx.roundRect(
    camX,
    camY,
    camW,
    camH,
    18
  );

  ctx.clip();


  /* =======================================================
     CAMERA
  ======================================================= */

  if(
    vid.readyState >= 2 &&
    vid.videoWidth > 0 &&
    vid.videoHeight > 0
  ){

    /*
      Mirror กล้อง
    */

    ctx.save();

    ctx.translate(
      camX + camW,
      camY
    );

    ctx.scale(
      -1,
      1
    );


    ctx.drawImage(
      vid,
      0,
      0,
      camW,
      camH
    );


    /* ===================================================
       SKELETON
    =================================================== */

    if(latestKP){

      ctx.strokeStyle =
        '#4ade80';

      ctx.fillStyle =
        '#4ade80';

      ctx.lineWidth =
        3;


      const sx =
        camW / 320;

      const sy =
        camH / 480;


      const bones = [

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
        ],

        [
          'left_hip',
          'right_hip'
        ],

        [
          'left_ear',
          'left_shoulder'
        ],

        [
          'right_ear',
          'right_shoulder'
        ]

      ];


      bones.forEach(
        ([a,b])=>{

          const p1 =
            kp(a);

          const p2 =
            kp(b);


          if(
            p1 &&
            p2
          ){

            ctx.beginPath();

            ctx.moveTo(
              p1.x * sx,
              p1.y * sy
            );

            ctx.lineTo(
              p2.x * sx,
              p2.y * sy
            );

            ctx.stroke();

          }

        }
      );


      /* -------------------------
         จุดข้อต่อ
      ------------------------- */

      latestKP.forEach(
        p=>{

          if(
            p.score > 0.3
          ){

            ctx.beginPath();

            ctx.arc(
              p.x * sx,
              p.y * sy,
              4.5,
              0,
              Math.PI * 2
            );

            ctx.fill();

          }

        }
      );

    }


    ctx.restore();

  }


  ctx.restore();


  /* =======================================================
     CAMERA BORDER
  ======================================================= */

  ctx.save();

  ctx.strokeStyle =
    'rgba(74,222,128,0.85)';

  ctx.lineWidth =
    2;


  ctx.beginPath();

  ctx.roundRect(
    camX,
    camY,
    camW,
    camH,
    18
  );

  ctx.stroke();

  ctx.restore();


  /* =======================================================
     CAMERA LABEL
  ======================================================= */

  ctx.save();

  ctx.fillStyle =
    'rgba(2,6,23,0.72)';

  ctx.beginPath();

  ctx.roundRect(
    camX + 10,
    camY + 10,
    110,
    27,
    10
  );

  ctx.fill();


  ctx.fillStyle =
    '#4ade80';

  ctx.font =
    'bold 13px Kanit';

  ctx.textAlign =
    'center';

  ctx.textBaseline =
    'middle';

  ctx.fillText(
    '📷 กล้องฮีโร่',
    camX + 65,
    camY + 23
  );

  ctx.restore();

}


/* =========================================================
   PHASER VARIABLES
========================================================= */

let missionIdx = 0;

let holdTime = 0;

let active = false;


/*
  ต้องค้างท่า 3.5 วินาที
*/

const NEED = 3500;


let instrTxt;
let barBg;
let bar;
let crystalTxt;
let missionTxt;

let heroG;
let enemyG;
let enemyHpBar;

let sceneRef;

let enemyHP = 4;

let enemyFlash = 0;


/* =========================================================
   CREATE
========================================================= */

function create(){

  sceneRef = this;


  /* =======================================================
     TOP PANEL
  ======================================================= */

  const topPanel =
    this.add.graphics();


  topPanel.fillStyle(
    0x0b1020,
    0.80
  );


  topPanel.fillRoundedRect(
    10,
    6,
    W - 20,
    52,
    14
  );


  topPanel.lineStyle(
    2,
    0x4ade80,
    0.55
  );


  topPanel.strokeRoundedRect(
    10,
    6,
    W - 20,
    52,
    14
  );


  /* =======================================================
     INSTRUCTION
  ======================================================= */

  instrTxt =
    this.add.text(
      W / 2,
      24,
      '',
      {

        fontFamily:
          'Kanit',

        fontSize:
          '14px',

        color:
          '#ffffff',

        align:
          'center',

        wordWrap:{
          width:
            W - 60
        }

      }
    ).setOrigin(
      0.5
    );


  /* =======================================================
     HOLD BAR BACKGROUND
  ======================================================= */

  barBg =
    this.add.rectangle(
      W / 2,
      51,
      W - 40,
      10,
      0x222222,
      0.9
    ).setOrigin(
      0.5
    );


  /* =======================================================
     HOLD BAR
  ======================================================= */

  bar =
    this.add.rectangle(
      20,
      46,
      0,
      10,
      0x4ade80
    ).setOrigin(
      0,
      0
    );


  /* =======================================================
     CRYSTALS
  ======================================================= */

  crystalTxt =
    this.add.text(
      W - 10,
      H - 14,
      '',
      {

        fontFamily:
          'Kanit',

        fontSize:
          '20px'

      }
    ).setOrigin(
      1,
      1
    );


  /* =======================================================
     MISSION
  ======================================================= */

  missionTxt =
    this.add.text(
      10,
      H - 14,
      '',
      {

        fontFamily:
          'Kanit',

        fontSize:
          '12px',

        color:
          '#ffffff',

        fontStyle:
          '600'

      }
    ).setOrigin(
      0,
      1
    );


  /* =======================================================
     HERO DEMO PANEL
  ======================================================= */

  const heroPanel =
    this.add.graphics();


  heroPanel.fillStyle(
    0x020617,
    0.82
  );


  heroPanel.fillRoundedRect(
    10,
    88,
    92,
    145,
    15
  );


  heroPanel.lineStyle(
    2,
    0x4ade80,
    0.7
  );


  heroPanel.strokeRoundedRect(
    10,
    88,
    92,
    145,
    15
  );


  this.add.text(
    56,
    101,
    'ทำตามนี้!',
    {

      fontFamily:
        'Kanit',

      fontSize:
        '11px',

      color:
        '#4ade80',

      fontStyle:
        'bold'

    }
  ).setOrigin(
    0.5
  );


  heroG =
    this.add.graphics();


  /* =======================================================
     ENEMY PANEL
  ======================================================= */

  const enemyPanel =
    this.add.graphics();


  enemyPanel.fillStyle(
    0x1a0b28,
    0.86
  );


  enemyPanel.fillRoundedRect(
    270,
    64,
    130,
    23,
    11
  );


  enemyPanel.lineStyle(
    2,
    0xef4444,
    0.65
  );


  enemyPanel.strokeRoundedRect(
    270,
    64,
    130,
    23,
    11
  );


  this.add.text(
    335,
    75,
    'จอมมารเมื่อยล้า',
    {

      fontFamily:
        'Kanit',

      fontSize:
        '10px',

      color:
        '#ef4444',

      fontStyle:
        'bold'

    }
  ).setOrigin(
    0.5
  );


  /* =======================================================
     ENEMY HP
  ======================================================= */

  this.add.rectangle(
    335,
    94,
    70,
    8,
    0x222222,
    0.9
  ).setOrigin(
    0.5
  );


  enemyHpBar =
    this.add.rectangle(
      300,
      90,
      70,
      8,
      0xef4444
    ).setOrigin(
      0,
      0
    );


  enemyG =
    this.add.graphics();

}


/* =========================================================
   DRAW ENEMY
========================================================= */

function drawEnemy(time){

  enemyG.clear();


  const bob =
    Math.sin(
      time * 0.003
    ) * 3;


  /*
    วางศัตรูด้านขวาบน
    ไม่ให้ชนขอบ
  */

  const ex = 348;

  const ey =
    136 + bob;


  const col =
    enemyFlash > 0
      ? 0xffffff
      : 0x581c87;


  /* -------------------------
     ตัว
  ------------------------- */

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


  /* -------------------------
     เขา
  ------------------------- */

  enemyG.fillStyle(
    0x3b0764,
    1
  );


  enemyG.beginPath();

  enemyG.moveTo(
    ex - 18,
    ey - 20
  );

  enemyG.lineTo(
    ex - 8,
    ey - 38
  );

  enemyG.lineTo(
    ex - 2,
    ey - 18
  );

  enemyG.closePath();

  enemyG.fillPath();


  enemyG.beginPath();

  enemyG.moveTo(
    ex + 18,
    ey - 20
  );

  enemyG.lineTo(
    ex + 8,
    ey - 38
  );

  enemyG.lineTo(
    ex + 2,
    ey - 18
  );

  enemyG.closePath();

  enemyG.fillPath();


  /* -------------------------
     ตา
  ------------------------- */

  enemyG.fillStyle(
    0xef4444,
    0.35
  );

  enemyG.fillCircle(
    ex - 9,
    ey - 2,
    9
  );

  enemyG.fillCircle(
    ex + 9,
    ey - 2,
    9
  );


  enemyG.fillStyle(
    0xef4444,
    1
  );

  enemyG.fillCircle(
    ex - 9,
    ey - 2,
    5
  );

  enemyG.fillCircle(
    ex + 9,
    ey - 2,
    5
  );


  /* -------------------------
     คิ้ว
  ------------------------- */

  enemyG.fillStyle(
    0x0f172a,
    1
  );


  enemyG.beginPath();

  enemyG.moveTo(
    ex - 16,
    ey - 11
  );

  enemyG.lineTo(
    ex - 3,
    ey - 7
  );

  enemyG.lineTo(
    ex - 16,
    ey - 4
  );

  enemyG.closePath();

  enemyG.fillPath();


  enemyG.beginPath();

  enemyG.moveTo(
    ex + 16,
    ey - 11
  );

  enemyG.lineTo(
    ex + 3,
    ey - 7
  );

  enemyG.lineTo(
    ex + 16,
    ey - 4
  );

  enemyG.closePath();

  enemyG.fillPath();

}


/* =========================================================
   ATTACK
========================================================= */

function launchAttack(){

  const proj =
    sceneRef.add.circle(
      58,
      116,
      7,
      0xfacc15
    );


  sceneRef.tweens.add({

    targets:
      proj,

    x:
      348,

    y:
      136,

    duration:
      320,

    ease:
      'Quad.easeIn',


    onComplete:()=>{

      proj.destroy();


      sfxHit();


      enemyHP =
        Math.max(
          0,
          enemyHP - 1
        );


      if(enemyHpBar){

        enemyHpBar.width =
          70 *
          (enemyHP / 4);

      }


      enemyFlash =
        12;


      sceneRef.cameras.main.shake(
        150,
        0.012
      );


      /* -------------------------
         SPARKS
      ------------------------- */

      for(
        let i = 0;
        i < 7;
        i++
      ){

        const ang =
          (
            Math.PI * 2 / 7
          ) * i;


        const spark =
          sceneRef.add.circle(
            348,
            136,
            3,
            0xfacc15
          );


        sceneRef.tweens.add({

          targets:
            spark,

          x:
            348 +
            Math.cos(ang) * 30,

          y:
            136 +
            Math.sin(ang) * 30,

          alpha:
            0,

          duration:
            400,

          onComplete:()=>{

            spark.destroy();

          }

        });

      }


      /* -------------------------
         HIT TEXT
      ------------------------- */

      const dmg =
        sceneRef.add.text(
          348,
          116,
          'โดนแล้ว!',
          {

            fontFamily:
              'Kanit',

            fontSize:
              '14px',

            color:
              '#fde047',

            fontStyle:
              'bold'

          }
        ).setOrigin(
          0.5
        );


      sceneRef.tweens.add({

        targets:
          dmg,

        y:
          88,

        alpha:
          0,

        duration:
          600,

        onComplete:()=>{

          dmg.destroy();

        }

      });

    }

  });

}


/* =========================================================
   DEMO HERO
========================================================= */

function drawDemo(
  time,
  m
){

  heroG.clear();


  const cx = 56;

  const headY = 118;

  const shoulderY = 136;

  const hipY = 172;

  const armLen = 32;


  let leftDeg = 15;
  let rightDeg = 15;

  let shoulderOffY = 0;
  let headTilt = 0;


  const d =
    m.demo;


  const osc01 =
    (
      Math.sin(
        time * 0.0025
      ) + 1
    ) / 2;


  const oscPM =
    Math.sin(
      time * 0.0025
    );


  if(
    d.type === 'arms'
  ){

    const ang =
      d.neutral +
      (
        d.target -
        d.neutral
      ) *
      osc01;


    leftDeg =
      ang;

    rightDeg =
      ang;

  }


  else if(
    d.type === 'shrug'
  ){

    shoulderOffY =
      d.target *
      osc01;

  }


  else if(
    d.type === 'tilt'
  ){

    headTilt =
      d.target *
      oscPM;

  }


  const bob =
    Math.sin(
      time * 0.004
    ) * 2;


  const sY =
    shoulderY +
    shoulderOffY +
    bob;


  const headX =
    cx +
    headTilt * 0.7;


  const headY2 =
    headY +
    shoulderOffY +
    bob;


  /* =======================================================
     POWER EFFECT
  ======================================================= */

  if(active){

    const pulse =
      (
        Math.sin(
          time * 0.006
        ) + 1
      ) / 2;


    heroG.fillStyle(
      0xfacc15,
      0.12 +
      0.13 * pulse
    );


    heroG.fillCircle(
      cx,
      (headY2 + hipY) / 2,
      44 +
      6 * pulse
    );

  }


  /* =======================================================
     CAPE
  ======================================================= */

  heroG.fillStyle(
    0xdc2626,
    0.95
  );


  heroG.beginPath();

  heroG.moveTo(
    cx - 10,
    sY - 2
  );

  heroG.lineTo(
    cx + 10,
    sY - 2
  );

  heroG.lineTo(
    cx + 19,
    hipY + 12
  );

  heroG.lineTo(
    cx - 19,
    hipY + 12
  );

  heroG.closePath();

  heroG.fillPath();


  /* =======================================================
     LEGS
  ======================================================= */

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
    cx - 11,
    hipY + 30
  );

  heroG.strokePath();


  heroG.beginPath();

  heroG.moveTo(
    cx,
    hipY
  );

  heroG.lineTo(
    cx + 11,
    hipY + 30
  );

  heroG.strokePath();


  /* =======================================================
     BOOTS
  ======================================================= */

  heroG.fillStyle(
    0xb91c1c,
    1
  );


  heroG.fillRect(
    cx - 16,
    hipY + 27,
    10,
    8
  );


  heroG.fillRect(
    cx + 6,
    hipY + 27,
    10,
    8
  );


  /* =======================================================
     TORSO
  ======================================================= */

  heroG.fillStyle(
    0x2563eb,
    1
  );


  heroG.fillRoundedRect(
    cx - 12,
    sY,
    24,
    hipY - sY,
    6
  );


  heroG.lineStyle(
    2,
    0x0f172a,
    0.8
  );


  heroG.strokeRoundedRect(
    cx - 12,
    sY,
    24,
    hipY - sY,
    6
  );


  /* =======================================================
     EMBLEM
  ======================================================= */

  heroG.fillStyle(
    0xfacc15,
    1
  );


  heroG.fillCircle(
    cx,
    sY + 13,
    5
  );


  /* =======================================================
     ARMS
  ======================================================= */

  heroG.lineStyle(
    6,
    0x2563eb,
    1
  );


  [
    [-1, leftDeg],
    [1, rightDeg]
  ].forEach(
    ([sign,deg])=>{

      const rad =
        Phaser.Math.DegToRad(
          deg
        );


      const ex =
        cx +
        sign *
        Math.sin(rad) *
        armLen;


      const ey =
        sY +
        Math.cos(rad) *
        armLen;


      heroG.beginPath();


      heroG.moveTo(
        cx + sign * 10,
        sY + 4
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


  /* =======================================================
     HEAD
  ======================================================= */

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


  /* =======================================================
     MASK
  ======================================================= */

  heroG.fillStyle(
    0x1e3a8a,
    1
  );


  heroG.fillRect(
    headX - 9,
    headY2 - 3,
    18,
    5
  );


  /* =======================================================
     HAIR
  ======================================================= */

  heroG.fillStyle(
    0x0f172a,
    1
  );


  [-6,0,6].forEach(
    dx=>{

      heroG.beginPath();

      heroG.moveTo(
        headX + dx - 4,
        headY2 - 7
      );

      heroG.lineTo(
        headX + dx,
        headY2 - 15
      );

      heroG.lineTo(
        headX + dx + 4,
        headY2 - 7
      );

      heroG.closePath();

      heroG.fillPath();

    }
  );

}


/* =========================================================
   UPDATE
========================================================= */

function update(
  time,
  delta
){

  const m0 =
    missions[
      Math.min(
        missionIdx,
        missions.length - 1
      )
    ];


  /* -------------------------
     Mission counter
  ------------------------- */

  missionTxt.setText(
    'ภารกิจ ' +
    Math.min(
      missionIdx + 1,
      missions.length
    ) +
    '/' +
    missions.length
  );


  /* -------------------------
     Demo
  ------------------------- */

  drawDemo(
    time,
    m0
  );


  /* -------------------------
     Enemy
  ------------------------- */

  if(enemyFlash > 0){
    enemyFlash--;
  }


  drawEnemy(
    time
  );


  if(!active){
    return;
  }


  const m =
    missions[
      missionIdx
    ];


  if(!m){
    return;
  }


  instrTxt.setText(
    m.instr
  );


  const ok =
    m.check();


  /* =======================================================
     HOLD SYSTEM
  ======================================================= */

  if(ok){

    holdTime =
      Math.min(
        NEED,
        holdTime + delta
      );

  }else{

    /*
      หลุดท่าแล้วหลอดลดลง
      แต่ไม่ลดเร็วเกินไป
    */

    holdTime =
      Math.max(
        0,
        holdTime -
        delta * 1.15
      );

  }


  bar.width =
    (
      holdTime /
      NEED
    ) *
    (W - 40);


  bar.fillColor =
    ok
      ? 0x4ade80
      : 0xf59e0b;


  /* =======================================================
     SUCCESS
  ======================================================= */

  if(
    holdTime >= NEED
  ){

    succeedMission();

  }

}


/* =========================================================
   MISSION SUCCESS
========================================================= */

function succeedMission(){

  if(!active){
    return;
  }


  active = false;

  holdTime = 0;

  bar.width = 0;


  launchAttack();


  missionIdx++;


  crystalTxt.setText(
    '💎'.repeat(
      missionIdx
    )
  );


  setTimeout(
    ()=>{

      if(
        missionIdx >=
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

    },
    850
  );

}


/* =========================================================
   KO
========================================================= */

function showKO(){

  sfxKO();


  const flash =
    document.getElementById(
      'koFlash'
    );


  flash.style.animation =
    'none';


  void flash.offsetWidth;


  flash.style.animation =
    'flashOut .5s ease-out forwards';


  document.getElementById(
    'koOverlay'
  ).style.display =
    'flex';


  setTimeout(
    ()=>{

      document.getElementById(
        'koOverlay'
      ).style.display =
        'none';


      showVictory();

    },
    1500
  );

}


/* =========================================================
   STORY
========================================================= */

function showStory(
  text,
  isEnd
){

  document.getElementById(
    'storyText'
  ).textContent =
    text;


  document.getElementById(
    'storyBtn'
  ).textContent =
    '➤ ไปกันเลย!';


  document.getElementById(
    'storyOverlay'
  ).style.display =
    'flex';


  document.getElementById(
    'storyBtn'
  ).onclick =
    ()=>{

      sfxClick();


      document.getElementById(
        'storyOverlay'
      ).style.display =
        'none';


      startMission();

    };

}


/* =========================================================
   VICTORY
========================================================= */

function showVictory(){

  sfxVictory();


  document.getElementById(
    'victoryText'
  ).textContent =
    '🏆 จอมมารเมื่อยล้าพ่ายแพ้แล้ว! เจ้าคือฮีโร่พิชิตคอ บ่า ไหล่ตัวจริง เมืองปลอดภัยแล้วเพราะเจ้า!';


  document.getElementById(
    'victoryOverlay'
  ).style.display =
    'flex';


  document.getElementById(
    'victoryBtn'
  ).onclick =
    ()=>{

      sfxClick();


      document.getElementById(
        'victoryOverlay'
      ).style.display =
        'none';


      missionIdx = 0;

      holdTime = 0;

      baselineNeck = null;

      enemyHP = 4;

      enemyFlash = 0;


      if(crystalTxt){
        crystalTxt.setText('');
      }


      if(enemyHpBar){
        enemyHpBar.width = 70;
      }


      showStory(
        missions[0].story,
        false
      );

    };

}


/* =========================================================
   START MISSION
========================================================= */

function startMission(){

  holdTime = 0;

  if(bar){
    bar.width = 0;
  }


  /* =======================================================
     SHRUG MISSION
  ======================================================= */

  if(
    missionIdx === 2
  ){

    baselineNeck = null;

    active = false;


    instrTxt.setText(
      'ยืนตัวตรง ผ่อนคลายไหล่ อย่าขยับ กำลังวัดค่าเริ่มต้น...'
    );


    let samples = [];

    let n = 0;


    const sample =
      ()=>{

        const ls =
          kp('left_shoulder');

        const rs =
          kp('right_shoulder');

        const le =
          kp('left_ear');

        const re =
          kp('right_ear');


        /*
          เก็บเฉพาะ frame
          ที่ตรวจร่างกายได้ครบ
        */

        if(
          ls &&
          rs &&
          le &&
          re
        ){

          samples.push(

            (
              Math.hypot(
                ls.x - le.x,
                ls.y - le.y
              ) +

              Math.hypot(
                rs.x - re.x,
                rs.y - re.y
              )
            ) / 2

          );

        }


        n++;


        /*
          เก็บประมาณ 1.2 วินาที
        */

        if(
          n < 45
        ){

          requestAnimationFrame(
            sample
          );

          return;

        }


        /*
          ต้องมี sample อย่างน้อย 5 ค่า
        */

        if(
          samples.length >= 5
        ){

          baselineNeck =
            samples.reduce(
              (a,b)=>a+b,
              0
            ) /
            samples.length;


          active = true;

          instrTxt.setText(
            missions[
              missionIdx
            ].instr
          );

        }else{

          /*
            ถ้ากล้องจับตัวไม่ได้
            ให้ลองวัดใหม่
          */

          instrTxt.setText(
            'มองเห็นตัวไม่ชัด กำลังลองวัดใหม่...'
          );


          setTimeout(
            ()=>{
              startMission();
            },
            700
          );

        }

      };


    sample();


  }else{

    active = true;

  }

}


/* =========================================================
   START BUTTON
========================================================= */

document.getElementById(
  'startBtn'
).onclick =
  async()=>{

    const startBtn =
      document.getElementById(
        'startBtn'
      );

    const hint =
      document.getElementById(
        'hint'
      );


    startBtn.disabled =
      true;


    startBtn.textContent =
      '⏳ กำลังโหลด...';


    ensureAudio();


    hint.textContent =
      'กำลังเปิดกล้อง...';


    try{

      /* -------------------------
         Camera
      ------------------------- */

      await initCamera();


      hint.textContent =
        'กำลังโหลดระบบตรวจจับท่าทาง...';


      /* -------------------------
         MoveNet
      ------------------------- */

      await initDetector();


      /* -------------------------
         Detection loop
      ------------------------- */

      requestAnimationFrame(
        detectLoop
      );


      /* -------------------------
         Hide start
      ------------------------- */

      document.getElementById(
        'startOverlay'
      ).style.display =
        'none';


      /* ===================================================
         PHASER
      =================================================== */

      new Phaser.Game({

        type:
          Phaser.AUTO,

        width:
          W,

        height:
          H,

        transparent:
          true,

        parent:
          'phaser-container',

        render:{
          antialias:true,
          roundPixels:false
        },

        scale:{
          mode:
            Phaser.Scale.NONE
        },

        scene:{
          create,
          update
        }

      });


      /* ===================================================
         VS SCREEN
      =================================================== */

      document.getElementById(
        'vsOverlay'
      ).style.display =
        'flex';


      document.getElementById(
        'vsBtn'
      ).onclick =
        ()=>{

          sfxClick();


          document.getElementById(
            'vsOverlay'
          ).style.display =
            'none';


          showStory(
            missions[0].story,
            false
          );

        };


    }catch(e){

      console.error(
        'GAME START ERROR:',
        e
      );


      startBtn.disabled =
        false;


      startBtn.textContent =
        '▶ เริ่มเกม';


      hint.textContent =
        'เปิดกล้องไม่สำเร็จ กรุณาอนุญาตการใช้กล้องแล้วลองใหม่';

    }

  };