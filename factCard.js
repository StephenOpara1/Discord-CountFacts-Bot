
const { createCanvas } = require('@napi-rs/canvas');

async function createFactCard(number, fact, username) {
  const width = 1000;
  const height = 760;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const black = '#080808';
  const white = '#FFFFFF';
  const red = '#FF3B30';
  const yellow = '#FFD60A';
  const green = '#39E75F';
  const muted = '#A5A5A5';

  // Rotate accent colors deterministically by count.
  const accents = [red, yellow, green];
  const accent = accents[Math.abs(Number(number) % accents.length)];
  const secondary = accents[(Math.abs(Number(number) % 3) + 1) % 3];
  const tertiary = accents[(Math.abs(Number(number) % 3) + 2) % 3];

  // Solid black background — no gradient.
  ctx.fillStyle = black;
  ctx.fillRect(0, 0, width, height);

  // Point grid across the background.
  for (let x = 22; x < width; x += 30) {
    for (let y = 20; y < height; y += 30) {
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Concentric circles in the upper-right background.
  ctx.save();
  ctx.translate(850, 150);

  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = accents[i % accents.length];
    ctx.globalAlpha = 0.08 + (i % 3) * 0.025;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 35 + i * 19, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // Straight diagonal streaks on the right.
  ctx.save();
  ctx.translate(770, 365);
  ctx.rotate(-0.55);

  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = accents[i % accents.length];
    ctx.globalAlpha = 0.12;
    ctx.fillRect(i * 25, 0, 4, 300);
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // Small top accent — no header text.
  ctx.fillStyle = accent;
  ctx.fillRect(60, 48, 70, 5);

  // Large count number.
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = white;
  ctx.font = 'bold 112px sans-serif';
  ctx.fillText(String(number), 55, 218);
  ctx.restore();

  // Main heading.
  ctx.fillStyle = accent;
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('DID YOU KNOW?', 60, 278);

  // Heading underline.
  ctx.fillStyle = secondary;
  ctx.fillRect(60, 297, 58, 5);

  // Wrap the fact.
  const paddingX = 60;
  const maxWidth = 850;
  const maxHeight = 285;
  const words = String(fact).trim().split(/\s+/);

  function wrapText(fontSize) {
    ctx.font = `bold ${fontSize}px sans-serif`;

    const lines = [];
    let line = '';

    for (const word of words) {
      // Break unusually long words so they don't overflow.
      if (ctx.measureText(word).width > maxWidth) {
        if (line) {
          lines.push(line);
          line = '';
        }

        let part = '';

        for (const char of word) {
          if (
            ctx.measureText(part + char).width > maxWidth &&
            part
          ) {
            lines.push(part);
            part = char;
          } else {
            part += char;
          }
        }

        line = part;
        continue;
      }

      const candidate = line ? `${line} ${word}` : word;

      if (
        ctx.measureText(candidate).width > maxWidth &&
        line
      ) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) lines.push(line);

    return lines;
  }

  // Find a readable font size that fits.
  let fontSize = 43;
  let lines = [];

  while (fontSize >= 20) {
    lines = wrapText(fontSize);

    if (lines.length * fontSize * 1.3 <= maxHeight) {
      break;
    }

    fontSize -= 1;
  }

  const lineHeight = fontSize * 1.3;
  const maxLines = Math.floor(maxHeight / lineHeight);

  // Keep exceptionally long facts away from the footer.
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);

    let lastLine = lines[maxLines - 1];

    while (
      lastLine &&
      ctx.measureText(lastLine + '…').width > maxWidth
    ) {
      lastLine = lastLine.slice(0, -1);
    }

    lines[maxLines - 1] = lastLine.trimEnd() + '…';
  }

  // Render fact directly onto the black background.
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = white;
  ctx.textBaseline = 'top';

  let y = 335;

  for (const line of lines) {
    ctx.fillText(line, paddingX, y);
    y += lineHeight;
  }

  ctx.textBaseline = 'alphabetic';

  // Footer separator.
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.fillRect(60, 675, 880, 1);

  // Username only, slightly larger.
  ctx.fillStyle = white;
  ctx.font = 'bold 29px sans-serif';
  ctx.fillText(String(username).slice(0, 35), 60, 727);

  // Small question-mark accent.
  ctx.fillStyle = tertiary;
  ctx.beginPath();
  ctx.arc(922, 721, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = black;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('?', 922, 727);
  ctx.textAlign = 'left';

  return canvas.toBuffer('image/png');
}

module.exports = { createFactCard };
