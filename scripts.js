// ─── State ───
let herbs = [];
let activeFilter = 'all';
let searchQuery = '';
let activeScene = null;
let heroScene = null;

// ─── Glossary Data ───
const glossaryTerms = [
  { term: 'Adaptogen', category: 'Category', def: 'Herbs that help the body resist stress, anxiety, and fatigue.' },
  { term: 'Rasayana', category: 'Ayurveda', def: 'Rejuvenating therapies aimed at promoting longevity and vitality.' },
  { term: 'Dosha', category: 'Ayurveda', def: 'Three biological energies (Vata, Pitta, Kapha) governing health.' },
  { term: 'Dravyaguna', category: 'Ayurveda', def: 'The science of herbal properties, actions, and therapeutic uses.' },
  { term: 'Unani', category: 'System', def: 'Greek-Arabic medical system using natural remedies and four humors.' },
  { term: 'Siddha', category: 'System', def: 'Ancient Tamil system of medicine with 18 powerful spiritual siddhas.' },
  { term: 'Vulnerary', category: 'Category', def: 'Plants that promote healing of wounds and skin conditions.' },
  { term: 'Nootropic', category: 'Category', def: 'Substances enhancing cognitive function, memory, and creativity.' },
  { term: 'Decoction', category: 'Preparation', def: 'Medicinal preparation made by boiling herbs in water.' },
  { term: 'Tincture', category: 'Preparation', def: 'Herbal extract preserved in alcohol for concentrated effect.' },
  { term: 'Churna', category: 'Preparation', def: 'Ayurvedic medicinal powder made from dried herbs.' },
  { term: 'Kashaya', category: 'Preparation', def: 'Herbal decoction or astringent preparation in Ayurveda.' },
];

// ─── Load Data ───
async function loadHerbs() {
  try {
    const res = await fetch('herbs.json');
    herbs = await res.json();
    renderGrid();
    renderGlossary();
    initHeroScene();
  } catch (e) {
    console.error('Failed to load herbs.json', e);
  }
}

// ─── Render Grid ───
function renderGrid() {
  const grid = document.getElementById('plant-grid');
  const noResults = document.getElementById('no-results');
  const filtered = getFiltered();

  grid.innerHTML = '';
  noResults.classList.toggle('hidden', filtered.length > 0);

  filtered.forEach((herb, i) => {
    const card = document.createElement('div');
    card.className = 'plant-card';
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <div class="card-visual" style="background: linear-gradient(135deg, ${herb.accent}44 0%, ${herb.color}22 100%);">
        <div class="card-canvas-wrap" id="canvas-${herb.id}"></div>
        <div class="card-emoji-fallback">${herb.emoji}</div>
        <span class="card-category">${herb.category}</span>
      </div>
      <div class="card-body">
        <h3 class="card-name">${herb.name}</h3>
        <p class="card-botanical"><em>${herb.botanicalName}</em></p>
        <div class="card-tags">
          ${herb.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}
        </div>
        <p class="card-excerpt">${herb.desc}</p>
        <div class="card-cta">
          <span class="card-cta-text">Explore Plant</span>
          <span class="card-arrow">→</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openModal(herb));
    grid.appendChild(card);

    // Small 3D scene on each card
    setTimeout(() => initCardScene(herb), i * 80);
  });
}

