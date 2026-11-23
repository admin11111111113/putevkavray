// 3D-глобус со сценарием на прокрутке: каждая «глава» (.st-step) поворачивает глобус к стране,
// рисует дугу перелёта из Москвы и пускает по ней самолёт. Three.js r128 (cdnjs). Без WebGL — статичная картинка.
(function () {
  var wrap = document.getElementById('story'); if (!wrap || !window.THREE) return;
  var canvas = wrap.querySelector('canvas'), steps = [].slice.call(wrap.querySelectorAll('.st-step'));
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var R = 1, MOW = [55.75, 37.62];
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { wrap.classList.add('no-gl'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .1, 100);
  cam.position.set(0, 0, 4.2);
  var globe = new THREE.Group(); scene.add(globe);

  function v3(lat, lon, r) {
    var phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  }
  // океан — мягкая сфера с подсветкой края
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * .985, 64, 64), new THREE.MeshBasicMaterial({ color: 0x163a6b })));
  var glow = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 64, 64), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 n; void main(){ n = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec3 n; void main(){ float i = pow(0.75 - dot(n, vec3(0.,0.,1.)), 3.); gl_FragColor = vec4(0.36,0.75,1.,1.) * i; }' }));
  scene.add(glow);
  // суша — точки
  fetch(wrap.dataset.land).then(function (r) { return r.json(); }).then(function (pts) {
    var pos = new Float32Array(pts.length * 3);
    pts.forEach(function (p, i) { var v = v3(p[0], p[1], R); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    globe.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbfe9ff, size: .022, sizeAttenuation: true })));
  });
  // Москва
  var home = new THREE.Mesh(new THREE.SphereGeometry(.022, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffc93c }));
  home.position.copy(v3(MOW[0], MOW[1], R * 1.005)); globe.add(home);
  // дуги ко всем странам
  var arcs = steps.map(function (s) {
    var a = v3(MOW[0], MOW[1], R), b = v3(+s.dataset.lat, +s.dataset.lon, R);
    var mid = a.clone().add(b).multiplyScalar(.5), h = 1 + a.distanceTo(b) * .55; mid.normalize().multiplyScalar(R * h);
    var curve = new THREE.QuadraticBezierCurve3(a, mid, b), N = 120;
    var g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(N));
    var line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffc93c, transparent: true, opacity: .95 }));
    g.setDrawRange(0, 0); globe.add(line);
    var dot = new THREE.Mesh(new THREE.SphereGeometry(.02, 12, 12), new THREE.MeshBasicMaterial({ color: 0x00c2b8 }));
    dot.position.copy(b.clone().multiplyScalar(1.005)); dot.visible = false; globe.add(dot);
    return { curve: curve, line: line, dot: dot, N: N, lat: +s.dataset.lat, lon: +s.dataset.lon };
  });
  // самолёт — маленький треугольник-спрайт
  var plane = new THREE.Mesh(new THREE.ConeGeometry(.028, .085, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  globe.add(plane);

  function size() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();

  // прокрутка → номер главы и прогресс внутри неё
  var target = { rx: 0, ry: 0 }, cur = { rx: .3, ry: 0 }, idx = -1, prog = 0;
  function rotFor(lat, lon) { return { rx: lat * Math.PI / 180 * .9, ry: -(lon + 90) * Math.PI / 180 }; }
  function onScroll() {
    var rect = wrap.getBoundingClientRect(), vh = innerHeight;
    var live = rect.top < vh * .5 && rect.bottom > vh * .5; wrap.classList.toggle('live', live); document.body.classList.toggle('story-live', live);
    var total = rect.height - vh, p = Math.min(1, Math.max(0, -rect.top / total));
    var f = p * steps.length, i = Math.min(steps.length - 1, Math.floor(f));
    prog = f - i;
    if (i !== idx) { idx = i; steps.forEach(function (s, k) { s.classList.toggle('on', k === i); }); }
    var a = arcs[i], from = i > 0 ? arcs[i - 1] : { lat: MOW[0], lon: MOW[1] };
    var t = Math.min(1, prog * 1.6), e = t * t * (3 - 2 * t);
    var r0 = rotFor(from.lat, from.lon), r1 = rotFor(a.lat, a.lon);
    var dy = r1.ry - r0.ry; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    target.rx = r0.rx + (r1.rx - r0.rx) * e; target.ry = r0.ry + dy * e;
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var clock = 0;
  (function loop() {
    clock += .016;
    var k = reduce ? 1 : .08;
    var dy = target.ry - cur.ry; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    cur.ry += dy * k; cur.rx += (target.rx - cur.rx) * k;
    globe.rotation.set(cur.rx, cur.ry + (reduce ? 0 : Math.sin(clock * .3) * .02), 0);
    arcs.forEach(function (a, i) {
      var t = i < idx ? 1 : i === idx ? Math.min(1, prog * 1.8) : 0;
      a.line.geometry.setDrawRange(0, Math.floor(a.N * t) + 1);
      a.line.material.opacity = i === idx ? .95 : .35; a.dot.visible = t >= 1;
    });
    var A = arcs[Math.max(0, idx)], tt = Math.min(.999, Math.max(.001, prog * 1.8));
    plane.visible = idx >= 0 && prog * 1.8 < 1.05;
    if (plane.visible) {
      var p = A.curve.getPoint(tt), q = A.curve.getPoint(Math.min(1, tt + .01));
      plane.position.copy(p); plane.lookAt(q); plane.rotateX(Math.PI / 2);
    }
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  })();
})();
