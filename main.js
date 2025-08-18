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

  Graph.nodeThreeObject(node => {
  if (node.img) {
    const texture = new THREE.TextureLoader().load(node.img);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(12, 12, 1);
    return sprite;
  } else {
    // Fallback: a small colored sphere
    const geometry = new THREE.SphereGeometry(5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    return new THREE.Mesh(geometry, material);
  }
})

  .nodeAutoColorBy("group")
  .nodeLabel(node => node.id)
  .onNodeClick(node => {
    // Smooth camera transition to clicked node
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
  // redraw after resize
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
  const scaleFactor = 0.25; // adjust sizing in scene
  sprite.scale.set(canvas.width*scaleFactor, canvas.height*scaleFactor, 1);
  return sprite;
}

function updateNodeObjects(node) {
  if (node.id === "Bianca") {
    return makeTextSprite('Bianca', { fontFace:'Arial', fontSize:160, color: currentBiancaColor });
  }

  if (node.img) {
    const texture = new THREE.TextureLoader().load(node.img);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(12, 12, 1);
    return sprite;
  }

  return new THREE.Mesh(
    new THREE.SphereGeometry(5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
}
// Re-register custom node object builder with sprite text logic
Graph.nodeThreeObject(updateNodeObjects);
// ==============================================================================

// THEME STATE FOR GRAPH/NODE COLORS
let currentBiancaColor = '#ff3366';
function setGraphTheme(mode){
  if(mode === 'blue'){
    Graph.backgroundColor('#0d1b2a');
    currentBiancaColor = '#66b2ff';
  } else {
    Graph.backgroundColor('#FEDCDB');
    currentBiancaColor = '#ff3366';
  }
  // refresh node visuals
  Graph.nodeThreeObject(updateNodeObjects);
  if(typeof Graph.refresh === 'function'){ Graph.refresh(); }
  // also ensure canvas element reflects color if library doesn't
  requestAnimationFrame(()=>{ const c=document.querySelector('#mindmap canvas'); if(c) c.style.background = (mode==='blue'?'#0d1b2a':'#FEDCDB'); });
}

// Initial theme setup`
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