// ─── Filtering Logic ───
function getFiltered() {
  return herbs.filter(h => {
    const matchFilter = activeFilter === 'all' || h.system.includes(activeFilter);
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      h.name.toLowerCase().includes(q) ||
      h.botanicalName.toLowerCase().includes(q) ||
      h.tags.some(t => t.toLowerCase().includes(q)) ||
      h.medicinalUses.toLowerCase().includes(q) ||
      h.category.toLowerCase().includes(q) ||
      h.system.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
}

function filterPlants() {
  searchQuery = document.getElementById('search-bar').value;
  document.getElementById('clear-btn').classList.toggle('hidden', !searchQuery);
  renderGrid();
}

function clearSearch() {
  document.getElementById('search-bar').value = '';
  searchQuery = '';
  document.getElementById('clear-btn').classList.add('hidden');
  renderGrid();
}

function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderGrid();
}

// ─── Three.js: Card Mini Scene ───
function initCardScene(herb) {
  const wrap = document.getElementById(`canvas-${herb.id}`);
  if (!wrap || wrap.dataset.initialized) return;
  wrap.dataset.initialized = 'true';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  wrap.appendChild(renderer.domElement);

  // Ambient light
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(3, 5, 3);
  scene.add(dirLight);

  // Create organic plant-like shape
  const group = new THREE.Group();
  const color = new THREE.Color(herb.color);
  const accentColor = new THREE.Color(herb.accent);

  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.04, 0.07, 1.4, 8);
  const stemMat = new THREE.MeshPhongMaterial({ color: new THREE.Color('#5a8a3a'), shininess: 40 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = -0.2;
  group.add(stem);

  // Leaves
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const height = -0.4 + i * 0.22;
    const leafGeo = new THREE.SphereGeometry(0.22, 8, 6);
    leafGeo.scale(1, 0.55, 0.3);
    const leafMat = new THREE.MeshPhongMaterial({
      color: i % 2 === 0 ? color : accentColor,
      shininess: 60,
      transparent: true,
      opacity: 0.92
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(angle) * 0.45, height, Math.sin(angle) * 0.2);
    leaf.rotation.z = Math.cos(angle) * 0.5;
    leaf.rotation.y = angle;
    group.add(leaf);
  }

  // Top flower/bud
  const budGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const budMat = new THREE.MeshPhongMaterial({ color: accentColor, shininess: 80 });
  const bud = new THREE.Mesh(budGeo, budMat);
  bud.position.y = 0.82;
  group.add(bud);

  scene.add(group);
  camera.position.set(0, 0.4, 3.2);
  camera.lookAt(0, 0.2, 0);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.012;
    group.rotation.y += 0.008;
    group.position.y = Math.sin(t) * 0.04;
    renderer.render(scene, camera);
  }
  animate();
}

// ─── Three.js: Hero Scene ───
function initHeroScene() {
  const wrap = document.getElementById('hero-canvas-wrap');
  if (!wrap) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(320, 320);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  wrap.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight.position.set(4, 6, 4);
  scene.add(dirLight);
  const backLight = new THREE.DirectionalLight(0x90e0a0, 0.6);
  backLight.position.set(-3, -2, -3);
  scene.add(backLight);

  const group = new THREE.Group();

  // Large central plant
  const stemGeo = new THREE.CylinderGeometry(0.05, 0.1, 2.2, 10);
  const stemMat = new THREE.MeshPhongMaterial({ color: 0x3d7a2a });
  group.add(Object.assign(new THREE.Mesh(stemGeo, stemMat), { position: new THREE.Vector3(0, -0.2, 0) }));

  const leafColors = [0x4a7c40, 0x2d6a4f, 0x7fb069, 0x52796f, 0x95d5b2];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + i * 0.3;
    const h = -0.7 + i * 0.2;
    const geo = new THREE.SphereGeometry(0.28, 8, 6);
    geo.scale(1.2, 0.5, 0.35);
    const mat = new THREE.MeshPhongMaterial({ color: leafColors[i % leafColors.length], shininess: 50, transparent: true, opacity: 0.9 });
    const leaf = new THREE.Mesh(geo, mat);
    leaf.position.set(Math.cos(angle) * 0.65, h, Math.sin(angle) * 0.3);
    leaf.rotation.y = angle;
    leaf.rotation.z = Math.sin(angle + 1) * 0.4;
    group.add(leaf);
  }

  // Golden flower top
  for (let p = 0; p < 6; p++) {
    const pAngle = (p / 6) * Math.PI * 2;
    const pGeo = new THREE.SphereGeometry(0.14, 8, 8);
    pGeo.scale(1, 0.6, 0.6);
    const pMat = new THREE.MeshPhongMaterial({ color: 0xe9c46a, shininess: 100 });
    const petal = new THREE.Mesh(pGeo, pMat);
    petal.position.set(Math.cos(pAngle) * 0.24, 1.1, Math.sin(pAngle) * 0.24);
    group.add(petal);
  }
  const centerGeo = new THREE.SphereGeometry(0.16, 12, 12);
  const centerMat = new THREE.MeshPhongMaterial({ color: 0xf4a261, shininess: 120 });
  const center = new THREE.Mesh(centerGeo, centerMat);
  center.position.set(0, 1.16, 0);
  group.add(center);

  // Floating dots
  for (let d = 0; d < 8; d++) {
    const dGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const dMat = new THREE.MeshPhongMaterial({ color: 0xb7e4c7, transparent: true, opacity: 0.7 });
    const dot = new THREE.Mesh(dGeo, dMat);
    dot.position.set(
      (Math.random() - 0.5) * 2.4,
      (Math.random() - 0.5) * 2.4,
      (Math.random() - 0.5) * 0.5
    );
    dot.userData.floatOffset = Math.random() * Math.PI * 2;
    group.add(dot);
  }

  scene.add(group);
  camera.position.set(0, 0.4, 5.5);
  camera.lookAt(0, 0.3, 0);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.01;
    group.rotation.y += 0.005;
    group.children.forEach(child => {
      if (child.userData.floatOffset !== undefined) {
        child.position.y += Math.sin(t + child.userData.floatOffset) * 0.003;
      }
    });
    renderer.render(scene, camera);
  }
  animate();
}

// ─── Three.js: Modal Scene ───
let modalRenderer = null;
let modalAnimId = null;

