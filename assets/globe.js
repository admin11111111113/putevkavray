// 3D-глобус на один экран: сам по очереди «летит» из Москвы в страны (каждые 5 с), кнопки внизу — выбрать вручную.
// Three.js r128 (cdnjs). Без WebGL — остаются карточка и кнопки.
(function () {
  var wrap = document.getElementById('story'); if (!wrap) return;
  var canvas = wrap.querySelector('canvas'), steps = [].slice.call(wrap.querySelectorAll('.st-step')), chips = [].slice.call(wrap.querySelectorAll('.st-chips button'));
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0, t0 = performance.now(), DUR = 5200, paused = false;
  function show(i) {
    idx = (i + steps.length) % steps.length; t0 = performance.now();
    steps.forEach(function (s, k) { s.classList.toggle('on', k === idx); });
    chips.forEach(function (c, k) { c.classList.toggle('on', k === idx); });
    var c = chips[idx]; if (c && c.scrollIntoView) { var p = c.parentNode; p.scrollTo({ left: c.offsetLeft - p.clientWidth / 2 + c.clientWidth / 2, behavior: 'smooth' }); }
  }
  chips.forEach(function (c, k) { c.addEventListener('click', function () { show(k); paused = true; setTimeout(function () { paused = false; }, 15000); }); });
  wrap.addEventListener('mouseenter', function () { paused = true; }); wrap.addEventListener('mouseleave', function () { paused = false; });
  show(0);
  if (!window.THREE) { setInterval(function () { if (!paused) show(idx + 1); }, DUR); return; }

  var R = 1, MOW = [55.75, 37.62], renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { wrap.classList.add('no-gl'); setInterval(function () { if (!paused) show(idx + 1); }, DUR); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .1, 100); cam.position.set(0, 0, 3.9);
  var globe = new THREE.Group(); scene.add(globe);
  function v3(lat, lon, r) { var phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)); }
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R * .985, 64, 64), new THREE.MeshBasicMaterial({ color: 0x163a6b })));
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 64, 64), new THREE.ShaderMaterial({ transparent: true, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 n; void main(){ n = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec3 n; void main(){ float i = pow(0.75 - dot(n, vec3(0.,0.,1.)), 3.); gl_FragColor = vec4(0.36,0.75,1.,1.) * i; }' })));
  fetch(wrap.dataset.land).then(function (r) { return r.json(); }).then(function (pts) {
    var pos = new Float32Array(pts.length * 3);
    pts.forEach(function (p, i) { var v = v3(p[0], p[1], R); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    globe.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbfe9ff, size: .022 })));
  });
  var home = new THREE.Mesh(new THREE.SphereGeometry(.024, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffc93c }));
  home.position.copy(v3(MOW[0], MOW[1], R * 1.005)); globe.add(home);
  var arcs = steps.map(function (s) {
    var a = v3(MOW[0], MOW[1], R), b = v3(+s.dataset.lat, +s.dataset.lon, R);
    var mid = a.clone().add(b).multiplyScalar(.5); mid.normalize().multiplyScalar(R * (1 + a.distanceTo(b) * .5));
    var curve = new THREE.QuadraticBezierCurve3(a, mid, b), N = 120;
    var g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(N)); g.setDrawRange(0, 0);
    var line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffc93c, transparent: true, opacity: .95 })); globe.add(line);
    var dot = new THREE.Mesh(new THREE.SphereGeometry(.02, 12, 12), new THREE.MeshBasicMaterial({ color: 0x00c2b8 }));
    dot.position.copy(b.clone().multiplyScalar(1.005)); globe.add(dot);
    return { curve: curve, line: line, N: N, lat: +s.dataset.lat, lon: +s.dataset.lon };
  });
  var plane = new THREE.Mesh(new THREE.ConeGeometry(.028, .085, 3), new THREE.MeshBasicMaterial({ color: 0xffffff })); globe.add(plane);
  function size() { var w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  addEventListener('resize', size); size();
  // поворачиваем к середине маршрута Москва → страна, чтобы была видна вся дуга
  function rotFor(lat, lon) { var la = (lat + MOW[0]) / 2, lo = lon; var dl = lon - MOW[1]; dl = Math.atan2(Math.sin(dl * Math.PI / 180), Math.cos(dl * Math.PI / 180)) * 180 / Math.PI; lo = MOW[1] + dl / 2;
    return { rx: la * Math.PI / 180 * .85, ry: -(lo + 90) * Math.PI / 180 }; }
  var cur = rotFor(MOW[0], MOW[1]), visible = true;
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(wrap);
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    var k = (now - t0) / DUR;
    if (k >= 1 && !paused) { show(idx + 1); k = 0; }
    var A = arcs[idx], tgt = rotFor(A.lat, A.lon), s = reduce ? 1 : .06;
    var dy = tgt.ry - cur.ry; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); cur.ry += dy * s; cur.rx += (tgt.rx - cur.rx) * s;
    globe.rotation.set(cur.rx, cur.ry, 0);
    var t = Math.min(1, Math.max(0, (k - .1) * 1.6));
    arcs.forEach(function (a, i) { a.line.geometry.setDrawRange(0, i === idx ? Math.floor(a.N * t) + 1 : 0); });
    plane.visible = t > 0 && t < 1;
    if (plane.visible) { var p = A.curve.getPoint(t), q = A.curve.getPoint(Math.min(1, t + .01)); plane.position.copy(p); plane.lookAt(q); plane.rotateX(Math.PI / 2); }
    renderer.render(scene, cam);
  })(performance.now());
})();
