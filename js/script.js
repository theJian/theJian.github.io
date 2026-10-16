/* ASCII city skyline with shared room lighting, neon signs, and the original night sky. */
(function () {
  'use strict';

  var SKY_CHARS = ['.', '·', '`', ',', "'", '~'];
  var SKY_PALETTE = ['#9fd8ff', '#cfe6ff', '#7f9fd8'];
  var LINKS = [
    { text: 'Code', href: 'https://github.com/thejian' },
    { text: 'Games', href: 'https://steamcommunity.com/id/theJian/' },
    { text: 'hi@chabuduo.in', href: 'mailto:hi@chabuduo.in' }
  ];
  /* written high in the sky; re-wrapped only when the screen is too narrow */
  var MESSAGE = [
    'we\'re entering a new era where exciting new things are possible,',
    'but some things are being lost.'
  ];

  var pre = document.querySelector('#city');
  if (!pre) return;

  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var randInt = function (a, b) { return Math.floor(rand(a, b + 1)); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  var cols, rows, groundRow, grid;
  var timers = [];
  var windowRooms = [], skyEls = [];

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function esc(ch) {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    return ch;
  }

  function put(col, row, ch, hex, alpha, cls, attrs) {
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;
    grid[row][col] = {
      ch: ch,
      cls: cls,
      attrs: attrs || '',
      color: rgba(hex, alpha)
    };
  }

  function putLink(col, row, ch, href) {
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;
    grid[row][col] = {
      ch: ch,
      cls: 'l',
      attrs: '',
      href: href,
      color: rgba('#e8e2d4', 1)
    };
  }

  /* ---------- city generation (fills the character grid) ---------- */

  function drawSky() {
    var n = Math.round(cols * rows * 0.007);
    for (var i = 0; i < n; i++) {
      put(randInt(0, cols - 1), randInt(0, Math.max(1, groundRow - 4)),
        pick(SKY_CHARS), pick(SKY_PALETTE), rand(0.05, 0.35), 's');
    }
  }

  function wrapLine(text, width) {
    var words = text.split(' ');
    var lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      if (line && line.length + 1 + words[i].length <= width) {
        line += ' ' + words[i];
      } else {
        if (line) lines.push(line);
        line = words[i];
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawMessage() {
    var width = Math.max(12, cols - 6);
    var lines = [], i;
    for (i = 0; i < MESSAGE.length; i++) {
      lines = lines.concat(wrapLine(MESSAGE[i], width));
    }

    var top = 2;

    /* clear sky specks around the words first, then write the words */
    var r, rr, cx, col, k, ch;
    for (r = 0; r < lines.length; r++) {
      col = Math.floor((cols - lines[r].length) / 2);
      for (rr = top + r - 1; rr <= top + r + 1; rr++) {
        if (!grid[rr]) continue;
        for (cx = col - 1; cx <= col + lines[r].length; cx++) {
          if (cx >= 0 && cx < cols) grid[rr][cx] = null;
        }
      }
    }
    for (r = 0; r < lines.length; r++) {
      col = Math.floor((cols - lines[r].length) / 2);
      for (k = 0; k < lines[r].length; k++) {
        ch = lines[r].charAt(k);
        if (ch === ' ') continue;
        put(col + k, top + r, ch, '#cfe6ff', rand(0.55, 0.85), 's');
      }
    }
  }

  // Skyline generation follows ascii-city-2/city.js, with an added tower landmark.
  function randomGenerator(value) {
    return () => {
      value |= 0;
      value = value + 0x6D2B79F5 | 0;
      let t = Math.imul(value ^ value >>> 15, 1 | value);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function drawBuildings() {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const random = randomGenerator(seed);
    const range = (min, max) => min + random() * (max - min);
    const pick = items => items[Math.floor(random() * items.length)];
    const palettes = [
      [49, 100, 232], [48, 115, 240], [61, 185, 195],
      [21, 164, 111], [213, 113, 25], [203, 202, 37], [168, 192, 43],
    ];
    const cells = new Array(cols * rows).fill(null);
    function set(x, y, char, color, light, neon = null, room = null) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) cells[y * cols + x] = { char, color, light, neon, room };
    }
    const buildings = [];
    function distinct(options, preferred, used) {
      const counts = options.map(value => used.filter(other => other === value).length);
      const minimum = Math.min(...counts);
      const candidates = options.filter((_, index) => counts[index] === minimum);
      return candidates.includes(preferred) ? preferred : pick(candidates);
    }

    function building(x, w, h, palette, depth, roof = pick(['flat', 'flat', 'steps', 'spire', 'pitched', 'dome', 'slant', 'crown'])) {
      const neighbors = buildings.filter(other => x <= other.x + other.w + 1 && x + w + 1 >= other.x);
      palette = distinct(palettes, palette, neighbors.map(other => other.palette));
      const windowGlyphs = ['0', 'O', 'Z', '8', '&', 'X', '#', '+'];
      const primary = distinct(windowGlyphs, pick(windowGlyphs), neighbors.map(other => other.primary));
      const secondary = primary;
      buildings.push({ x, w, palette, primary });
      const top = rows - h;
      const side = Math.max(2, Math.floor(w * .22));
      const roofHeight = roof === 'flat' ? 0 : Math.max(3, Math.floor(h * (roof === 'dome' || roof === 'pitched' ? range(.08, .14) : range(.16, .3))));
      const period = pick([3, 4, 5]);
      const style = Math.floor(random() * 4);
      const phase = Math.floor(random() * 10);
      const floorPeriod = pick([3, 4, 5]);
      const ribChar = pick([':', ':', '.', '.', '|', 'I']);
      const facade = pick([
        ['::' + primary + ' '],
        ['.' + primary + ' .', ': ::'],
        [':' + primary + ' :' + secondary + '.', '..  ..'],
        ['::' + primary + primary + ' :', '..: ::'],
        [':' + primary + ' .', '.  .', ':' + secondary + ' .'],
        [' .' + primary + '. ', '::' + primary + '::'],
      ]);
      const activity = random();
      const occupancy = activity < .2 ? range(.2, .4) : activity < .85 ? range(.45, .75) : range(.75, .9);
      const bayCount = Math.ceil(w / period);
      // Adjacent windows share room lighting; small variations keep the repetition natural.
      const rooms = Array.from({ length: Math.ceil(h / floorPeriod) }, () => {
        const floorOccupancy = Math.max(.1, Math.min(.95, occupancy + range(-.12, .12)));
        return Array.from({ length: bayCount }, () => ({
          lit: random() < floorOccupancy,
          occupancy: floorOccupancy,
          brightness: range(.85, 1.1),
          offOpacity: range(.07, .16),
        }));
      });
      for (let y = Math.max(0, top); y < rows; y++) {
        const fromTop = y - top;
        const floorChar = pick(['-', '=']);
        let left = 0;
        let right = w;
        if (roof === 'tower') {
          // A thin mast, a wide observation deck, and a shaft that flares at the base.
          const progress = fromTop / h;
          const deck = Math.max(0, Math.min(1, (progress - .12) / .05, (.28 - progress) / .05));
          const towerWidth = progress < .12 ? 1
            : progress < .28 ? Math.max(3, Math.floor(w * (.45 + .55 * deck)))
              : Math.max(3, Math.floor(w * (.2 + .3 * Math.pow((progress - .28) / .72, 2))));
          left = Math.floor(w / 2) - Math.floor(towerWidth / 2);
          right = left + towerWidth;
        } else if (fromTop < roofHeight) {
          const progress = 1 - fromTop / roofHeight;
          const half = w / 2 - 1;
          const profiles = {
            spire: progress * half,
            pitched: progress * half,
            steps: Math.ceil(progress * 3) * Math.max(1, Math.floor(w / 9)),
            dome: half * (1 - Math.sqrt(1 - progress * progress)),
            crown: progress > .55 ? w * .28 : w * .12,
            slant: 0,
          };
          left = Math.min(Math.floor(w / 2) - 1, Math.floor(profiles[roof]));
          right = roof === 'slant' ? w - Math.floor(progress * (w - 3)) : w - left;
        }
        for (let bx = left; bx < right; bx++) {
          const edge = bx === left || bx === right - 1;
          const rib = (bx + phase) % period === 0;
          const floor = fromTop % floorPeriod === 0;
          const brightOutline = depth === 1 && (edge || (floor && style === 0));
          const shade = bx > w - side ? (depth === 1 ? .85 : .45) : 1;
          let char = ' ';
          let light = .08;
          let room = null;
          if (edge) {
            char = fromTop < roofHeight && roof === 'pitched' ? (bx === left ? '/' : '\\') : '│';
            light = depth === 1 ? 1 : .48;
          }
          else if (fromTop === 0 && roof === 'flat') { char = '_'; light = .5; }
          else if (floor && style === 0) { char = floorChar; light = depth === 1 ? 1 : .23; }
          else if (rib) { char = ribChar; light = depth === 1 ? .8 : .28; }
          else {
            const motif = facade[fromTop % facade.length];
            char = random() < .015 ? pick([':', '.', ' ', secondary]) : motif[bx % motif.length];
            const wall = char === ':' || char === '.' || char === ' ';
            if (!wall) room = rooms[Math.floor(fromTop / floorPeriod)][Math.floor(bx / period)];
            light = (wall ? (depth === 1 ? .9 : .4) : room.brightness) * range(.94, 1.06);
            if (fromTop % floorPeriod === 0 && style === 2) light *= depth === 1 ? .85 : .45;
          }
          set(x + bx, y, char, palette, light * depth * (brightOutline ? 1 : shade), null, room);
          if (roof === 'tower' && char !== ' ' && (!edge || fromTop < h * .12)) {
            // Three staggered waves span the tower, repeating every 1.4 seconds.
            cells[y * cols + x + bx].waveDelay = -4.2 * fromTop / h;
          }
        }
      }
      const rooftop = roof === 'tower' ? 1 : random();
      if (rooftop < .08) {
        const center = x + Math.floor(w / 2);
        const aerial = Math.floor(range(2, 6));
        for (let i = 1; i <= aerial; i++) set(center, top - i, i === aerial ? '+' : '|', palette, depth * .65);
      } else if (roof === 'flat' && rooftop < .4) {
        const offset = Math.floor(range(1, Math.max(2, w - 5)));
        const equipment = pick([
          [' ___ ', '|###|'],
          [' ___ ', '[===]'],
          ['_   _', '|   |'],
          ['_____', '|:::|'],
        ]);
        equipment.forEach((line, row) => {
          [...line].forEach((char, column) => set(x + offset + column, top - equipment.length + row, char, palette, depth * .55));
        });
      } else if (roof === 'flat' && rooftop < .65) {
        const parapetChar = pick(['_', '=']);
        for (let bx = 0; bx < w; bx++) {
          set(x + bx, top - 1, bx === 0 || bx === w - 1 ? '|' : parapetChar, palette, depth * .45);
        }
      } else if (roof === 'flat' && rooftop < .9) {
        const count = Math.floor(range(1, Math.min(5, Math.floor((w - 2) / 3)) + 1));
        let positions = Array.from({ length: w - 3 }, (_, index) => index + 1);
        for (let i = 0; i < count && positions.length; i++) {
          const offset = pick(positions);
          const ventWidth = pick([1, 2]);
          for (let column = 0; column < ventWidth; column++) {
            set(x + offset + column, top - 2, '.', palette, depth * .8);
            set(x + offset + column, top - 1, '|', palette, depth * .8);
          }
          positions = positions.filter(position => Math.abs(position - offset) >= 3);
        }
      }
      if (roof !== 'tower' && depth === 1 && w >= 10 && top + roofHeight + 3 < rows) {
        const lowestRoofRow = top + roofHeight + 2;
        const signY = Math.floor(lowestRoofRow + Math.pow(random(), .45) * (rows - 1 - lowestRoofRow));
        const signChance = .2 + .45 * (signY / rows);
        if (random() >= signChance) return;
        const patternWidth = Math.floor(range(3, Math.min(8, w - 3)));
        const motif = pick(['╱╲', '≋·', '┆▪', '+·', '::', '<>', '~:']);
        const pattern = Array.from({ length: patternWidth }, (_, column) =>
          random() < .12 ? pick(['.', ':', '+']) : motif[column % motif.length]).join('');
        const signWidth = patternWidth;
        const signX = x + Math.floor(range(1, w - signWidth));
        const signColor = pick([[255, 65, 170], [50, 240, 230], [255, 185, 60]]);
        const animation = pick([
          { name: 'neon-blink', min: .9, max: 1.6 },
          { name: 'neon-double', min: 1.6, max: 2.4 },
          { name: 'neon-flicker', min: 3, max: 4.5 },
          { name: 'neon-blackout', min: 2, max: 4 },
          { name: 'neon-pulse', min: 1.5, max: 2.8 },
          { name: 'neon-chase', min: 1.4, max: 2.2 },
        ]);
        const duration = `${range(animation.min, animation.max).toFixed(2)}s`;
        const phase = range(0, 4);
        [...pattern].forEach((char, column) => {
          const neon = {
            name: animation.name,
            timing: animation.name === 'neon-pulse' ? 'ease-in-out' : 'step-end',
            duration,
            delay: `${(-phase + (animation.name === 'neon-chase' ? column * .12 : 0)).toFixed(2)}s`,
          };
          set(signX + column, signY, char, signColor, 1, neon);
        });
      }
    }

    // Group boundaries separate the nearer buildings while revealing the distant city.
    const gapCount = random() < .3 ? 2 : 1;
    const groups = [];
    let groupStart = 0;
    for (let i = 1; i <= gapCount; i++) {
      const center = Math.floor(cols * (i + range(-.18, .18)) / (gapCount + 1));
      const gapWidth = Math.max(3, Math.floor(cols * range(.05, .08)));
      const gapStart = center - Math.floor(gapWidth / 2);
      groups.push({ start: groupStart, end: gapStart });
      groupStart = gapStart + gapWidth;
    }
    groups.push({ start: groupStart, end: cols });

    // Low, dim buildings continue behind the gaps to give the skyline depth.
    for (let x = 0; x <= cols - 8;) {
      const w = Math.min(Math.floor(range(8, 31)), cols - x);
      building(x, w, Math.floor(rows * range(.16, .32)), pick(palettes), .25);
      x += w - 2;
    }
    for (const group of groups) {
      for (let x = group.start; x <= group.end - 8;) {
        const w = Math.min(Math.floor(range(8, 31)), group.end - x);
        const height = .3 + Math.pow(random(), 2) * .29;
        building(x, w, Math.floor(rows * height), pick(palettes), .9);
        x += w - Math.floor(range(1, 4));
      }
    }
    // Keep tall landmarks scarce so they stand out above the lower city.
    const landmarkWidth = Math.max(14, Math.floor(cols * .072));
    function landmark(position, width, height, palette, roof) {
      const eligibleGroups = groups.filter(group => group.end - group.start >= 14);
      if (!eligibleGroups.length) return;
      const group = eligibleGroups.reduce((closest, candidate) =>
        Math.abs((candidate.start + candidate.end) / 2 - position) < Math.abs((closest.start + closest.end) / 2 - position) ? candidate : closest);
      const w = Math.min(width, group.end - group.start);
      const x = Math.max(group.start, Math.min(Math.floor(position - w / 2), group.end - w));
      building(x, w, Math.floor(rows * height), palette, 1, roof);
      const center = x + Math.floor(w / 2);
      const top = rows - Math.floor(rows * height);
      let lightRow = top - 1;
      while (lightRow >= 0 && cells[lightRow * cols + center]?.char === '|') lightRow--;
      set(center, lightRow, '*', [255, 65, 65], 1);
    }
    const landmarkPosition = cols * (random() < .5 ? range(.1, .3) : range(.7, .9));
    landmark(landmarkPosition, landmarkWidth, .86, palettes[4], pick(['steps', 'crown', 'spire', 'tower']));
    if (random() < .18) {
      landmark(cols * range(.72, .79), Math.max(14, landmarkWidth - 1), .76, palettes[5], 'spire');
    }
    for (const group of groups) {
      for (let x = group.start; x <= group.end - 8;) {
        const remaining = group.end - x;
        const wideLow = remaining >= 36 && random() < .18;
        const w = Math.min(Math.floor(wideLow ? range(36, 65) : range(8, 31)), remaining);
        const height = wideLow ? range(.08, .16) : range(.18, .4);
        const roof = wideLow ? pick(['flat', 'flat', 'flat', 'steps']) : pick(['flat', 'flat', 'steps', 'pitched', 'dome', 'slant', 'crown']);
        building(x, w, Math.floor(rows * height), pick(palettes), 1, roof);
        x += w + Math.floor(range(1, 6));
      }
    }

    const rooms = new Map();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = cells[y * cols + x];
        if (!cell) continue;
        let cls = '', attrs = '', style = '';
        if (cell.waveDelay !== undefined) {
          cls = 'tower-wave';
          style = ';animation-delay:' + cell.waveDelay + 's';
        } else if (cell.room) {
          if (!rooms.has(cell.room)) rooms.set(cell.room, rooms.size);
          cls = 'window';
          attrs = ' data-room="' + rooms.get(cell.room) + '"';
          style = ';opacity:' + (cell.room.lit ? 1 : cell.room.offOpacity);
        } else if (cell.neon) {
          cls = 'neon-sign';
          style = ';--neon-pattern:' + cell.neon.name + ';--neon-timing:' + cell.neon.timing +
            ';animation-duration:' + cell.neon.duration + ';animation-delay:' + cell.neon.delay;
        } else if (cell.char === '*') {
          cls = 'obstruction-light';
        }
        grid[y][x] = {
          ch: cell.char, cls, attrs, style,
          color: 'rgb(' + cell.color.map(c => Math.round(c * cell.light)).join(' ') + ')'
        };
      }
    }
    windowRooms = [...rooms].map(([room]) => ({ room, elements: [] }));
  }

  function drawLinks() {
    var gap = 2;
    var blockH = LINKS.length * gap - 1;
    var startRow = Math.max(1, Math.round((groundRow - blockH) / 2));
    for (var i = 0; i < LINKS.length; i++) {
      var link = LINKS[i];
      var row = startRow + i * gap;
      var col = Math.floor((cols - link.text.length) / 2);
      for (var j = -1; j <= link.text.length; j++) {
        if (col + j >= 0 && col + j < cols) grid[row][col + j] = null;
      }
      for (var k = 0; k < link.text.length; k++) {
        putLink(col + k, row, link.text.charAt(k), link.href);
      }
    }
  }

  /* ---------- text output ---------- */

  function toHtml() {
    var out = [], openHref = null;
    for (var row = 0; row < rows; row++) {
      var buf = '', spaces = 0;
      for (var col = 0; col < cols; col++) {
        var cell = grid[row][col];
        if (!cell) { spaces++; continue; }
        if ((cell.href || null) !== openHref && openHref) {
          buf += '</a>';
          openHref = null;
        }
        if (spaces) {
          buf += new Array(spaces + 1).join(' ');
          spaces = 0;
        }
        if (cell.href && !openHref) {
          openHref = cell.href;
          buf += '<a href="' + openHref + '">';
        }
        buf += '<span class="' + cell.cls + '"' + cell.attrs +
          ' style="color:' + cell.color + (cell.style || '') + '">' + esc(cell.ch) + '</span>';
      }
      if (openHref) {
        buf += '</a>';
        openHref = null;
      }
      out.push(buf);
    }
    pre.innerHTML = out.join('\n');
    pre.querySelectorAll('[data-room]').forEach(el => {
      windowRooms[+el.dataset.room].elements.push(el);
    });
    skyEls = [].slice.call(pre.querySelectorAll('.s'));
  }

  /* ---------- animation (style toggles only; color lives in style attr) ---------- */

  function updateWindowLights() {
    if (document.hidden || !windowRooms.length) return;
    const count = Math.max(1, Math.ceil(windowRooms.length * .008));
    for (let i = 0; i < count; i++) {
      const { room, elements } = windowRooms[Math.floor(Math.random() * windowRooms.length)];
      room.lit = Math.random() < room.occupancy;
      for (const element of elements) element.style.opacity = room.lit ? '1' : String(room.offOpacity);
    }
  }

  function twinkleSky() {
    for (var i = 0; i < 3; i++) {
      var el = pick(skyEls);
      if (!el) return;
      el.style.textShadow = '0 0 7px currentColor';
      el.style.opacity = '1';
      (function (e) {
        setTimeout(function () {
          e.style.textShadow = '';
          e.style.opacity = '';
        }, 400 + Math.random() * 600);
      })(el);
    }
  }

  function animate() {
    timers.push(setInterval(updateWindowLights, 2000));
    timers.push(setInterval(twinkleSky, 550));
  }

  /* ---------- setup ---------- */

  function measure() {
    var probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
    probe.textContent = new Array(101).join('0');
    pre.appendChild(probe);
    var charW = probe.getBoundingClientRect().width / 100;
    pre.removeChild(probe);
    return {
      charW: charW,
      lineH: parseFloat(getComputedStyle(pre).lineHeight)
    };
  }

  function generate() {
    timers.forEach(clearInterval);
    timers = [];

    var m = measure();
    cols = Math.max(1, Math.floor(window.innerWidth / m.charW));
    rows = Math.max(1, Math.floor(window.innerHeight / m.lineH));
    groundRow = rows - Math.max(4, Math.round(rows * 0.1));

    grid = [];
    for (var r = 0; r < rows; r++) grid.push(new Array(cols));

    drawSky();
    drawBuildings();
    drawMessage();
    drawLinks();
    toHtml();

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) animate();
  }

  generate();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(generate, 200);
  });
})();