function initModalScene(herb) {
  const wrap = document.getElementById('modal-3d-container');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (modalAnimId) cancelAnimationFrame(modalAnimId);
  if (modalRenderer) modalRenderer.dispose();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(herb.accent + '33');
  const camera = new THREE.PerspectiveCamera(50, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
  modalRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  modalRenderer.setSize(wrap.clientWidth, wrap.clientHeight || 220);
  modalRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  wrap.appendChild(modalRenderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const d1 = new THREE.DirectionalLight(0xffffff, 1.4); d1.position.set(3, 6, 3); scene.add(d1);
  const d2 = new THREE.DirectionalLight(new THREE.Color(herb.accent), 0.8); d2.position.set(-3, -2, -2); scene.add(d2);

  const group = new THREE.Group();
  const baseColor = new THREE.Color(herb.color);
  const accentColor = new THREE.Color(herb.accent);

  // Pot
  const potGeo = new THREE.CylinderGeometry(0.5, 0.35, 0.55, 16);
  const potMat = new THREE.MeshPhongMaterial({ color: 0xc97a4a, shininess: 60 });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = -1.2;
  group.add(pot);

  // Soil
  const soilGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 16);
  const soilMat = new THREE.MeshPhongMaterial({ color: 0x5c3d1a });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = -0.93;
  group.add(soil);

  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.055, 0.085, 1.8, 10);
  const stemMat = new THREE.MeshPhongMaterial({ color: 0x4a8a2a });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = -0.05;
  group.add(stem);

  // Leaves
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const h = -0.5 + i * 0.18;
    const size = 0.22 + Math.sin(i) * 0.07;
    const geo = new THREE.SphereGeometry(size, 8, 6);
    geo.scale(1.3, 0.5, 0.35);
    const mat = new THREE.MeshPhongMaterial({ color: i % 3 === 0 ? accentColor : baseColor, shininess: 55 });
    const leaf = new THREE.Mesh(geo, mat);
    leaf.position.set(Math.cos(ang) * 0.55, h, Math.sin(ang) * 0.22);
    leaf.rotation.y = ang; leaf.rotation.z = Math.cos(ang) * 0.45;
    group.add(leaf);
  }

  // Flower
  for (let p = 0; p < 7; p++) {
    const pa = (p / 7) * Math.PI * 2;
    const pGeo = new THREE.SphereGeometry(0.13, 8, 8);
    pGeo.scale(1.1, 0.55, 0.55);
    const pMat = new THREE.MeshPhongMaterial({ color: accentColor, shininess: 110 });
    const petal = new THREE.Mesh(pGeo, pMat);
    petal.position.set(Math.cos(pa) * 0.22, 0.88, Math.sin(pa) * 0.22);
    group.add(petal);
  }
  const cGeo = new THREE.SphereGeometry(0.14, 12, 12);
  const cMat = new THREE.MeshPhongMaterial({ color: 0xf4d35e, shininess: 140 });
  const c = new THREE.Mesh(cGeo, cMat);
  c.position.y = 0.93; group.add(c);

  scene.add(group);
  camera.position.set(0, 0, 4.5);
  camera.lookAt(0, 0, 0);

  let t = 0;
  function animate() {
    modalAnimId = requestAnimationFrame(animate);
    t += 0.01;
    group.rotation.y += 0.007;
    group.position.y = Math.sin(t * 0.8) * 0.05;
    modalRenderer.render(scene, camera);
  }
  animate();
}

// ─── Modal ───
function openModal(herb) {
  const modal = document.getElementById('plant-modal');
  const box = document.getElementById('modal-box');

  // Set hero background
  document.getElementById('modal-hero').style.background =
    `linear-gradient(135deg, ${herb.accent}33 0%, ${herb.color}18 100%)`;

  // Fill data
  document.getElementById('m-emoji').textContent = herb.emoji;
  document.getElementById('m-name').textContent = herb.name;
  document.getElementById('m-botanical').textContent = herb.botanicalName;
  document.getElementById('m-desc').textContent = herb.desc;
  document.getElementById('m-tags').innerHTML = herb.tags.map(t =>
    `<span class="modal-tag">${t}</span>`).join('');
  document.getElementById('m-habitat').textContent = herb.habitat;
  document.getElementById('m-system').textContent = herb.system;
  document.getElementById('m-parts').textContent = herb.parts;
  document.getElementById('m-cultivation').textContent = herb.cultivation;
  document.getElementById('m-uses').textContent = herb.medicinalUses;
  document.getElementById('m-common-names').innerHTML = herb.commonNames.map(n =>
    `<span class="name-badge">${n}</span>`).join('');

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Init 3D after layout
  setTimeout(() => initModalScene(herb), 60);
}

function closeModal() {
  document.getElementById('plant-modal').classList.add('hidden');
  document.body.style.overflow = '';
  if (modalAnimId) cancelAnimationFrame(modalAnimId);
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('plant-modal')) closeModal();
}

// ─── Glossary ───
function renderGlossary() {
  const grid = document.getElementById('glossary-grid');
  grid.innerHTML = glossaryTerms.map(g => `
    <div class="glossary-item">
      <div class="g-term">${g.term}</div>
      <div class="g-category">${g.category}</div>
      <div class="g-def">${g.def}</div>
    </div>
  `).join('');
}

// ─── Mobile Menu ───
function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('hidden');
}

// ─── Header scroll effect ───
window.addEventListener('scroll', () => {
  const header = document.getElementById('site-header');
  header.style.boxShadow = window.scrollY > 20
    ? '0 4px 20px rgba(0,0,0,0.08)'
    : 'none';
});

// ─── Keyboard ───
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ─── Init ───
loadHerbs();
