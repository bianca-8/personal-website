// Initialize 3D force graph
const Graph = ForceGraph3D()(document.getElementById("mindmap"))
  .graphData({
    nodes: [
  { id: "Bianca", group: 1, fx: 0, fy: 100, fz: 0},
  { id: "Piano", group: 2, fx: -50, fy: 50, fz: -25, img: 'assets/piano.png' },
  { id: "Basketball", group: 2, fx: 0, fy: 50, fz: 50, img: 'assets/basketball.jpg' },
  { id: "Soccer", group: 2, fx: 50, fy: 50, fz: -15, img: 'assets/soccer.jpg' },
  { id: "code", group: 2, fx: -50, fy: 125, fz: 15, img: 'assets/code.jpg' },
  { id: "ib", group: 2, fx: 0, fy: 150, fz: -15, img: 'assets/ib.png' },
  { id: "uoft", group: 2, fx: 75, fy: 80, fz: -10, img: 'assets/uoft.png' },
  { id: "woss", group: 2, fx: 60, fy: 110, fz: 25, img: 'assets/woss.jpg' },
  { id: "deca", group: 2, fx: -100, fy: 70, fz: 0, img: 'assets/deca.png' },
  { id: "fblc", group: 2, fx: -60, fy: 60, fz: 50, img: 'assets/fblc.jpeg' },
  { id: "tu20", group: 2, fx: 30, fy: 40, fz: 0, img: 'assets/tu20.jpg' },
  { id: "cssc", group: 2, fx: 100, fy: 50, fz: 0, img: 'assets/cssc.png' },
  { id: "python", group: 2, fx: -70, fy: 100, fz: 0, img: 'assets/python.png' },
  { id: "java", group: 2, fx: 25, fy: 125, fz: 50, img: 'assets/java.png' },
  { id: "html", group: 2, fx: -20, fy: 110, fz: 75, img: 'assets/html.png' },
  { id: "css", group: 2, fx: 100, fy: 100, fz: 10, img: 'assets/css.png' },
  { id: "js", group: 2, fx: -25, fy: 20, fz: 50, img: 'assets/js.png' },
    ],
    links: [
      { source: "Bianca", target: "Piano" },
      { source: "Bianca", target: "Basketball" },
      { source: "Bianca", target: "Soccer" },
      { source: "Bianca", target: "code" },
      { source: "Bianca", target: "ib" },
      { source: "Bianca", target: "uoft" },
      { source: "Bianca", target: "woss" },
      { source: "Bianca", target: "deca" },
      { source: "Bianca", target: "fblc" },
      { source: "Bianca", target: "tu20" },
      { source: "Bianca", target: "cssc" },
      { source: "Bianca", target: "python" },
      { source: "Bianca", target: "java" },
      { source: "Bianca", target: "html" },
      { source: "Bianca", target: "css" },
      { source: "Bianca", target: "js" },
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
Graph.backgroundColor('rgba(0,0,0,0)');
try { Graph.renderer().setClearColor(0x000000, 0); } catch(e){}

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

(function setupBiancaPseudo3D(){
  function makeLayerTexture(color){
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 180;
    ctx.font = `900 ${fontSize}px Arial`;
    const w = ctx.measureText('Bianca').width + 120; const h = fontSize + 160;
    canvas.width = w; canvas.height = h;
    ctx.font = `900 ${fontSize}px Arial`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle = color; ctx.fillText('Bianca', w/2, h/2 + 10);
    const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true; return { tex, w, h };
  }
  window.buildBiancaMesh = function(){
    const baseColor = currentBiancaColor;
    const depthLayers = 60; // flat stack
    const gap = 0.8;        // spacing between layers
    const group = new THREE.Group();
    let baseTexInfo = makeLayerTexture(baseColor);
    const geom = new THREE.PlaneGeometry(baseTexInfo.w, baseTexInfo.h);

    for(let i=0;i<depthLayers;i++){
      const shade = 1 - (i/(depthLayers-1))*0.55; // keep depth shading
      const r = Math.max(0,Math.min(255, Math.round(parseInt(baseColor.slice(1,3),16)*shade)));
      const g = Math.max(0,Math.min(255, Math.round(parseInt(baseColor.slice(3,5),16)*shade)));
      const b = Math.max(0,Math.min(255, Math.round(parseInt(baseColor.slice(5,7),16)*shade)));
      const layerColor = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
      const { tex } = (i===0 ? baseTexInfo : makeLayerTexture(layerColor));
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent:true, side: THREE.DoubleSide, alphaTest:0.05, depthWrite:false });
      const layer = new THREE.Mesh(geom, mat);
      layer.position.z = - (i * gap);
      group.add(layer);
    }

    group.scale.set(0.15,0.15,0.15); // larger initial scale
    group.rotation.x = 0; // face straight on
    group.rotation.y = 0;
    group.name = 'BiancaPseudo3D';
    window._bianca3DMesh = group; 
    window._lastBiancaColor = baseColor;
  };
  buildBiancaMesh();
})();

function updateNodeObjects(node) {
  if (node.id === "Bianca") {
    if(window._bianca3DMesh){
      if(window._lastBiancaColor !== currentBiancaColor){ buildBiancaMesh(); }
      return window._bianca3DMesh; 
    }
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

function setGraphTheme(mode){
  if(mode === 'blue'){
    document.body.classList.add('blue-theme');
    currentBiancaColor = '#66b2ff';
  } else {
    document.body.classList.remove('blue-theme');
    currentBiancaColor = '#ff3366';
  }
  Graph.nodeThreeObject(updateNodeObjects);
  if(typeof Graph.refresh === 'function'){ Graph.refresh(); }
  console.log('Theme set', mode, 'nodes', Graph.graphData().nodes.map(n=>n.id));
}

// Initial theme setup (removed stray backtick)
setGraphTheme('light');

// ==============================================================================

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

// =============== Valentine Hearts (only Feb 14) ===============
(function initValentineHearts(){
  const today = new Date();
  if(!(today.getMonth() === 1 && today.getDate() === 14)) return; // Only Feb 14
  const container = document.getElementById('hearts-bg');
  const mindmap = document.getElementById('mindmap');
  if(!container || !mindmap || container.dataset.heartsInit) return;
  container.dataset.heartsInit = '1';
  const MAX = 80;
  function positionHeart(h){
    const mmRect = mindmap.getBoundingClientRect();
    const baseline = mmRect.bottom;
    h.style.left = (mmRect.left + Math.random()*mmRect.width) + 'px';
    h.style.top = baseline + 'px';
    h.style.visibility='hidden';
    container.appendChild(h);
    const rect = h.getBoundingClientRect();
    h.style.top = (baseline - rect.height) + 'px';
    h.style.visibility='visible';
    const rise = baseline + 60;
    h.style.setProperty('--rise', rise + 'px');
  }
  function makeHeart(){
    const h = document.createElement('div');
    h.className='heart';
    const size = 12 + Math.random()*20;
    h.style.setProperty('--h', size + 'px');
    h.style.width = h.style.height = size + 'px';
    h.style.setProperty('--s', (0.6 + Math.random()*0.9).toFixed(2));
    const dur = 18 + Math.random()*16; // 18-34s
    h.style.animationDuration = dur + 's';
    h.style.animationDelay = (-Math.random()*dur) + 's';
    positionHeart(h);
    h.addEventListener('animationend', ()=> h.remove());
  }
  function spawn(){
    const need = MAX - container.children.length;
    if(need > 0){
      const batch = Math.min(4, need);
      for(let i=0;i<batch;i++) makeHeart();
    }
    requestAnimationFrame(()=>setTimeout(spawn, 1400));
  }
  
  window.addEventListener('resize', ()=>{
    const mmRect = mindmap.getBoundingClientRect();
    [...container.children].forEach(h=>{
      const baseline = mmRect.bottom;
      h.style.left = (mmRect.left + Math.random()*mmRect.width) + 'px';
      const rect = h.getBoundingClientRect();
      h.style.top = (baseline - rect.height) + 'px';
      const rise = baseline + 60;
      h.style.setProperty('--rise', rise + 'px');
    });
  });
  spawn();
  
  // Simple status text scrolling
  function initStatusScrolling() {
    const statusText = document.getElementById('status-text');
    const container = document.getElementById('status-text-container');
    let animationFrame;
    let startTime;
    let isHovered = false;
    
    function scrollText() {
      const now = Date.now();
      const elapsed = startTime ? now - startTime : 0;
      const cycleTime = 8000; // 8 seconds per full cycle
      const progress = (elapsed % cycleTime) / cycleTime;
      
      const textWidth = statusText.scrollWidth;
      const containerWidth = container.offsetWidth;
      
      if (textWidth <= containerWidth || isHovered) {
        statusText.style.transform = 'translateX(0)';
      } else {
        const scrollDistance = textWidth - containerWidth;
        let position;
        
        if (progress < 0.25) {
          // First pause
          position = 0;
        } else if (progress < 0.5) {
          // Scroll right
          position = (progress - 0.25) * 4 * scrollDistance;
        } else if (progress < 0.75) {
          // Pause at end
          position = scrollDistance;
        } else {
          // Scroll back
          position = (1 - (progress - 0.75) * 4) * scrollDistance;
        }
        
        statusText.style.transform = `translateX(-${position}px)`;
      }
      
      if (!isHovered) {
        animationFrame = requestAnimationFrame(scrollText);
      }
    }
    
    function startScrolling() {
      if (!animationFrame) {
        startTime = Date.now();
        scrollText();
      }
    }
    
    // Event listeners
    container.addEventListener('mouseenter', () => {
      isHovered = true;
      statusText.style.transform = 'translateX(0)';
    });
    
    container.addEventListener('mouseleave', () => {
      isHovered = false;
      startScrolling();
    });
    
    // Initialize
    startScrolling();
    
    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(startScrolling, 100);
    });
  }
  
  // Initialize status text scrolling with precise control
  function initStatusScrolling() {
    const statusText = document.getElementById('status-text');
    const wrapper = document.getElementById('status-text-wrapper');
    const container = document.getElementById('status-text-container');
    
    function updateScroll() {
      const textWidth = statusText.offsetWidth;
      const containerWidth = container.offsetWidth;
      
      if (textWidth > containerWidth) {
        // Calculate the exact scroll distance needed
        const scrollDistance = textWidth - containerWidth;
        const duration = Math.max(5, scrollDistance / 30); // Adjust speed factor as needed
        
        const keyframes = `
          @keyframes scrollText {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${scrollDistance}px); }
          }
          
          #status-text-wrapper {
            animation: scrollText ${duration}s linear infinite;
            padding-right: 20px; /* Add some space at the end */
          }
        `;
        
        // Remove old style if exists
        const oldStyle = document.getElementById('scroll-animation-style');
        if (oldStyle) oldStyle.remove();
        
        // Add new style
        const style = document.createElement('style');
        style.id = 'scroll-animation-style';
        style.textContent = keyframes;
        document.head.appendChild(style);
        
        // Ensure wrapper is visible and properly sized
        wrapper.style.display = 'inline-block';
        wrapper.style.whiteSpace = 'nowrap';
      } else {
        // If text fits, make sure it's not scrolling
        wrapper.style.animation = 'none';
        wrapper.style.transform = 'translateX(0)';
      }
    }
    
    // Initial setup
    updateScroll();
    
    // Handle hover
    container.addEventListener('mouseenter', () => {
      wrapper.style.animationPlayState = 'paused';
    });
    
    container.addEventListener('mouseleave', () => {
      wrapper.style.animationPlayState = 'running';
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateScroll, 100);
    });
  }
  
  // Start when the page loads
  window.addEventListener('load', initStatusScrolling);
})();