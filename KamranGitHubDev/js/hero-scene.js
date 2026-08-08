/* ============================================================================
   BitsServer IT Lab — Real WebGL 3D hero scene (Three.js)
   A wireframe data-sphere with orbiting nodes and light-trail connections,
   surrounded by floating geometric shapes with true depth, lighting, and
   mouse-driven parallax. This is genuine 3D geometry, not a CSS illusion.

   Resilience: this entire file is wrapped so that if Three.js fails to load
   (CDN blocked, offline, old browser) the hero section still looks complete —
   it just falls back to the ambient gradient background already in CSS.
   ============================================================================ */
(function () {
  var canvas = document.getElementById('hero-canvas');
  var heroSection = document.getElementById('hero');
  if (!canvas || !heroSection || typeof THREE === 'undefined') return;

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer, scene, camera;
  var sphereGroup, nodesGroup, shapesGroup, particles;
  var mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
  var clock = new THREE.Clock();
  var rafId = null;

  function init() {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(heroSection.clientWidth, heroSection.clientHeight);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, heroSection.clientWidth / heroSection.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 13);

    // ---- Lighting ----
    var ambient = new THREE.AmbientLight(0x2a3560, 1.6);
    scene.add(ambient);
    var key = new THREE.PointLight(0x00e5ff, 3.2, 40);
    key.position.set(6, 4, 8);
    scene.add(key);
    var rim = new THREE.PointLight(0x7b61ff, 2.4, 40);
    rim.position.set(-7, -3, -4);
    scene.add(rim);

    buildDataSphere();
    buildFloatingShapes();
    buildParticleField();

    window.addEventListener('resize', onResize);
    heroSection.addEventListener('mousemove', onMouseMove);
    heroSection.addEventListener('mouseleave', onMouseLeave);
    heroSection.addEventListener('touchmove', onTouchMove, { passive: true });

    animate();
  }

  // ---- A wireframe icosphere ("data sphere") with small glowing node points
  // orbiting it, evoking a global network / data-mesh — apt for an IT company. ----
  function buildDataSphere() {
    sphereGroup = new THREE.Group();
    sphereGroup.position.set(2.6, 0, 0);

    var coreGeo = new THREE.IcosahedronGeometry(2.15, 2);
    var coreMat = new THREE.MeshBasicMaterial({
      color: 0x0a84ff, wireframe: true, transparent: true, opacity: 0.55
    });
    var core = new THREE.Mesh(coreGeo, coreMat);
    sphereGroup.add(core);

    var innerGeo = new THREE.IcosahedronGeometry(1.55, 1);
    var innerMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.3 });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    sphereGroup.add(inner);

    // Orbiting node points with connecting lines (simple network look)
    var nodeCount = 14;
    var nodePositions = [];
    nodesGroup = new THREE.Group();
    var nodeGeo = new THREE.SphereGeometry(0.05, 8, 8);
    var nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (var i = 0; i < nodeCount; i++) {
      var phi = Math.acos(-1 + (2 * i) / nodeCount);
      var theta = Math.sqrt(nodeCount * Math.PI) * phi;
      var r = 2.6;
      var x = r * Math.cos(theta) * Math.sin(phi);
      var y = r * Math.sin(theta) * Math.sin(phi);
      var z = r * Math.cos(phi);
      var node = new THREE.Mesh(nodeGeo, nodeMat.clone());
      node.position.set(x, y, z);
      nodesGroup.add(node);
      nodePositions.push(new THREE.Vector3(x, y, z));
    }

    // Connect nearby nodes with thin glowing lines
    var lineMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35 });
    for (var a = 0; a < nodePositions.length; a++) {
      for (var b = a + 1; b < nodePositions.length; b++) {
        if (nodePositions[a].distanceTo(nodePositions[b]) < 2.4) {
          var geo = new THREE.BufferGeometry().setFromPoints([nodePositions[a], nodePositions[b]]);
          nodesGroup.add(new THREE.Line(geo, lineMat));
        }
      }
    }
    sphereGroup.add(nodesGroup);
    scene.add(sphereGroup);
  }

  // ---- Floating geometric shapes (octahedron, torus, box) drifting around
  // the sphere — real 3D primitives with lit, semi-transparent material. ----
  function buildFloatingShapes() {
    shapesGroup = new THREE.Group();

    var defs = [
      { geo: new THREE.OctahedronGeometry(0.5, 0), color: 0x7b61ff, pos: [-3.4, 2.0, 1.5], speed: 0.6 },
      { geo: new THREE.TorusGeometry(0.42, 0.14, 12, 32), color: 0x00e5ff, pos: [-2.6, -2.2, -1], speed: 0.45 },
      { geo: new THREE.BoxGeometry(0.6, 0.6, 0.6), color: 0x0a84ff, pos: [4.6, 2.4, -2], speed: 0.5 },
      { geo: new THREE.TetrahedronGeometry(0.55, 0), color: 0x00e5ff, pos: [4.3, -1.9, 0.5], speed: 0.7 },
      { geo: new THREE.OctahedronGeometry(0.32, 0), color: 0x7b61ff, pos: [0.3, 3.1, -1.5], speed: 0.55 }
    ];

    defs.forEach(function (d, i) {
      var mat = new THREE.MeshStandardMaterial({
        color: d.color, wireframe: false, transparent: true, opacity: 0.85,
        roughness: 0.25, metalness: 0.4, emissive: d.color, emissiveIntensity: 0.35
      });
      var mesh = new THREE.Mesh(d.geo, mat);
      mesh.position.set(d.pos[0], d.pos[1], d.pos[2]);
      mesh.userData = { speed: d.speed, offset: i * 1.3, baseY: d.pos[1] };
      shapesGroup.add(mesh);
    });

    scene.add(shapesGroup);
  }

  // ---- Ambient particle field for depth ----
  function buildParticleField() {
    var count = window.innerWidth < 768 ? 220 : 420;
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.035, transparent: true, opacity: 0.55 });
    particles = new THREE.Points(geo, mat);
    scene.add(particles);
  }

  function onMouseMove(e) {
    var rect = heroSection.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    targetRotY = mouseX * 0.35;
    targetRotX = mouseY * 0.2;
  }
  function onTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    var rect = heroSection.getBoundingClientRect();
    var t = e.touches[0];
    mouseX = ((t.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((t.clientY - rect.top) / rect.height - 0.5) * 2;
    targetRotY = mouseX * 0.25;
    targetRotX = mouseY * 0.15;
  }
  function onMouseLeave() { targetRotX = 0; targetRotY = 0; }

  function onResize() {
    var w = heroSection.clientWidth, h = heroSection.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    if (sphereGroup) {
      sphereGroup.rotation.y += 0.0022;
      sphereGroup.rotation.x += 0.0007;
      sphereGroup.rotation.y += (targetRotY - sphereGroup.rotation.y) * 0.0; // keep autorotation independent
    }
    if (nodesGroup) { nodesGroup.rotation.y -= 0.0009; }

    if (shapesGroup) {
      shapesGroup.children.forEach(function (mesh) {
        var d = mesh.userData;
        mesh.rotation.x = t * d.speed * 0.5;
        mesh.rotation.y = t * d.speed * 0.7;
        mesh.position.y = d.baseY + Math.sin(t * 0.6 + d.offset) * 0.35;
      });
    }

    if (particles) { particles.rotation.y = t * 0.015; }

    // Smooth camera parallax toward mouse target
    camera.position.x += ((mouseX * 1.4) - camera.position.x) * 0.03;
    camera.position.y += ((-mouseY * 0.9) - camera.position.y) * 0.03;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
  }

  // Pause rendering when the tab isn't visible (battery/perf courtesy)
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (rafId) cancelAnimationFrame(rafId); }
    else { animate(); }
  });

  try {
    if (prefersReducedMotion) {
      // Still render a single static frame so the scene isn't blank, just not animated.
      init();
      if (rafId) cancelAnimationFrame(rafId);
      renderer.render(scene, camera);
    } else {
      init();
    }
  } catch (err) {
    // Silent fallback — CSS ambient background behind the canvas still looks complete.
    if (canvas) canvas.style.display = 'none';
  }
})();
