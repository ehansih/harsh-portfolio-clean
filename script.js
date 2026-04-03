/* ═══════════════════════════════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════════════════════════════ */
(function () {
  const dot   = document.getElementById('cursor-dot');
  const ring  = document.getElementById('cursor-ring');
  const click = document.getElementById('cursor-click');
  if (!dot || !ring) return;

  let mx = -200, my = -200;
  let rx = -200, ry = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    click.style.left = mx + 'px';
    click.style.top  = my + 'px';
  });

  // Ring lags behind with lerp
  function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  // Hover state on interactive elements
  const interactors = 'a, button, input, textarea, .project-card, .pillar-card, .tag';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactors)) ring.classList.add('hovered');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactors)) ring.classList.remove('hovered');
  });

  // Click pulse
  document.addEventListener('mousedown', () => ring.classList.add('clicking'));
  document.addEventListener('mouseup',   () => ring.classList.remove('clicking'));
  document.addEventListener('click', () => {
    click.classList.remove('pop');
    void click.offsetWidth; // reflow to restart animation
    click.classList.add('pop');
  });
})();


/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════════════════ */
const revealObs = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll(
  '.pillar-card, .tl-item, .project-card, .contact-card, .section-head, .stats-strip, .hero-content, .principle-section, .footer'
).forEach(el => { el.classList.add('reveal'); revealObs.observe(el); });


/* ═══════════════════════════════════════════════════════════════
   MOBILE NAV
═══════════════════════════════════════════════════════════════ */
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');
navToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', false);
}));


/* ═══════════════════════════════════════════════════════════════
   CONTACT FORM
═══════════════════════════════════════════════════════════════ */
const form   = document.getElementById('contact-form');
const status = document.getElementById('form-status');
form?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Sending...';
  btn.disabled = true;
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    status.textContent = res.ok ? "Message sent. I'll be in touch." : 'Something went wrong. Try emailing directly.';
    if (res.ok) form.reset();
  } catch {
    status.textContent = 'Network error. Try emailing directly.';
  } finally {
    btn.textContent = 'Send message';
    btn.disabled = false;
  }
});


