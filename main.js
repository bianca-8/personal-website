// Initialize 3D force graph
const Graph = ForceGraph3D()(document.getElementById("mindmap"))
  .graphData({
    nodes: [
  { id: "Me", group: 1, fx: 0, fy: 100, fz: 0, img: 'github.png' },
  { id: "Projects", group: 2, fx: -50, fy: 50, fz: 0, img: 'linkedin.png' },
  { id: "Languages", group: 2, fx: 0, fy: 50, fz: 50, img: 'github.png' },
  { id: "Hackathons", group: 2, fx: 50, fy: 50, fz: 0, img: 'linkedin.png' }
    ],
    links: [
      { source: "Me", target: "Projects" },
      { source: "Me", target: "Languages" },
      { source: "Me", target: "Hackathons" }
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

// Example: function to dynamically add nodes
function addNode(id, group, parentId) {
  const data = Graph.graphData();
  data.nodes.push({ id, group });
  data.links.push({ source: parentId, target: id });
  Graph.graphData(data);
}

Graph.backgroundColor('#FEDCDB');

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
  spraying = true;
  if(!sprayLayer){
    sprayLayer = document.createElement('div');
    sprayLayer.id = 'spray-layer';
    document.body.appendChild(sprayLayer);
  }
  targetScore = window.innerWidth * window.innerHeight * 0.55;
  coverageScore = 0;
  btn.textContent = 'Extinguish';
}

function spawnBubble(container){
  const b = document.createElement('div');
  b.className = 'bubble';
  b.style.left = (Math.random()*window.innerWidth - 9) + 'px';
  container.appendChild(b);
  b.addEventListener('animationend', ()=> b.remove());
}

function drainWater(){
  if(drained) return; drained = true;
  if(sprayLayer){ sprayLayer.style.transition = 'opacity .4s'; sprayLayer.style.opacity = '.3'; }
  const drain = document.createElement('div');
  drain.id = 'water-drain'; drain.style.zIndex = '1200';
  document.body.appendChild(drain);
  const bubbleInterval = setInterval(()=>{ if(!document.body.contains(drain)) { clearInterval(bubbleInterval); return;} for(let i=0;i<3;i++) spawnBubble(drain); }, 260);
  drain.addEventListener('animationend', ()=>{
    clearInterval(bubbleInterval);
    if(sprayLayer){ sprayLayer.remove(); sprayLayer=null; }
    document.body.classList.remove('blue-theme');
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
  if(!isBlue && !spraying){
    ensureFireLine();
    overlay.classList.add('line-burning');
    overlay.addEventListener('animationend', () => {
      document.body.classList.add('blue-theme');
      overlay.classList.remove('line-burning');
      overlay.innerHTML = ''; // remove black mask so blue shows fully
      btn.textContent = 'Spray';
    }, { once:true });
  } else if(isBlue && !spraying && !drained){
    startSprayMode();
  } else if(isBlue && spraying && !drained){
    drainWater();
  }
});


window.addEventListener('pointermove', e => { if(!spraying) return; const {x,y} = relPos(e); addDrop(x,y); });
window.addEventListener('pointerleave', ()=> { lastX = lastY = null; });
})();