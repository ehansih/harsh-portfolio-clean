// ─── SCROLL REVEAL ───────────────────────────────────────────────
const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll(
  '.pillar-card, .tl-item, .project-card, .contact-card, .section-head, .stats-strip, .hero-content, .principle-section'
).forEach(el => { el.classList.add('reveal'); revealObserver.observe(el); });

// ─── MOBILE NAV ───────────────────────────────────────────────────
const toggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
toggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  toggle?.setAttribute('aria-expanded', false);
}));

// ─── CONTACT FORM ────────────────────────────────────────────────
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending...';
  btn.disabled = true;
  try {
    const res = await fetch(form.action, {
      method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
    });
    status.textContent = res.ok ? "Message sent. I'll be in touch." : 'Something went wrong. Try emailing directly.';
    if (res.ok) form.reset();
  } catch {
    status.textContent = 'Network error. Try emailing directly.';
  } finally {
    btn.textContent = 'Send message';
    btn.disabled = false;
  }
});

// ─── 3D GLOBE ────────────────────────────────────────────────────
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = canvas.offsetWidth  || 480;
  const H = canvas.offsetHeight || 480;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.z = 3.6;

  const ACCENT = 0xd4ff6e;
  const RADIUS = 1;
  const globe  = new THREE.Group();
  scene.add(globe);

  // ── Wireframe lat/long lines ──
  const wireGeo = new THREE.SphereGeometry(RADIUS, 36, 36);
  const wireMat = new THREE.MeshBasicMaterial({
    color: ACCENT, wireframe: true, transparent: true, opacity: 0.04
  });
  globe.add(new THREE.Mesh(wireGeo, wireMat));

  // ── Solid inner glow sphere ──
  const innerGeo = new THREE.SphereGeometry(RADIUS * 0.97, 36, 36);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x0a1a0a, transparent: true, opacity: 0.55
  });
  globe.add(new THREE.Mesh(innerGeo, innerMat));

  // ── Fibonacci-distributed surface dots ──
  const DOT_COUNT = 500;
  const dotPositions = [];
  const goldenAngle  = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < DOT_COUNT; i++) {
    const y   = 1 - (i / (DOT_COUNT - 1)) * 2;
    const r   = Math.sqrt(1 - y * y);
    const phi = goldenAngle * i;
    dotPositions.push(r * Math.cos(phi) * RADIUS, y * RADIUS, r * Math.sin(phi) * RADIUS);
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
  const dotMat = new THREE.PointsMaterial({ color: ACCENT, size: 0.018, transparent: true, opacity: 0.8 });
  globe.add(new THREE.Points(dotGeo, dotMat));

  // ── Glowing halo ring ──
  const ringGeo = new THREE.RingGeometry(RADIUS * 1.02, RADIUS * 1.08, 80);
  const ringMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  globe.add(ring);

  // ── Animated arcs (signal transmissions between nodes) ──
  const arcGroup = new THREE.Group();
  globe.add(arcGroup);

  function randomOnSphere() {
    const u = Math.random(), v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi   = Math.acos(2 * v - 1);
    return new THREE.Vector3(
      RADIUS * Math.sin(phi) * Math.cos(theta),
      RADIUS * Math.cos(phi),
      RADIUS * Math.sin(phi) * Math.sin(theta)
    );
  }

  function buildArc(p1, p2, segments = 48) {
    const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(RADIUS * 1.28);
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push(
        new THREE.Vector3().lerpVectors(p1, mid, t).lerp(
          new THREE.Vector3().lerpVectors(mid, p2, t), t
        )
      );
    }
    return points;
  }

  const ARC_COUNT  = 8;
  const arcObjects = [];

  for (let i = 0; i < ARC_COUNT; i++) {
    const p1     = randomOnSphere();
    const p2     = randomOnSphere();
    const pts    = buildArc(p1, p2);
    const geo    = new THREE.BufferGeometry().setFromPoints(pts);
    const mat    = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 });
    const line   = new THREE.Line(geo, mat);
    arcGroup.add(line);

    // node dots at endpoints
    [p1, p2].forEach(p => {
      const ng  = new THREE.SphereGeometry(0.022, 8, 8);
      const nm  = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 });
      const dot = new THREE.Mesh(ng, nm);
      dot.position.copy(p);
      arcGroup.add(dot);
      arcObjects.push({ type: 'dot', mesh: dot, mat: nm });
    });

    arcObjects.push({
      type: 'arc', line, mat,
      phase:  Math.random() * Math.PI * 2,
      speed:  0.4 + Math.random() * 0.5,
      maxOp:  0.55 + Math.random() * 0.35
    });
  }

  // ── Outer atmosphere glow (sprite) ──
  const glowGeo = new THREE.SphereGeometry(RADIUS * 1.18, 36, 36);
  const glowMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.03, side: THREE.BackSide });
  globe.add(new THREE.Mesh(glowGeo, glowMat));

  // ── Mouse interaction ──
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  document.addEventListener('mousemove', e => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 0.7;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
  });

  // ── Resize ──
  const resizeObserver = new ResizeObserver(() => {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(canvas);

  // ── Animate ──
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t  = clock.getElapsedTime();

    // Smooth mouse follow
    currentX += (targetX - currentX) * 0.04;
    currentY += (targetY - currentY) * 0.04;

    globe.rotation.y = t * 0.12 + currentX;
    globe.rotation.x = currentY * 0.5;

    // Ring pulse
    ring.rotation.z = t * 0.08;
    ringMat.opacity  = 0.04 + Math.sin(t * 1.2) * 0.02;

    // Animate arcs
    arcObjects.forEach(obj => {
      if (obj.type !== 'arc') return;
      const o = (Math.sin(t * obj.speed + obj.phase) * 0.5 + 0.5);
      obj.mat.opacity = o * obj.maxOp;
    });
    // Sync dot opacity to paired arc
    let arcIdx = 0;
    arcObjects.forEach((obj, i) => {
      if (obj.type === 'dot') {
        const relatedArc = arcObjects.find((a, j) => a.type === 'arc' && j < i);
        if (relatedArc) obj.mat.opacity = relatedArc.mat.opacity * 1.4;
      }
    });

    renderer.render(scene, camera);
  }
  animate();
}

// Wait for Three.js to load
if (typeof THREE !== 'undefined') {
  initGlobe();
} else {
  document.querySelector('script[src*="three"]')?.addEventListener('load', initGlobe);
  window.addEventListener('load', () => {
    if (typeof THREE !== 'undefined') initGlobe();
  });
}
