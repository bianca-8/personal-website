// Initialize 3D force graph
const Graph = ForceGraph3D()(document.getElementById("mindmap"))
  .graphData({
    nodes: [
  { id: "Bianca", group: 1, fx: 0, fy: 100, fz: 0},
  { id: "Projects", group: 2, fx: -50, fy: 50, fz: 0, img: 'linkedin.png' },
  { id: "Languages", group: 2, fx: 0, fy: 50, fz: 50, img: 'github.png' },
  { id: "Hackathons", group: 2, fx: 50, fy: 50, fz: 0, img: 'linkedin.png' },
  { id: "Hi", group: 2, fx: 25, fy: 75, fz: 50, img: 'linkedin.png' }
    ],
    links: [
      { source: "Bianca", target: "Projects" },
      { source: "Bianca", target: "Languages" },
      { source: "Bianca", target: "Hackathons" },
      { source: "Bianca", target: "Hi" }
    ]
  })
  .nodeAutoColorBy("group")
  .nodeLabel(node => node.id)
  .onNodeClick(node => {
    const distance = 40;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    Graph.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
      node,
      3000
    );
  });

Graph.linkColor(() => '#ffffff');
Graph.linkWidth(() => 1);
Graph.linkOpacity(() => 0.8); 

// ===================== TEXT SPRITE APPROACH (no FontLoader needed) =====================
function makeTextSprite(text, { fontFace='Arial', fontSize=120, color='#ffffff', background='transparent', padding=20 }={}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${fontSize}px ${fontFace}`;
  const textMetrics = ctx.measureText(text);
  const textWidth = Math.ceil(textMetrics.width) + padding*2;
  const textHeight = fontSize + padding*2;
  canvas.width = textWidth;
  canvas.height = textHeight;
  ctx.font = `bold ${fontSize}px ${fontFace}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if(background !== 'transparent') {
    ctx.fillStyle = background;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width/2, canvas.height/2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  const scaleFactor = 0.25;
  sprite.scale.set(canvas.width*scaleFactor, canvas.height*scaleFactor, 1);
  return sprite;
}

// THEME STATE FOR GRAPH/NODE COLORS (moved up so updateNodeObjects can reference safely)
let currentBiancaColor = '#ff3366';

// Procedural rounded box geometry (approximate fillet)
function createRoundedBoxGeometry(size, radius, segments = 4){
  radius = Math.min(radius, size/2 * 0.999);
  const half = size/2;
  const inner = half - radius;
  const seg = Math.max(1, segments);
  const geom = new THREE.BoxGeometry(size, size, size, seg*2, seg*2, seg*2);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  for(let i=0;i<pos.count;i++){
    v.fromBufferAttribute(pos, i);
    const ax = Math.abs(v.x), ay = Math.abs(v.y), az = Math.abs(v.z);
    if(ax <= inner && ay <= inner && az <= inner) continue; // inner cube untouched
    // Clamp to inner cube base corner
    const bx = Math.sign(v.x) * Math.min(ax, inner);
    const by = Math.sign(v.y) * Math.min(ay, inner);
    const bz = Math.sign(v.z) * Math.min(az, inner);
    // Direction from base corner
    const dx = v.x - bx;
    const dy = v.y - by;
    const dz = v.z - bz;
    const d = Math.hypot(dx,dy,dz) || 1;
    // Project onto sphere of radius at base corner
    const k = radius / d;
    v.set(bx + dx*k, by + dy*k, bz + dz*k);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

function updateNodeObjects(node) {
  if (node.id === "Bianca") {
    return makeTextSprite('Bianca', { fontFace:'Arial', fontSize:160, color: currentBiancaColor });
  }
  if (node.img) {
    const cache = (updateNodeObjects._texCache || (updateNodeObjects._texCache = {}));
    let tex = cache[node.img];
    if(!tex){ tex = new THREE.TextureLoader().load(node.img); cache[node.img] = tex; }
    const size = 14;
    const radius = size * 0.25; // moderate rounding (reduced from 0.42)
    const key = size+":"+radius;
    const gCache = (updateNodeObjects._geomCache || (updateNodeObjects._geomCache = {}));
    let geom = gCache[key];
    if(!geom){ geom = createRoundedBoxGeometry(size, radius, 5); gCache[key] = geom; }
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    return new THREE.Mesh(geom, mat);
  }
  return new THREE.Mesh(
    new THREE.SphereGeometry(5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
}
Graph.nodeThreeObject(updateNodeObjects);
// ==============================================================================

function setGraphTheme(mode){
  if(mode === 'blue'){
    Graph.backgroundColor('#0d1b2a');
    currentBiancaColor = '#66b2ff';
  } else {
    Graph.backgroundColor('#FEDCDB');
    currentBiancaColor = '#ff3366';
  }
  Graph.nodeThreeObject(updateNodeObjects);
  if(typeof Graph.refresh === 'function'){ Graph.refresh(); }
  requestAnimationFrame(()=>{ const c=document.querySelector('#mindmap canvas'); if(c) c.style.background = (mode==='blue'?'#0d1b2a':'#FEDCDB'); });
  console.log('Theme set', mode, 'nodes', Graph.graphData().nodes.map(n=>n.id));
}

// Initial theme setup (removed stray backtick)
setGraphTheme('light');

// ignite button
(function(){
const btn = document.getElementById('igniteBtn');
const overlay = document.getElementById('burn-overlay');
if(!btn || !overlay) return;

let spraying = false;
let coverageScore = 0;
let targetScore = 0;
let sprayLayer = null;
let drained = false;
let lastX = null, lastY = null;
const minDist = 60;
const DROP_RADIUS = 60;
const DROP_AREA = Math.PI * DROP_RADIUS * DROP_RADIUS;

function ensureFireLine(){
  if(!overlay.querySelector('.fire-line')){
    overlay.innerHTML = '<div class="char-mask"></div><div class="fire-line"></div>';
  }
}

function relPos(e){
  if(!sprayLayer){ return { x:e.clientX, y:e.clientY }; }
  const r = sprayLayer.getBoundingClientRect();
  return { x:e.clientX - r.left, y:e.clientY - r.top };
}

function startSprayMode(){
  if(spraying) return;
  spraying = true;
  if(!sprayLayer){
    sprayLayer = document.createElement('div');
    sprayLayer.id = 'spray-layer';
    sprayLayer.style.cursor = 'crosshair';
    document.body.appendChild(sprayLayer);
  }
  targetScore = window.innerWidth * window.innerHeight * 0.55;
  coverageScore = 0;
  btn.textContent = 'Spraying...';
}

function spawnBubble(container){
  const b = document.createElement('div');
  b.className = 'bubble';
  b.style.left = (Math.random()*window.innerWidth - 9) + 'px';
  container.appendChild(b);
  b.addEventListener('animationend', ()=> b.remove());
}

function drainWater(){
  if(drained) return; 
  drained = true;
  if(sprayLayer){
    sprayLayer.style.transition = 'opacity .4s';
    sprayLayer.style.opacity = '.3';
  }
  const drain = document.createElement('div');
  drain.id = 'water-drain';
  drain.style.zIndex = '1200';
  document.body.appendChild(drain);
  const bubbleInterval = setInterval(()=>{
    if(!document.body.contains(drain)) { clearInterval(bubbleInterval); return; }
    for(let i=0;i<3;i++) spawnBubble(drain);
  }, 260);
  drain.addEventListener('animationend', ()=>{
    clearInterval(bubbleInterval);
    if(sprayLayer){ sprayLayer.remove(); sprayLayer=null; }
    document.body.classList.remove('blue-theme');
    setGraphTheme('light');
    btn.textContent = 'Ignite Theme';
    coverageScore = 0; spraying=false; drained=false; drain.remove();
  }, { once:true });
}

function checkAutoDrain(){ if(!drained && spraying && coverageScore >= targetScore){ drainWater(); } }

function addDrop(x,y){
  if(!spraying) return;
  if(lastX !== null){
    const dx = x - lastX, dy = y - lastY; const dist = Math.hypot(dx,dy);
    if(dist < minDist) return; const steps = Math.floor(dist / minDist);
    for(let i=1;i<=steps;i++){ createDrop(lastX + dx*(i/steps), lastY + dy*(i/steps)); }
  } else { createDrop(x,y); }
  lastX = x; lastY = y; checkAutoDrain();
}

function createDrop(x,y){
  if(!sprayLayer) return; const d = document.createElement('div'); d.className = 'drop';
  d.style.left = (x - DROP_RADIUS) + 'px'; d.style.top  = (y - DROP_RADIUS) + 'px';
  sprayLayer.appendChild(d); coverageScore += DROP_AREA * 0.85;
}

btn.addEventListener('click', () => {
  const isBlue = document.body.classList.contains('blue-theme');
  if(!isBlue){
    // Ignite sequence
    ensureFireLine();
    overlay.classList.add('line-burning');
    overlay.addEventListener('animationend', () => {
      document.body.classList.add('blue-theme');
      setGraphTheme('blue');
      overlay.classList.remove('line-burning');
      overlay.innerHTML = '';
      btn.textContent = 'Spray'; // now user must click again to start spraying
    }, { once:true });
  } else if(isBlue && !spraying){
    startSprayMode(); // begin spraying only after explicit click in blue mode
  }
  // If already spraying, ignore further clicks.
});

// --- Spray interaction events (restored) ---
function handlePointerMove(e){ if(!spraying) return; const {x,y}=relPos(e); addDrop(x,y); }
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerdown', e=>{ if(!spraying) return; const {x,y}=relPos(e); addDrop(x,y); });
window.addEventListener('pointerup', ()=>{ lastX = lastY = null; });
window.addEventListener('pointerleave', ()=>{ lastX = lastY = null; });
// ------------------------------------------------
})();