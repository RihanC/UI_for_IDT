import React, { useState, useRef, useEffect } from 'react';
import { FINISH_FACTORS, GLASS_FACTORS } from '../utils/calculator';

export default function PreviewArea({ config, validationErrors, isClientFilled }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState(0); // 3D Y-axis tilt in degrees
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const { width, height, windowType, glassType, finish, customColor, includeMesh } = config;

  // Reset zoom & pan when topology changes
  useEffect(() => {
    handleReset();
  }, [windowType]);

  const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.15));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, prev - 0.15));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setTilt(0);
  };

  // Mouse / Touch Dragging for Panning
  const handleStartDrag = (e) => {
    if (!isClientFilled || !windowType) return;
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPan({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y
    });
  };

  const handleStopDrag = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!isClientFilled || !windowType) return;
    e.preventDefault();
    const zoomFactor = 0.08;
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(3, prev + zoomFactor));
    } else {
      setZoom(prev => Math.max(0.4, prev - zoomFactor));
    }
  };

  // Bind wheel zoom listener to container
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [isClientFilled, windowType]);

  // Determine Frame Color
  let frameColor = '#FFFFFF';
  let isMetallic = false;
  let isWood = false;

  const currentFinish = FINISH_FACTORS[finish] || FINISH_FACTORS['white'];
  if (currentFinish.isCustom) {
    frameColor = customColor;
  } else {
    frameColor = currentFinish.color;
    isMetallic = currentFinish.isMetallic;
    isWood = currentFinish.isWood || finish === 'wood';
  }

  // Draw parameters (fixed bounds for SVG canvas)
  const svgWidth = 600;
  const svgHeight = 500;
  
  // Calculate relative proportions of the window
  const wVal = parseFloat(width) || 1200;
  const hVal = parseFloat(height) || 1200;
  
  // Constrain visual drawing scale based on max dimensions
  const aspect = wVal / hVal;
  let drawWidth = 320;
  let drawHeight = 320;
  
  if (aspect > 1.2) {
    drawWidth = 360;
    drawHeight = drawWidth / aspect;
  } else if (aspect < 0.8) {
    drawHeight = 340;
    drawWidth = drawHeight * aspect;
  } else {
    drawWidth = 300;
    drawHeight = 300;
  }

  drawWidth = Math.max(80, drawWidth);
  drawHeight = Math.max(80, drawHeight);

  // Centering offsets
  const xOffset = (svgWidth - drawWidth) / 2;
  const yOffset = (svgHeight - drawHeight) / 2 - 10;

  const frameThickness = 12;
  const sashThickness = 10;

  // Render elements based on Selected Topology
  const renderTopology = () => {
    switch (windowType) {
      case 'fixed':
        return (
          <g>
            <rect 
              x={xOffset} 
              y={yOffset} 
              width={drawWidth} 
              height={drawHeight} 
              fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} 
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="1.5"
              rx="2"
            />
            <rect 
              x={xOffset + frameThickness} 
              y={yOffset + frameThickness} 
              width={drawWidth - frameThickness * 2} 
              height={drawHeight - frameThickness * 2} 
              fill="url(#glass-gradient)"
              filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}
              stroke="rgba(0,0,0,0.08)"
            />
            {renderGlassReflections(
              xOffset + frameThickness, 
              yOffset + frameThickness, 
              drawWidth - frameThickness * 2, 
              drawHeight - frameThickness * 2
            )}
            {includeMesh && (
              <rect 
                x={xOffset + frameThickness} 
                y={yOffset + frameThickness} 
                width={drawWidth - frameThickness * 2} 
                height={drawHeight - frameThickness * 2} 
                fill="url(#mesh-pattern)"
                style={{ mixBlendMode: 'multiply', opacity: 0.85 }}
              />
            )}
            {glassType === 'tempered' && renderSafetyLogo(xOffset + drawWidth - 30, yOffset + drawHeight - 30)}
          </g>
        );

      case 'sliding_2t2p':
        const p1Width = (drawWidth - frameThickness * 2) / 2 + 8;
        const p2Width = (drawWidth - frameThickness * 2) / 2 + 8;
        const panelHeight = drawHeight - frameThickness * 2;
        
        return (
          <g>
            <rect 
              x={xOffset} 
              y={yOffset} 
              width={drawWidth} 
              height={drawHeight} 
              fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} 
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="2"
              rx="2"
            />
            <line x1={xOffset + frameThickness} y1={yOffset + frameThickness + 2} x2={xOffset + drawWidth - frameThickness} y2={yOffset + frameThickness + 2} stroke="#7d8997" strokeWidth="1" />
            <line x1={xOffset + frameThickness} y1={yOffset + drawHeight - frameThickness - 2} x2={xOffset + drawWidth - frameThickness} y2={yOffset + drawHeight - frameThickness - 2} stroke="#7d8997" strokeWidth="1" />

            <g transform={`translate(${xOffset + frameThickness}, ${yOffset + frameThickness})`}>
              <rect x={0} y={0} width={p1Width} height={panelHeight} fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} stroke="rgba(0,0,0,0.1)"/>
              <rect x={sashThickness} y={sashThickness} width={p1Width - sashThickness * 2} height={panelHeight - sashThickness * 2} fill="url(#glass-gradient)" filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}/>
              {renderGlassReflections(sashThickness, sashThickness, p1Width - sashThickness * 2, panelHeight - sashThickness * 2)}
              {includeMesh && (
                <rect x={sashThickness} y={sashThickness} width={p1Width - sashThickness * 2} height={panelHeight - sashThickness * 2} fill="url(#mesh-pattern)" style={{ mixBlendMode: 'multiply', opacity: 0.85 }}/>
              )}
              <path d="M 12 15 L 20 15 M 17 12 L 20 15 L 17 18" stroke="#a0aec0" strokeWidth="1.5" fill="none" />
            </g>

            <g transform={`translate(${xOffset + drawWidth - frameThickness - p2Width}, ${yOffset + frameThickness})`}>
              <rect x={0} y={0} width={p2Width} height={panelHeight} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" style={{ filter: 'drop-shadow(-3px 0 3px rgba(0,0,0,0.25))' }}/>
              <rect x={0} y={0} width={p2Width} height={panelHeight} fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} stroke="rgba(0,0,0,0.1)"/>
              <rect x={sashThickness} y={sashThickness} width={p2Width - sashThickness * 2} height={panelHeight - sashThickness * 2} fill="url(#glass-gradient)" filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}/>
              {renderGlassReflections(sashThickness, sashThickness, p2Width - sashThickness * 2, panelHeight - sashThickness * 2)}
              {includeMesh && (
                <rect x={sashThickness} y={sashThickness} width={p2Width - sashThickness * 2} height={panelHeight - sashThickness * 2} fill="url(#mesh-pattern)" style={{ mixBlendMode: 'multiply', opacity: 0.85 }}/>
              )}
              <path d="M 34 15 L 26 15 M 29 12 L 26 15 L 29 18" stroke="#a0aec0" strokeWidth="1.5" fill="none" />
              {glassType === 'tempered' && renderSafetyLogo(p2Width - 30, panelHeight - 30)}
            </g>
          </g>
        );

      case 'sliding_3t3p':
        const pWidth3 = (drawWidth - frameThickness * 2) / 3 + 12;
        const panelHeight3 = drawHeight - frameThickness * 2;
        const step = (drawWidth - frameThickness * 2 - pWidth3) / 2;
        
        return (
          <g>
            <rect 
              x={xOffset} 
              y={yOffset} 
              width={drawWidth} 
              height={drawHeight} 
              fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} 
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="2"
              rx="2"
            />
            <line x1={xOffset + frameThickness} y1={yOffset + frameThickness + 1.5} x2={xOffset + drawWidth - frameThickness} y2={yOffset + frameThickness + 1.5} stroke="#7d8997" strokeWidth="1" />
            <line x1={xOffset + frameThickness} y1={yOffset + frameThickness + 3.5} x2={xOffset + drawWidth - frameThickness} y2={yOffset + frameThickness + 3.5} stroke="#7d8997" strokeWidth="1" />
            <line x1={xOffset + frameThickness} y1={yOffset + drawHeight - frameThickness - 1.5} x2={xOffset + drawWidth - frameThickness} y2={yOffset + drawHeight - frameThickness - 1.5} stroke="#7d8997" strokeWidth="1" />

            <g transform={`translate(${xOffset + frameThickness}, ${yOffset + frameThickness})`}>
              <rect x={0} y={0} width={pWidth3} height={panelHeight3} fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} stroke="rgba(0,0,0,0.1)"/>
              <rect x={sashThickness} y={sashThickness} width={pWidth3 - sashThickness * 2} height={panelHeight3 - sashThickness * 2} fill="url(#glass-gradient)" filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}/>
              {renderGlassReflections(sashThickness, sashThickness, pWidth3 - sashThickness * 2, panelHeight3 - sashThickness * 2)}
              {includeMesh && (
                <rect x={sashThickness} y={sashThickness} width={pWidth3 - sashThickness * 2} height={panelHeight3 - sashThickness * 2} fill="url(#mesh-pattern)" style={{ mixBlendMode: 'multiply', opacity: 0.85 }}/>
              )}
            </g>

            <g transform={`translate(${xOffset + frameThickness + step}, ${yOffset + frameThickness})`} style={{ filter: 'drop-shadow(-2px 0 2px rgba(0,0,0,0.2))' }}>
              <rect x={0} y={0} width={pWidth3} height={panelHeight3} fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} stroke="rgba(0,0,0,0.1)"/>
              <rect x={sashThickness} y={sashThickness} width={pWidth3 - sashThickness * 2} height={panelHeight3 - sashThickness * 2} fill="url(#glass-gradient)" filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}/>
              {renderGlassReflections(sashThickness, sashThickness, pWidth3 - sashThickness * 2, panelHeight3 - sashThickness * 2)}
              {includeMesh && (
                <rect x={sashThickness} y={sashThickness} width={pWidth3 - sashThickness * 2} height={panelHeight3 - sashThickness * 2} fill="url(#mesh-pattern)" style={{ mixBlendMode: 'multiply', opacity: 0.85 }}/>
              )}
            </g>

            <g transform={`translate(${xOffset + drawWidth - frameThickness - pWidth3}, ${yOffset + frameThickness})`} style={{ filter: 'drop-shadow(-2px 0 2px rgba(0,0,0,0.2))' }}>
              <rect x={0} y={0} width={pWidth3} height={panelHeight3} fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} stroke="rgba(0,0,0,0.1)"/>
              <rect x={sashThickness} y={sashThickness} width={pWidth3 - sashThickness * 2} height={panelHeight3 - sashThickness * 2} fill="url(#glass-gradient)" filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}/>
              {renderGlassReflections(sashThickness, sashThickness, pWidth3 - sashThickness * 2, panelHeight3 - sashThickness * 2)}
              {includeMesh && (
                <rect x={sashThickness} y={sashThickness} width={pWidth3 - sashThickness * 2} height={panelHeight3 - sashThickness * 2} fill="url(#mesh-pattern)" style={{ mixBlendMode: 'multiply', opacity: 0.85 }}/>
              )}
              {glassType === 'tempered' && renderSafetyLogo(pWidth3 - 30, panelHeight3 - 30)}
            </g>
          </g>
        );

      case 'casement':
        const innerW = drawWidth - frameThickness * 2;
        const innerH = drawHeight - frameThickness * 2;
        
        return (
          <g>
            <rect 
              x={xOffset} 
              y={yOffset} 
              width={drawWidth} 
              height={drawHeight} 
              fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} 
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="2"
              rx="2"
            />
            <rect 
              x={xOffset + frameThickness} 
              y={yOffset + frameThickness} 
              width={innerW} 
              height={innerH} 
              fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} 
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="1.5"
            />
            <rect 
              x={xOffset + frameThickness + sashThickness} 
              y={yOffset + frameThickness + sashThickness} 
              width={innerW - sashThickness * 2} 
              height={innerH - sashThickness * 2} 
              fill="url(#glass-gradient)"
              filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}
            />
            {renderGlassReflections(
              xOffset + frameThickness + sashThickness, 
              yOffset + frameThickness + sashThickness, 
              innerW - sashThickness * 2, 
              innerH - sashThickness * 2
            )}
            {includeMesh && (
              <rect 
                x={xOffset + frameThickness + sashThickness} 
                y={yOffset + frameThickness + sashThickness} 
                width={innerW - sashThickness * 2} 
                height={innerH - sashThickness * 2} 
                fill="url(#mesh-pattern)"
                style={{ mixBlendMode: 'multiply', opacity: 0.85 }}
              />
            )}
            
            <polyline 
              points={`
                ${xOffset + frameThickness + sashThickness},${yOffset + frameThickness + sashThickness} 
                ${xOffset + innerW + frameThickness - sashThickness},${yOffset + (innerH / 2) + frameThickness} 
                ${xOffset + frameThickness + sashThickness},${yOffset + innerH + frameThickness - sashThickness}
              `}
              fill="none" 
              stroke="#cbd5e0" 
              strokeWidth="1.2" 
              strokeDasharray="4 3" 
              opacity="0.85"
            />
            
            <rect x={xOffset + innerW + frameThickness - sashThickness - 8} y={yOffset + (innerH / 2) + frameThickness - 15} width={4} height={30} rx="1" fill="#7d8997" />
            <path d={`M ${xOffset + innerW + frameThickness - sashThickness - 6} ${yOffset + (innerH / 2) + frameThickness} L ${xOffset + innerW + frameThickness - sashThickness - 18} ${yOffset + (innerH / 2) + frameThickness}`} stroke="#7d8997" strokeWidth="2.5" strokeLinecap="round" />
            
            {glassType === 'tempered' && renderSafetyLogo(xOffset + innerW + frameThickness - sashThickness - 20, yOffset + innerH + frameThickness - sashThickness - 20)}
          </g>
        );

      case 'single_door':
        const dInnerW = drawWidth - frameThickness * 2;
        const dInnerH = drawHeight - frameThickness * 2;
        
        return (
          <g>
            <path 
              d={`M ${xOffset} ${yOffset + drawHeight} L ${xOffset} ${yOffset} L ${xOffset + drawWidth} ${yOffset} L ${xOffset + drawWidth} ${yOffset + drawHeight}`} 
              fill="none"
              stroke={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} 
              strokeWidth={frameThickness * 2}
              strokeLinejoin="miter"
            />
            <rect 
              x={xOffset + frameThickness} 
              y={yOffset + frameThickness} 
              width={dInnerW} 
              height={dInnerH} 
              fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} 
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="2"
            />
            <rect 
              x={xOffset + frameThickness + sashThickness * 1.5} 
              y={yOffset + frameThickness + sashThickness * 1.5} 
              width={dInnerW - sashThickness * 3} 
              height={dInnerH - sashThickness * 3} 
              fill="url(#glass-gradient)"
              filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}
            />
            {renderGlassReflections(
              xOffset + frameThickness + sashThickness * 1.5, 
              yOffset + frameThickness + sashThickness * 1.5, 
              dInnerW - sashThickness * 3, 
              dInnerH - sashThickness * 3
            )}
            {includeMesh && (
              <rect 
                x={xOffset + frameThickness + sashThickness * 1.5} 
                y={yOffset + frameThickness + sashThickness * 1.5} 
                width={dInnerW - sashThickness * 3} 
                height={dInnerH - sashThickness * 3} 
                fill="url(#mesh-pattern)"
                style={{ mixBlendMode: 'multiply', opacity: 0.85 }}
              />
            )}
            
            <polyline 
              points={`
                ${xOffset + frameThickness + sashThickness * 1.5},${yOffset + frameThickness + sashThickness * 1.5} 
                ${xOffset + dInnerW + frameThickness - sashThickness * 1.5},${yOffset + (dInnerH / 2) + frameThickness} 
                ${xOffset + frameThickness + sashThickness * 1.5},${yOffset + dInnerH + frameThickness - sashThickness * 1.5}
              `}
              fill="none" 
              stroke="#cbd5e0" 
              strokeWidth="1.2" 
              strokeDasharray="4 3" 
              opacity="0.85"
            />

            <g transform={`translate(${xOffset + dInnerW + frameThickness - sashThickness * 2.5}, ${yOffset + (dInnerH / 2) + frameThickness - 25})`}>
              <rect x="0" y="0" width="4" height="50" rx="1.5" fill="#a0aec0" stroke="#333" strokeWidth="0.5" />
              <rect x="-8" y="10" width="12" height="6" rx="1" fill="#7d8997" />
              <circle cx="2" cy="40" r="2" fill="#555" />
            </g>
            {glassType === 'tempered' && renderSafetyLogo(xOffset + dInnerW - 20, yOffset + dInnerH - 20)}
          </g>
        );

      case 'double_door':
        const ddInnerW = drawWidth - frameThickness * 2;
        const ddInnerH = drawHeight - frameThickness * 2;
        const leafWidth = ddInnerW / 2;

        return (
          <g>
            <path 
              d={`M ${xOffset} ${yOffset + drawHeight} L ${xOffset} ${yOffset} L ${xOffset + drawWidth} ${yOffset} L ${xOffset + drawWidth} ${yOffset + drawHeight}`} 
              fill="none"
              stroke={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} 
              strokeWidth={frameThickness * 2}
              strokeLinejoin="miter"
            />

            <g transform={`translate(${xOffset + frameThickness}, ${yOffset + frameThickness})`}>
              <rect x="0" y="0" width={leafWidth} height={ddInnerH} fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"/>
              <rect x={sashThickness * 1.5} y={sashThickness * 1.5} width={leafWidth - sashThickness * 2.5} height={ddInnerH - sashThickness * 3} fill="url(#glass-gradient)" filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}/>
              {renderGlassReflections(sashThickness * 1.5, sashThickness * 1.5, leafWidth - sashThickness * 2.5, ddInnerH - sashThickness * 3)}
              {includeMesh && (
                <rect x={sashThickness * 1.5} y={sashThickness * 1.5} width={leafWidth - sashThickness * 2.5} height={ddInnerH - sashThickness * 3} fill="url(#mesh-pattern)" style={{ mixBlendMode: 'multiply', opacity: 0.85 }}/>
              )}
              <polyline points={`0,${sashThickness * 1.5} ${leafWidth},${ddInnerH / 2} 0,${ddInnerH - sashThickness * 1.5}`} fill="none" stroke="#cbd5e0" strokeWidth="1" strokeDasharray="3 3" opacity="0.85"/>
            </g>

            <g transform={`translate(${xOffset + frameThickness + leafWidth}, ${yOffset + frameThickness})`}>
              <rect x="0" y="0" width={leafWidth} height={ddInnerH} fill={isMetallic ? "url(#metallic-frame)" : (isWood ? "url(#wood-frame)" : frameColor)} stroke="rgba(0,0,0,0.15)" strokeWidth="1.5"/>
              <rect x={sashThickness} y={sashThickness * 1.5} width={leafWidth - sashThickness * 2.5} height={ddInnerH - sashThickness * 3} fill="url(#glass-gradient)" filter={glassType === 'frosted' ? "url(#frosted-blur-filter)" : ""}/>
              {renderGlassReflections(sashThickness, sashThickness * 1.5, leafWidth - sashThickness * 2.5, ddInnerH - sashThickness * 3)}
              {includeMesh && (
                <rect x={sashThickness} y={sashThickness * 1.5} width={leafWidth - sashThickness * 2.5} height={ddInnerH - sashThickness * 3} fill="url(#mesh-pattern)" style={{ mixBlendMode: 'multiply', opacity: 0.85 }}/>
              )}
              <polyline points={`${leafWidth},${sashThickness * 1.5} 0,${ddInnerH / 2} ${leafWidth},${ddInnerH - sashThickness * 1.5}`} fill="none" stroke="#cbd5e0" strokeWidth="1" strokeDasharray="3 3" opacity="0.85"/>

              <g transform={`translate(2, ${ddInnerH / 2 - 25})`}>
                <rect x="-8" y="0" width="3" height="50" rx="1" fill="#a0aec0" stroke="#333" strokeWidth="0.5"/>
                <rect x="-8" y="10" width="10" height="5" rx="1" fill="#7d8997" transform="scale(-1, 1) translate(-2, 0)"/>
                
                <rect x="5" y="0" width="3" height="50" rx="1" fill="#a0aec0" stroke="#333" strokeWidth="0.5"/>
                <rect x="5" y="10" width="10" height="5" rx="1" fill="#7d8997"/>
              </g>
              {glassType === 'tempered' && renderSafetyLogo(leafWidth - 25, ddInnerH - 25)}
            </g>
          </g>
        );

      default:
        return null;
    }
  };

  const renderGlassReflections = (x, y, w, h) => {
    let shineOpacity = 0.55;
    let glossStroke = "#FFFFFF";

    if (glassType === 'tinted') {
      shineOpacity = 0.3;
      glossStroke = "#E0F7FA";
    }

    return (
      <g opacity={shineOpacity} style={{ pointerEvents: 'none' }}>
        <line x1={x + w * 0.15} y1={y + h * 0.15} x2={x + w * 0.55} y2={y + h * 0.55} stroke={glossStroke} strokeWidth="1.5" strokeLinecap="round" />
        <line x1={x + w * 0.22} y1={y + h * 0.15} x2={x + w * 0.42} y2={y + h * 0.35} stroke={glossStroke} strokeWidth="1" strokeLinecap="round" />
        <line x1={x + w * 0.58} y1={y + h * 0.58} x2={x + w * 0.85} y2={y + h * 0.85} stroke={glossStroke} strokeWidth="1.5" strokeLinecap="round" />
        <line x1={x + w * 0.65} y1={y + h * 0.58} x2={x + w * 0.77} y2={y + h * 0.7} stroke={glossStroke} strokeWidth="0.8" strokeLinecap="round" />
        
        {glassType === 'laminated' && (
          <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill="none" stroke="rgba(100, 255, 218, 0.25)" strokeWidth="1.5" />
        )}
      </g>
    );
  };

  const renderSafetyLogo = (x, y) => (
    <g transform={`translate(${x}, ${y})`} opacity="0.35" style={{ pointerEvents: 'none' }}>
      <circle cx="8" cy="8" r="6" stroke="#000" strokeWidth="0.8" fill="none" strokeDasharray="1.5 1.5" />
      <text x="8" y="11" fontFamily="sans-serif" fontSize="8" fontWeight="bold" textAnchor="middle">T</text>
    </g>
  );

  return (
    <div className="preview-workspace">
      <div className="preview-card">
        <div className="preview-header">
          <div className="preview-title">
            {isClientFilled && windowType && <span className="status-dot"></span>}
            <span>Interactive Blueprint Render</span>
          </div>
          {isClientFilled && windowType && (
            <div className="zoom-indicator">Zoom: {Math.round(zoom * 100)}%</div>
          )}
        </div>

        <div 
          ref={containerRef}
          className="preview-canvas-container"
          onMouseDown={handleStartDrag}
          onMouseMove={handleDrag}
          onMouseUp={handleStopDrag}
          onMouseLeave={handleStopDrag}
          onTouchStart={handleStartDrag}
          onTouchMove={handleDrag}
          onTouchEnd={handleStopDrag}
        >
          {isClientFilled && windowType && !validationErrors.width && !validationErrors.height && (
            <>
              {/* Width HUD */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#111827',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                fontFamily: 'Space Grotesk',
                border: '1px solid #374151',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 5
              }}>
                Width: {width} mm
              </div>

              {/* Height HUD */}
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%) rotate(90deg)',
                transformOrigin: 'center right',
                background: '#111827',
                color: '#ffffff',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                fontFamily: 'Space Grotesk',
                border: '1px solid #374151',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 5,
                marginRight: '22px'
              }}>
                Height: {height} mm
              </div>
            </>
          )}

          <div 
            className="cad-svg-wrapper"
            style={{
              transform: `perspective(1000px) rotateY(${tilt}deg)`
            }}
          >
            {!isClientFilled ? (
              /* Step 1 Locked state */
              <div className="empty-state-canvas">
                <svg className="empty-state-graphic" viewBox="0 0 100 80">
                  <rect x="10" y="10" width="80" height="60" rx="4" stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
                  <circle cx="50" cy="40" r="10" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
                  <path d="M 50 35 L 50 45 M 45 40 L 55 40" stroke="#d1d5db" strokeWidth="1.5" />
                </svg>
                <div>
                  <h3 className="empty-state-title">Enter Client Details to Begin</h3>
                  <p className="empty-state-desc">Please complete the Client Information form in Step 1 to unlock the configurator options.</p>
                </div>
              </div>
            ) : !windowType ? (
              /* Step 2 Selection state */
              <div className="empty-state-canvas">
                <svg className="empty-state-graphic" viewBox="0 0 100 80">
                  <rect x="10" y="10" width="80" height="60" rx="4" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                  <line x1="50" y1="10" x2="50" y2="70" stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M 30 40 L 70 40" stroke="#9ca3af" strokeWidth="1.5" />
                </svg>
                <div>
                  <h3 className="empty-state-title">Start configuring your window</h3>
                  <p className="empty-state-desc">Select a window or door topology and specify dimensions in Step 2 to render the dynamic CAD blueprint.</p>
                </div>
              </div>
            ) : (
              <svg 
                className="cad-svg-render"
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
              >
                <defs>
                  <filter id="frosted-blur-filter">
                    <feGaussianBlur stdDeviation="6" />
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
                  </filter>
                  
                  <pattern id="mesh-pattern" width="5" height="5" patternUnits="userSpaceOnUse">
                    <rect width="5" height="5" fill="none" />
                    <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(31,41,55,0.3)" strokeWidth="0.7" />
                  </pattern>

                  <linearGradient id="metallic-frame" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d5dbe2" />
                    <stop offset="30%" stopColor="#a5b3c1" />
                    <stop offset="50%" stopColor="#eef2f5" />
                    <stop offset="70%" stopColor="#96a5b5" />
                    <stop offset="100%" stopColor="#b4c2d0" />
                  </linearGradient>

                  <linearGradient id="wood-frame" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8E4A23" />
                    <stop offset="25%" stopColor="#703613" />
                    <stop offset="50%" stopColor="#9E562F" />
                    <stop offset="75%" stopColor="#5C2B0E" />
                    <stop offset="100%" stopColor="#7E3F1C" />
                  </linearGradient>

                  <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    {glassType === 'tinted' ? (
                      <>
                        <stop offset="0%" stopColor="#1e252b" />
                        <stop offset="50%" stopColor="#2c363f" />
                        <stop offset="100%" stopColor="#12171c" />
                      </>
                    ) : glassType === 'frosted' ? (
                      <>
                        <stop offset="0%" stopColor="#eef2f5" />
                        <stop offset="100%" stopColor="#cfdadf" />
                      </>
                    ) : glassType === 'laminated' ? (
                      <>
                        <stop offset="0%" stopColor="#d5f5f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#9de1e5" stopOpacity="0.8" />
                      </>
                    ) : (
                      <>
                        <stop offset="0%" stopColor="#e0f7fa" stopOpacity="0.6" />
                        <stop offset="50%" stopColor="#b2ebf2" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#e0f7fa" stopOpacity="0.5" />
                      </>
                    )}
                  </linearGradient>

                  <marker id="arrow-start" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 10 0 L 0 5 L 10 10 z" fill="#9ca3af" />
                  </marker>
                  <marker id="arrow-end" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
                  </marker>
                </defs>

                <g stroke="#f3f4f6" strokeWidth="0.5" strokeDasharray="3 3">
                  <line x1={xOffset} y1={0} x2={xOffset} y2={svgHeight} />
                  <line x1={xOffset + drawWidth} y1={0} x2={xOffset + drawWidth} y2={svgHeight} />
                  <line x1={0} y1={yOffset} x2={svgWidth} y2={yOffset} />
                  <line x1={0} y1={yOffset + drawHeight} x2={svgWidth} y2={yOffset + drawHeight} />
                </g>

                {renderTopology()}

                {/* Width Arrow */}
                <g>
                  <line x1={xOffset} y1={yOffset + drawHeight + 8} x2={xOffset} y2={yOffset + drawHeight + 35} stroke="#e5e7eb" strokeWidth="1" />
                  <line x1={xOffset + drawWidth} y1={yOffset + drawHeight + 8} x2={xOffset + drawWidth} y2={yOffset + drawHeight + 35} stroke="#e5e7eb" strokeWidth="1" />
                  <line 
                    x1={xOffset} 
                    y1={yOffset + drawHeight + 25} 
                    x2={xOffset + drawWidth} 
                    y2={yOffset + drawHeight + 25} 
                    stroke="#9ca3af" 
                    strokeWidth="1.2" 
                    markerStart="url(#arrow-start)" 
                    markerEnd="url(#arrow-end)" 
                  />
                  <rect x={xOffset + drawWidth/2 - 40} y={yOffset + drawHeight + 17} width="80" height="16" fill="#ffffff" rx="2" />
                  <text 
                    x={xOffset + drawWidth / 2} 
                    y={yOffset + drawHeight + 29} 
                    textAnchor="middle" 
                    className="dimension-label"
                  >
                    {width} mm
                  </text>
                </g>

                {/* Height Arrow */}
                <g>
                  <line x1={xOffset - 8} y1={yOffset} x2={xOffset - 35} y2={yOffset} stroke="#e5e7eb" strokeWidth="1" />
                  <line x1={xOffset - 8} y1={yOffset + drawHeight} x2={xOffset - 35} y2={yOffset + drawHeight} stroke="#e5e7eb" strokeWidth="1" />
                  <line 
                    x1={xOffset - 25} 
                    y1={yOffset} 
                    x2={xOffset - 25} 
                    y2={yOffset + drawHeight} 
                    stroke="#9ca3af" 
                    strokeWidth="1.2" 
                    markerStart="url(#arrow-start)" 
                    markerEnd="url(#arrow-end)" 
                  />
                  <rect x={xOffset - 55} y={yOffset + drawHeight/2 - 8} width="60" height="16" fill="#ffffff" rx="2" />
                  <text 
                    x={xOffset - 25} 
                    y={yOffset + drawHeight / 2 + 4} 
                    textAnchor="middle" 
                    transform={`rotate(-90 ${xOffset - 25} ${yOffset + drawHeight / 2})`}
                    className="dimension-label"
                  >
                    {height} mm
                  </text>
                </g>
              </svg>
            )}
          </div>
        </div>

        {/* Zoom controls */}
        {isClientFilled && windowType && (
          <div className="canvas-controls-overlay">
            <div className="control-cluster vertical">
              <button className="btn-canvas" onClick={handleZoomIn} title="Zoom In">
                <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button className="btn-canvas" onClick={handleZoomOut} title="Zoom Out" disabled={zoom <= 0.4}>
                <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <button className="btn-canvas" onClick={handleReset} title="Reset View">
                <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>
              </button>
            </div>
          </div>
        )}

        {/* 3D tilt */}
        {isClientFilled && windowType && (
          <div className="canvas-3d-overlay">
            <label>3D Tilt</label>
            <input 
              type="range" 
              min="-28" 
              max="28" 
              value={tilt} 
              onChange={(e) => setTilt(parseFloat(e.target.value))} 
              className="slider-tilt"
              title="Tilt visual representation"
            />
          </div>
        )}
      </div>
    </div>
  );
}
