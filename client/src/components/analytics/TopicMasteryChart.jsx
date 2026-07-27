import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { pack, hierarchy } from 'd3-hierarchy';

const MIN_RADIUS = 28;
const MAX_RADIUS = 70;
const SCALE_FACTOR = 2.5;
const PADDING = 6;

function computeRadius(solved) {
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, MIN_RADIUS + Math.sqrt(solved) * SCALE_FACTOR));
}

function splitLabel(name) {
  const words = name.split(' ');
  const lines = [];
  for (const w of words) {
    if (lines.length > 0 && (lines[lines.length - 1] + ' ' + w).length <= 14) {
      lines[lines.length - 1] += ' ' + w;
    } else {
      lines.push(w);
    }
  }
  return lines;
}

function computeFontSize(r) {
  if (r < 34) return 0.5;
  if (r < 42) return 0.55;
  if (r < 52) return 0.6;
  if (r < 62) return 0.65;
  return 0.7;
}

function computeCountFontSize(r) {
  if (r < 34) return 0.45;
  if (r < 42) return 0.5;
  if (r < 52) return 0.55;
  if (r < 62) return 0.6;
  return 0.65;
}

export default function TopicMasteryChart({ data = [] }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const h = Math.min(width * 0.85, 600);
      setDimensions({ width: Math.max(width, 200), height: Math.max(h, 200) });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const packResult = useMemo(() => {
    if (data.length === 0 || dimensions.width === 0) return null;

    const leaves = data.map((d) => {
      const name = d.topic || d.name || '';
      const solved = d.solved || 0;
      const total = d.total || 1;
      return { name, solved, total, value: computeRadius(solved) };
    });

    const packLayout = pack()
      .size([dimensions.width - 20, dimensions.height - 20])
      .padding(PADDING);

    const root = hierarchy({ children: leaves }).sum((d) => d.value);
    packLayout(root);

    const nodes = root.leaves().map((node) => ({
      ...node.data,
      x: node.x + 10,
      y: node.y + 10,
      r: Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, node.r)),
    }));

    return nodes;
  }, [data, dimensions]);

  const handleMouseEnter = useCallback((e, node) => {
    setHovered(node.name);
    setTooltip({ show: true, x: e.clientX, y: e.clientY, data: node });
  }, []);

  const handleMouseMove = useCallback((e) => {
    setTooltip((prev) => (prev.show ? { ...prev, x: e.clientX, y: e.clientY } : prev));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
    setTooltip({ show: false, x: 0, y: 0, data: null });
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-surface-400">
        Solve problems to see topic mastery
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-[18px] p-6"
      style={{
        background: '#151B2D',
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: 280,
      }}
    >
      {packResult && dimensions.width > 0 && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="block mx-auto"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <defs>
            {packResult.map((node, i) => {
              const id = `clip-${i}`;
              return (
                <clipPath key={id} id={id}>
                  <circle cx={node.x} cy={node.y} r={node.r} />
                </clipPath>
              );
            })}
          </defs>

          {packResult.map((node, i) => {
            const mastery = node.total > 0 ? node.solved / node.total : 0;
            const fillH = 2 * node.r * mastery;
            const fillY = node.y + node.r - fillH;
            const isHovered = hovered === node.name;
            const isMostlyFilled = mastery >= 0.7;
            const topicColor = isMostlyFilled ? '#0F172A' : '#E5E7EB';
            const countColor = isMostlyFilled ? '#1E293B' : '#9CA3AF';

            return (
              <g
                key={node.name}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, filter 0.2s ease',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: `${node.x}px ${node.y}px`,
                  filter: isHovered
                    ? 'drop-shadow(0 0 20px rgba(126,231,135,0.18))'
                    : 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))',
                  animation: `bubble-appear 0.5s ease-out ${i * 0.06}s both`,
                }}
                onMouseEnter={(e) => handleMouseEnter(e, node)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={isHovered ? '#5B6473' : '#4B5563'}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={isHovered ? 1.5 : 1}
                />
                <rect
                  x={node.x - node.r}
                  y={fillY}
                  width={2 * node.r}
                  height={fillH}
                  fill="#6EE7B7"
                  clipPath={`url(#clip-${i})`}
                />
                <text
                  x={node.x}
                  y={node.y - 3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={topicColor}
                  fontWeight="600"
                  fontSize={`${computeFontSize(node.r)}rem`}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {splitLabel(node.name).map((line, li) => (
                    <tspan
                      key={li}
                      x={node.x}
                      dy={li === 0 ? -(splitLabel(node.name).length - 1) * 0.7 + 'em' : '0.7em'}
                    >
                      {line}
                    </tspan>
                  ))}
                  <tspan
                    x={node.x}
                    dy="0.8em"
                    fontSize={`${computeCountFontSize(node.r)}rem`}
                    fill={countColor}
                    fontWeight="500"
                  >
                    {node.solved}
                  </tspan>
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {tooltip.show && tooltip.data && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 10,
            background: '#1F2937',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            fontFamily: 'Inter, system-ui, sans-serif',
            minWidth: 150,
          }}
        >
          <p style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{tooltip.data.name}</p>
          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            <p>
              Solved:{' '}
              <span style={{ color: '#6EE7B7', fontWeight: 600 }}>{tooltip.data.solved}</span>
              <span style={{ color: '#9CA3AF' }}> / {tooltip.data.total}</span>
            </p>
            <p>
              Mastery:{' '}
              <span style={{ color: '#6EE7B7', fontWeight: 600 }}>
                {tooltip.data.total > 0 ? Math.round((tooltip.data.solved / tooltip.data.total) * 100) : 0}%
              </span>
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bubble-appear {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