/* ═══════════════════════════════════════════════════════════════
   THREE.JS — FULL-PAGE BACKGROUND NETWORK + HERO GLOBE
═══════════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  if (typeof THREE === 'undefined') return;

  const ACCENT     = 0xd4ff6e;
  const ACCENT_HEX = '#d4ff6e';

  /* ──────────────────────────────────────────
     FULL-PAGE BACKGROUND NETWORK SCENE
  ────────────────────────────────────────── */
  (function initBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.z = 50;

    // ── 200 floating nodes in 3D space ──
    const NODE_COUNT = 180;
    const nodePos    = [];
    const nodeVel    = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodePos.push(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 60
      );
      nodeVel.push(
        (Math.random() - 0.5) * 0.012,
        (Math.random() - 0.5) * 0.008,
        (Math.random() - 0.5) * 0.006
      );
    }

    // ── Point cloud ──
    const ptGeo = new THREE.BufferGeometry();
    const ptArr = new Float32Array(nodePos);
    ptGeo.setAttribute('position', new THREE.BufferAttribute(ptArr, 3));
    const ptMat = new THREE.PointsMaterial({ color: ACCENT, size: 0.35, transparent: true, opacity: 0.45 });
    scene.add(new THREE.Points(ptGeo, ptMat));

    // ── Build edges between nearby nodes ──
    const THRESHOLD = 28;
    const edgeVerts  = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = nodePos[i*3]   - nodePos[j*3];
        const dy = nodePos[i*3+1] - nodePos[j*3+1];
        const dz = nodePos[i*3+2] - nodePos[j*3+2];
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < THRESHOLD) {
          edgeVerts.push(
            nodePos[i*3], nodePos[i*3+1], nodePos[i*3+2],
            nodePos[j*3], nodePos[j*3+1], nodePos[j*3+2]
          );
        }
      }
    }
    const edgeGeo = new THREE.BufferGeometry();
    const edgeArr = new Float32Array(edgeVerts);
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgeArr, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.06 });
    scene.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // ── Parallax mouse ──
    let tgtX = 0, tgtY = 0, curX = 0, curY = 0;
    document.addEventListener('mousemove', e => {
      tgtX = (e.clientX / window.innerWidth  - 0.5) * 8;
      tgtY = (e.clientY / window.innerHeight - 0.5) * 5;
    });

    // ── Scroll-driven camera depth ──
    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    const clock = new THREE.Clock();
    function animBG() {
      requestAnimationFrame(animBG);
      const t = clock.getElapsedTime();

      // Drift nodes
      for (let i = 0; i < NODE_COUNT; i++) {
        nodePos[i*3]   += nodeVel[i*3];
        nodePos[i*3+1] += nodeVel[i*3+1];
        nodePos[i*3+2] += nodeVel[i*3+2];
        // Bounce bounds
        if (Math.abs(nodePos[i*3])   > 60) nodeVel[i*3]   *= -1;
        if (Math.abs(nodePos[i*3+1]) > 40) nodeVel[i*3+1] *= -1;
        if (Math.abs(nodePos[i*3+2]) > 30) nodeVel[i*3+2] *= -1;
        ptArr[i*3]   = nodePos[i*3];
        ptArr[i*3+1] = nodePos[i*3+1];
        ptArr[i*3+2] = nodePos[i*3+2];
      }
      ptGeo.attributes.position.needsUpdate = true;

      // Smooth camera parallax + slow auto drift
      curX += (tgtX - curX) * 0.03;
      curY += (tgtY - curY) * 0.03;
      camera.position.x = curX + Math.sin(t * 0.08) * 2;
      camera.position.y = -curY + Math.cos(t * 0.06) * 1.5;
      camera.position.z = 50 - scrollY * 0.012;
      camera.lookAt(scene.position);

      // Subtle edge pulse
      edgeMat.opacity = 0.05 + Math.sin(t * 0.4) * 0.025;

      renderer.render(scene, camera);
    }
    animBG();
  })();


  /* ──────────────────────────────────────────
     HERO GLOBE
  ────────────────────────────────────────── */
  (function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas) return;

    const W = canvas.offsetWidth  || 500;
    const H = canvas.offsetHeight || 500;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.z = 3.6;

    const R     = 1;
    const globe = new THREE.Group();
    scene.add(globe);

    // Wireframe lat/long grid
    const wGeo = new THREE.SphereGeometry(R, 40, 40);
    globe.add(new THREE.Mesh(wGeo,
      new THREE.MeshBasicMaterial({ color: ACCENT, wireframe: true, transparent: true, opacity: 0.05 })
    ));

    // Dark inner sphere
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.97, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x040a04, transparent: true, opacity: 0.7 })
    ));

    // Fibonacci surface dots
    const DOT_N  = 600;
    const dotPos = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < DOT_N; i++) {
      const y   = 1 - (i / (DOT_N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const phi = golden * i;
      dotPos.push(rad * Math.cos(phi) * R, y * R, rad * Math.sin(phi) * R);
    }
    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPos, 3));
    globe.add(new THREE.Points(dGeo,
      new THREE.PointsMaterial({ color: ACCENT, size: 0.016, transparent: true, opacity: 0.85 })
    ));

    // Halo ring
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(R * 1.04, R * 1.10, 80),
      new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.07, side: THREE.DoubleSide })
    );
    ringMesh.rotation.x = Math.PI / 2;
    globe.add(ringMesh);

    // Second tilted ring
    const ring2 = new THREE.Mesh(
      new THREE.RingGeometry(R * 1.12, R * 1.16, 80),
      new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.04, side: THREE.DoubleSide })
    );
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 6;
    globe.add(ring2);

    // Atmosphere glow
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.2, 32, 32),
      new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.025, side: THREE.BackSide })
    ));

    // Signal arcs
    const arcGroup = new THREE.Group();
    globe.add(arcGroup);

    function randOnSphere() {
      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi   = Math.acos(2 * v - 1);
      return new THREE.Vector3(
        R * Math.sin(phi) * Math.cos(theta),
        R * Math.cos(phi),
        R * Math.sin(phi) * Math.sin(theta)
      );
    }

    function buildArc(p1, p2, segs = 52) {
      const lift = R * (1.15 + Math.random() * 0.2);
      const mid  = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(lift);
      const pts  = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        pts.push(
          new THREE.Vector3().lerpVectors(p1, mid, t).lerp(
            new THREE.Vector3().lerpVectors(mid, p2, t), t
          )
        );
      }
      return pts;
    }

    const arcs = [];
    for (let i = 0; i < 10; i++) {
      const p1  = randOnSphere();
      const p2  = randOnSphere();
      const geo = new THREE.BufferGeometry().setFromPoints(buildArc(p1, p2));
      const mat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 });
      arcGroup.add(new THREE.Line(geo, mat));

      // endpoint dots
      [p1, p2].forEach(p => {
        const m = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 });
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), m);
        d.position.copy(p);
        arcGroup.add(d);
        arcs.push({ type: 'node', mat: m });
      });

      arcs.push({ type: 'arc', mat, phase: Math.random() * Math.PI * 2, speed: 0.35 + Math.random() * 0.5, peak: 0.5 + Math.random() * 0.4 });
    }

    // Mouse interaction
    let tX = 0, tY = 0, cX = 0, cY = 0;
    document.addEventListener('mousemove', e => {
      tX = (e.clientX / window.innerWidth  - 0.5) * 0.9;
      tY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    });

    new ResizeObserver(() => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }).observe(canvas);

    const clock = new THREE.Clock();
    let nodeIdx = 0;
    function animGlobe() {
      requestAnimationFrame(animGlobe);
      const t = clock.getElapsedTime();

      cX += (tX - cX) * 0.04;
      cY += (tY - cY) * 0.04;
      globe.rotation.y = t * 0.1 + cX;
      globe.rotation.x = cY * 0.45;

      ringMesh.rotation.z = t * 0.07;
      ring2.rotation.z    = -t * 0.05;
      ringMesh.material.opacity = 0.05 + Math.sin(t * 1.1) * 0.025;

      // Animate arcs + sync nodes
      nodeIdx = 0;
      arcs.forEach(obj => {
        if (obj.type === 'arc') {
          obj.mat.opacity = Math.max(0, Math.sin(t * obj.speed + obj.phase)) * obj.peak;
        } else {
          // find most recent arc before this node pair
          const prev = arcs.slice(0, arcs.indexOf(obj)).reverse().find(a => a.type === 'arc');
          if (prev) obj.mat.opacity = Math.min(1, prev.mat.opacity * 1.6);
        }
      });

      renderer.render(scene, camera);
    }
    animGlobe();
  })();
});
