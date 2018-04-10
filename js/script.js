(function(){
  const canv = document.querySelector('#bg');
  const ctx = canv.getContext('2d');
  if (!ctx) return;
  const fillColor = '#999';
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ra = [
    [Math.random() * w, 0],
    [w, Math.random() * h],
    [Math.random() * w, h],
    [0, Math.random() * h],
  ];
  ra.splice(Math.floor(Math.random() * 4), 1);
  const r1 = Math.random();
  const r2 = Math.random();
  let v = [0, 1].map(function(x) { return (1 - Math.sqrt(r1)) * ra[0][x] + (Math.sqrt(r1) * (1 - r2)) * ra[1][x] + (Math.sqrt(r1) * r2) * ra[2][x] });
  function plot() {
    v = (ra[Math.floor(Math.random() * 3)]).map(function(a, i) { return (a + v[i]) / 2; });
    ctx.fillRect(Math.floor(v[0]), Math.floor(v[1]), 1, 1);
    setTimeout(plot, 10);
  }
  ctx.fillStyle = fillColor;
  ctx.canvas.width = w;
  ctx.canvas.height = h;
  plot();
})();
