import { useEffect, useRef } from 'react';

export function SuitcaseBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const darkFactor = isDark ? 0.5 : 1.0;

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (isDark) {
        skyGrad.addColorStop(0, '#1A1F24');
        skyGrad.addColorStop(1, '#222830');
      } else {
        skyGrad.addColorStop(0, '#E8F0F8');
        skyGrad.addColorStop(1, '#F5F0F8');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Clouds (light only)
      if (!isDark) {
        const clouds = [
          [0.15, 0.12, 0.18, 0.06],
          [0.55, 0.08, 0.22, 0.05],
          [0.80, 0.18, 0.14, 0.05],
        ];
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = 'white';
        for (const [cx, cy, cw, ch] of clouds) {
          ctx.beginPath();
          ctx.ellipse(cx * w + (cw * w) / 2, cy * h + (ch * h) / 2, (cw * w) / 2, (ch * h) / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Mountain layers
      const layers: [string, number, number[][]][] = [
        ['#8AAAC8', 0.5 * darkFactor, [
          [0, 0.65], [0.08, 0.52], [0.18, 0.38], [0.28, 0.30], [0.36, 0.35], [0.44, 0.28],
          [0.52, 0.22], [0.60, 0.32], [0.68, 0.38], [0.78, 0.30], [0.88, 0.36], [1, 0.50],
        ]],
        ['#7A9BB5', 0.6 * darkFactor, [
          [0, 0.72], [0.10, 0.55], [0.20, 0.45], [0.30, 0.50], [0.38, 0.42], [0.48, 0.36],
          [0.56, 0.44], [0.64, 0.48], [0.72, 0.40], [0.82, 0.46], [0.92, 0.52], [1, 0.60],
        ]],
        ['#6A8AA8', 0.7 * darkFactor, [
          [0, 0.80], [0.06, 0.72], [0.14, 0.60], [0.24, 0.55], [0.32, 0.62], [0.42, 0.54],
          [0.50, 0.58], [0.58, 0.64], [0.66, 0.56], [0.76, 0.62], [0.86, 0.68], [1, 0.72],
        ]],
        ['#5A7A98', 0.85 * darkFactor, [
          [0, 0.88], [0.08, 0.78], [0.16, 0.70], [0.26, 0.74], [0.34, 0.68], [0.44, 0.72],
          [0.54, 0.76], [0.62, 0.70], [0.72, 0.74], [0.82, 0.78], [0.90, 0.82], [1, 0.85],
        ]],
      ];

      for (const [color, opacity, points] of layers) {
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        const pts = points.map(([px, py]) => [px * w, py * h]);
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          const prev = pts[i - 1];
          const curr = pts[i];
          const cp1x = (prev[0] + curr[0]) / 2;
          const cp2x = (prev[0] + curr[0]) / 2;
          ctx.bezierCurveTo(cp1x, prev[1], cp2x, curr[1], curr[0], curr[1]);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      }

      // Trees
      ctx.globalAlpha = isDark ? 0.3 : 0.55;
      ctx.fillStyle = '#4A6A88';
      const trees = [
        [0.12, 0.72, 0.7], [0.18, 0.69, 0.9], [0.22, 0.71, 0.6],
        [0.38, 0.67, 1.0], [0.42, 0.70, 0.75],
        [0.58, 0.69, 0.85], [0.64, 0.71, 0.65],
        [0.78, 0.73, 0.8], [0.84, 0.76, 0.7],
      ];
      for (const [tx, ty, ts] of trees) {
        const x = tx * w, y = ty * h, s = ts * 12;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x - s * 0.4, y);
        ctx.lineTo(x + s * 0.4, y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Mist
      const mistGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
      const mistColor = isDark ? '#1A1F24' : '#FAFAFA';
      mistGrad.addColorStop(0, 'transparent');
      mistGrad.addColorStop(1, mistColor);
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, h * 0.75, w, h * 0.25);
    };

    draw();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', draw);
    window.addEventListener('resize', draw);
    return () => {
      mq.removeEventListener('change', draw);
      window.removeEventListener('resize', draw);
    };
  }, []);

  return (
    <div className="relative w-full h-[320px]">
      {/* Mountain canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Suitcase SVG overlay — centered */}
      <div className="absolute inset-0 flex justify-center pointer-events-none" style={{ paddingTop: '10%' }}>
        <svg
          viewBox="0 0 300 380"
          width="160"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <style>{`
            .line {
              fill: none;
              stroke: #4A6880;
              stroke-width: 17;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            .salmon-fill {
              fill: #F0A888;
              stroke: #7A95AA;
              stroke-width: 14;
              stroke-linejoin: round;
              stroke-linecap: round;
            }
            .salmon-line {
              fill: none;
              stroke: #F0A888;
              stroke-width: 11;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            @media (prefers-color-scheme: dark) {
              .line { stroke: #D0DCE8; }
              .salmon-fill { stroke: #D0DCE8; }
            }
          `}</style>

          {/* Telescoping handle */}
          <line x1="100" y1="18" x2="100" y2="80" className="line" />
          <line x1="200" y1="18" x2="200" y2="80" className="line" />
          <path d="M100 18 Q100 -14 150 -14 Q200 -14 200 18" className="line" />

          {/* Carry handle */}
          <path d="M118 80 Q118 58 150 58 Q182 58 182 80" className="line" />

          {/* Suitcase body */}
          <rect
            x="30" y="80" width="240" height="272" rx="30"
            fill="white" fillOpacity={0.55}
            stroke="#4A6880" strokeWidth="17" strokeLinejoin="round"
          />

          {/* Vertical stripes */}
          <line x1="96" y1="80" x2="96" y2="352" className="line" />
          <line x1="204" y1="80" x2="204" y2="352" className="line" />

          {/* Right side grip */}
          <path d="M270 184 Q294 184 294 206 Q294 228 270 228" className="line" />

          {/* Left side tab */}
          <rect x="16" y="192" width="14" height="36" rx="7" className="line" />

          {/* Luggage tag string */}
          <line x1="96" y1="80" x2="96" y2="106" className="salmon-line" />
          {/* Luggage tag body */}
          <path d="M72 106 L120 106 L120 166 Q96 178 72 166 Z" className="salmon-fill" />
          {/* Tag hole */}
          <circle cx="96" cy="116" r="6" fill="none" stroke="#7A95AA" strokeWidth="8" />
        </svg>
      </div>
    </div>
  );
}
