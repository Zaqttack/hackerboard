/**
 * SWIVEL Presentation Build Script
 *
 * Reads manifest.json and stitches individual slide partials into a single index.html.
 * Run from the presentation directory: node build.js
 *
 * If you manually edit manifest.json or any slide file, re-run this script to regenerate index.html.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const cwd = process.cwd();
const manifestPath = join(cwd, "manifest.json");

if (!existsSync(manifestPath)) {
  console.error("Error: manifest.json not found in current directory.");
  console.error("Run this script from the root of your presentation folder.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
const { title, author, team, year, slides } = manifest;

if (!slides || !Array.isArray(slides) || slides.length === 0) {
  console.error("Error: manifest.json must contain a non-empty 'slides' array.");
  process.exit(1);
}

// Read each slide partial
const slideContents = slides.map((entry, i) => {
  const filePath = join(cwd, "slides", entry.file);
  if (!existsSync(filePath)) {
    console.error(`Error: Slide file not found: slides/${entry.file} (index ${i})`);
    process.exit(1);
  }
  return readFileSync(filePath, "utf-8").trim();
});

// Mark the first slide as active
const processedSlides = slideContents.map((html, i) => {
  if (i === 0) {
    return html.replace('<div class="slide ', '<div class="slide active ');
  }
  return html;
});

const cssPath = "./assets/presentation.css";

const output = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
  <title>${title || "Presentation"}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/lucide@latest"><\/script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            swivel: {
              purple: '#500778', 'purple-light': '#6B1F91', 'purple-dark': '#3A0558',
              pink: '#bb16a3', 'pink-light': '#d42ebb', 'pink-dark': '#8e1080',
              lavender: '#EEDAEA', 'lavender-light': '#F7F0F5',
              slate: '#4A4A5A', cloud: '#FDFAFC',
            }
          },
          fontFamily: { sans: ['Poppins', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'Fira Code', 'monospace'] }
        }
      }
    }
  <\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssPath}">
</head>
<body class="font-sans bg-swivel-cloud text-swivel-purple">
  <div class="progress-bar" id="progress"></div>
  <div class="slide-counter" id="counter"></div>
  <div class="nav-hint">\u2190 \u2192 arrow keys or click to navigate</div>
  <img src="./assets/swivel-logo.svg" alt="" class="watermark-logo" id="watermark-logo">

${processedSlides.join("\n\n")}

  <script>
    lucide.createIcons();
    const slides = document.querySelectorAll('.slide');
    const watermarkLogo = document.getElementById('watermark-logo');
    const params = new URLSearchParams(window.location.search);
    const startSlide = parseInt(params.get('slide'), 10);
    const clicksDisabled = params.get('clicks') === 'off';
    const keysDisabled = params.get('keys') === 'off';
    let current = (startSlide && startSlide >= 1 && startSlide <= slides.length) ? startSlide - 1 : 0;

    // Update nav hint based on what's disabled
    const navHint = document.querySelector('.nav-hint');
    if (clicksDisabled && keysDisabled) {
      navHint.style.display = 'none';
    } else if (clicksDisabled) {
      navHint.textContent = '\u2190 \u2192 arrow keys to navigate';
    } else if (keysDisabled) {
      navHint.textContent = 'click to navigate';
    }

    const updateSlide = () => {
      slides.forEach((s, i) => { s.classList.toggle('active', i === current); });
      document.getElementById('progress').style.width = ((current + 1) / slides.length * 100) + '%';
      document.getElementById('counter').textContent = (current + 1) + ' / ' + slides.length;
      const url = new URL(window.location);
      url.searchParams.set('slide', current + 1);
      history.replaceState(null, '', url);
      const isDark = slides[current].classList.contains('bg-swivel-purple');
      const counter = document.getElementById('counter');
      if (isDark) {
        watermarkLogo.style.filter = 'brightness(0) invert(1)';
        watermarkLogo.style.opacity = '0.4';
        counter.style.background = 'rgba(255,255,255,0.15)';
        counter.style.color = 'rgba(255,255,255,0.8)';
      } else {
        watermarkLogo.style.filter = 'none';
        watermarkLogo.style.opacity = '0.4';
        counter.style.background = 'rgba(238,218,234,0.85)';
        counter.style.color = '#500778';
      }
    };
    const next = () => { if (current < slides.length - 1) { current++; updateSlide(); } };
    const prev = () => { if (current > 0) { current--; updateSlide(); } };
    document.addEventListener('keydown', (e) => {
      if (keysDisabled) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Home') { e.preventDefault(); current = 0; updateSlide(); }
      if (e.key === 'End') { e.preventDefault(); current = slides.length - 1; updateSlide(); }
    });
    document.addEventListener('click', (e) => {
      if (clicksDisabled) return;
      if (e.clientX > window.innerWidth / 2) next(); else prev();
    });
    updateSlide();
  <\/script>
</body>
</html>`;

writeFileSync(join(cwd, "index.html"), output, "utf-8");
console.log(`Built index.html with ${slides.length} slides.`);
