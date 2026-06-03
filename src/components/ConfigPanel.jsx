import React from 'react';
import { 
  TYPE_FACTORS, 
  GLASS_FACTORS, 
  FINISH_FACTORS, 
  HARDWARE_OPTIONS, 
  THICKNESS_OPTIONS, 
  JOINERY_OPTIONS 
} from '../utils/calculator';

export default function ConfigPanel({ 
  client, 
  onClientChange, 
  isClientFilled, 
  config, 
  onChange, 
  validationErrors, 
  onSave, 
  onGenerateQuote, 
  cost, 
  formattedCost 
}) {

  const handleDimensionChange = (field, val) => {
    onChange(field, val);
  };

  const handleIncrement = (field, amount) => {
    const currentVal = parseFloat(config[field]) || 1200;
    const newVal = Math.max(0, currentVal + amount);
    handleDimensionChange(field, newVal);
  };

  const hasErrors = Object.values(validationErrors).some(err => err !== '');

  return (
    <div className="config-scroller">
      <div className="config-container">
        
        {/* CARD 1: CLIENT DETAILS (STEP 1) */}
        <div className="panel-card">
          <div className="panel-title">
            <span>Client Information</span>
            <span className={`panel-step-badge ${isClientFilled ? 'active' : ''}`}>
              {isClientFilled ? 'Completed' : 'Step 1'}
            </span>
          </div>

          <div className="field-group">
            <label className="field-label">Client Name</label>
            <input 
              type="text" 
              value={client.name}
              onChange={(e) => onClientChange('name', e.target.value)}
              placeholder="Enter client full name" 
              className="custom-select" 
              style={{ cursor: 'text' }} 
            />
          </div>

          <div className="field-group">
            <label className="field-label">Project / Site Name</label>
            <input 
              type="text" 
              value={client.site}
              onChange={(e) => onClientChange('site', e.target.value)}
              placeholder="e.g. Khar West Apartment" 
              className="custom-select" 
              style={{ cursor: 'text' }} 
            />
          </div>

          <div className="field-group">
            <label className="field-label">Contact Number</label>
            <input 
              type="text" 
              value={client.contact}
              onChange={(e) => onClientChange('contact', e.target.value)}
              placeholder="e.g. +91 98765 43210" 
              className="custom-select" 
              style={{ cursor: 'text' }} 
            />
          </div>
        </div>

        {/* CARD 2: BASIC CONFIGURATION (STEP 2 - Locked until Step 1 filled) */}
        <div className={`panel-card ${!isClientFilled ? 'locked' : ''}`}>
          
          {!isClientFilled && (
            <div className="locked-overlay">
              <div className="locked-message">Complete Step 1 to Unlock Configuration</div>
            </div>
          )}

          <div className="panel-title">
            <span>Basic Configuration</span>
            <span className="panel-step-badge">Step 2</span>
          </div>
          
          {/* Geometries */}
          <div className="dimensions-grid">
            <div className="field-group">
              <label className="field-label">
                <span>Width (mm)</span>
                {validationErrors.width && (
                  <span className="validation-error-text">{validationErrors.width}</span>
                )}
              </label>
              <div className={`input-num-wrapper ${validationErrors.width ? 'error' : ''}`}>
                <button 
                  type="button" 
                  className="btn-num-adjust"
                  onClick={() => handleIncrement('width', -100)}
                  disabled={!isClientFilled}
                >
                  －
                </button>
                <input 
                  type="number" 
                  value={config.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  className="input-num"
                  placeholder="Width"
                  min="100"
                  disabled={!isClientFilled}
                />
                <button 
                  type="button" 
                  className="btn-num-adjust"
                  onClick={() => handleIncrement('width', 100)}
                  disabled={!isClientFilled}
                >
                  ＋
                </button>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">
                <span>Height (mm)</span>
                {validationErrors.height && (
                  <span className="validation-error-text">{validationErrors.height}</span>
                )}
              </label>
              <div className={`input-num-wrapper ${validationErrors.height ? 'error' : ''}`}>
                <button 
                  type="button" 
                  className="btn-num-adjust"
                  onClick={() => handleIncrement('height', -100)}
                  disabled={!isClientFilled}
                >
                  －
                </button>
                <input 
                  type="number" 
                  value={config.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  className="input-num"
                  placeholder="Height"
                  min="100"
                  disabled={!isClientFilled}
                />
                <button 
                  type="button" 
                  className="btn-num-adjust"
                  onClick={() => handleIncrement('height', 100)}
                  disabled={!isClientFilled}
                >
                  ＋
                </button>
              </div>
            </div>
          </div>

          {/* Window Type */}
          <div className="field-group">
            <label className="field-label">Window / Door Topology</label>
            <div className="dropdown-wrapper">
              <select 
                value={config.windowType}
                onChange={(e) => onChange('windowType', e.target.value)}
                className="custom-select"
                disabled={!isClientFilled}
              >
                <option value="">-- Select Topology --</option>
                {Object.entries(TYPE_FACTORS).map(([key, item]) => (
                  <option key={key} value={key}>{item.name}</option>
                ))}
              </select>
              <div className="dropdown-arrow">▼</div>
            </div>
          </div>

          {/* Glass Spec */}
          <div className="field-group">
            <label className="field-label">Glass Specification</label>
            <div className="dropdown-wrapper">
              <select 
                value={config.glassType}
                onChange={(e) => onChange('glassType', e.target.value)}
                className="custom-select"
                disabled={!isClientFilled}
              >
                {Object.entries(GLASS_FACTORS).map(([key, item]) => (
                  <option key={key} value={key}>{item.name} ({item.label})</option>
                ))}
              </select>
              <div className="dropdown-arrow">▼</div>
            </div>
          </div>

          {/* Hardware Lock Profile (Integrated in basic config) */}
          <div className="field-group">
            <label className="field-label">Hardware Locking Profile</label>
            <div className="dropdown-wrapper">
              <select 
                value={config.hardware}
                onChange={(e) => onChange('hardware', e.target.value)}
                className="custom-select"
                disabled={!isClientFilled}
              >
                {Object.entries(HARDWARE_OPTIONS).map(([key, item]) => (
                  <option key={key} value={key}>{item.name} {item.cost > 0 ? `(+ ₹${item.cost})` : '(Included)'}</option>
                ))}
              </select>
              <div className="dropdown-arrow">▼</div>
            </div>
          </div>

          {/* Glass Thickness (Integrated in basic config) */}
          <div className="field-group">
            <label className="field-label">Glass Thickness Option</label>
            <div className="dropdown-wrapper">
              <select 
                value={config.thickness}
                onChange={(e) => onChange('thickness', e.target.value)}
                className="custom-select"
                disabled={!isClientFilled}
              >
                {Object.entries(THICKNESS_OPTIONS).map(([key, item]) => (
                  <option key={key} value={key}>{item.name} {item.cost > 0 ? `(+ ₹${item.cost})` : '(Included)'}</option>
                ))}
              </select>
              <div className="dropdown-arrow">▼</div>
            </div>
          </div>

          {/* Profile Corner Joinery (Integrated in basic config) */}
          <div className="field-group">
            <label className="field-label">Profile Corner Joinery</label>
            <div className="dropdown-wrapper">
              <select 
                value={config.joinery}
                onChange={(e) => onChange('joinery', e.target.value)}
                className="custom-select"
                disabled={!isClientFilled}
              >
                {Object.entries(JOINERY_OPTIONS).map(([key, item]) => (
                  <option key={key} value={key}>{item.name} {item.factor > 1 ? `(+${Math.round((item.factor - 1) * 100)}% Frame Cost)` : '(Included)'}</option>
                ))}
              </select>
              <div className="dropdown-arrow">▼</div>
            </div>
          </div>

          {/* Frame Finish */}
          <div className="field-group">
            <label className="field-label">Aluminium Frame Finish</label>
            <div className="finish-grid">
              {Object.entries(FINISH_FACTORS).map(([key, item]) => {
                const isActive = config.finish === key;
                const backgroundStyle = key === 'wood' 
                  ? 'linear-gradient(45deg, #8b4513 25%, #a0522d 25%, #a0522d 50%, #8b4513 50%, #8b4513 75%, #a0522d 75%)'
                  : key === 'anodized'
                  ? 'linear-gradient(135deg, #d3d3d3, #778899)'
                  : key === 'custom'
                  ? config.customColor
                  : item.color;
                
                return (
                  <button 
                    type="button"
                    key={key}
                    className={`finish-card ${isActive ? 'active' : ''}`}
                    onClick={() => onChange('finish', key)}
                    disabled={!isClientFilled}
                    style={{ border: '1px solid var(--border-color)', textAlign: 'left' }}
                  >
                    <div 
                      className="finish-swatch" 
                      style={{ 
                        background: backgroundStyle,
                        backgroundSize: key === 'wood' ? '12px 12px' : 'auto' 
                      }}
                    />
                    <div className="finish-info">
                      <span className="finish-name">{item.name.replace("Powder Coated ", "")}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {config.finish === 'custom' && (
              <div className="custom-color-picker-container">
                <input 
                  type="color" 
                  value={config.customColor}
                  onChange={(e) => onChange('customColor', e.target.value)}
                  className="color-input-styled"
                  disabled={!isClientFilled}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="color-picker-label">Select Frame Color</span>
                  <span className="color-hex-text">{config.customColor.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mesh Toggle */}
          <div className="toggle-row">
            <div className="switch-label">
              <span className="switch-title">Fiberglass Mosquito Mesh</span>
              <span className="switch-desc">Add sliding flyscreen panel overlay</span>
            </div>
            <label className="switch">
              <input 
                type="checkbox"
                checked={config.includeMesh}
                onChange={(e) => onChange('includeMesh', e.target.checked)}
                disabled={!isClientFilled}
              />
              <span className="slider-round"></span>
            </label>
          </div>
        </div>

        {/* LIVE COST PANEL */}
        {isClientFilled && config.windowType && !hasErrors && (
          <div className="cost-panel-card">
            <div className="cost-label-group">
              <span className="cost-label">Estimated Cost</span>
              <span className="cost-badge">Dealer Pricing</span>
            </div>
            <div className="cost-value-container">
              <span className="cost-value">{formattedCost}</span>
              <span className="cost-currency-suffix">INR (Incl. GST)</span>
            </div>
            <div className="cost-note">
              <span>Price based on configured dimensions and finishes. Local haulage/installation extra.</span>
            </div>
          </div>
        )}

        {/* CONFIGURATION SUMMARY PANEL */}
        {isClientFilled && config.windowType && !hasErrors && (
          <div className="summary-card">
            <div className="panel-title" style={{ fontSize: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '14px' }}>
              <span>Specification Summary</span>
            </div>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-item-label">Window Type</span>
                <span className="summary-item-value">
                  <span className="summary-item-indicator"></span>
                  {TYPE_FACTORS[config.windowType]?.name || config.windowType}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-item-label">Glass Type</span>
                <span className="summary-item-value">
                  <span className="summary-item-indicator"></span>
                  {GLASS_FACTORS[config.glassType]?.name || config.glassType}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-item-label">Finish</span>
                <span className="summary-item-value">
                  <span className="summary-item-indicator"></span>
                  {FINISH_FACTORS[config.finish]?.name || config.finish}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-item-label">Flyscreen</span>
                <span className="summary-item-value">
                  <span className="summary-item-indicator"></span>
                  {config.includeMesh ? 'Mosquito Mesh' : 'None'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-item-label">Hardware Lock</span>
                <span className="summary-item-value">
                  <span className="summary-item-indicator"></span>
                  {HARDWARE_OPTIONS[config.hardware]?.name}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-item-label">Joinery Corner</span>
                <span className="summary-item-value">
                  <span className="summary-item-indicator"></span>
                  {JOINERY_OPTIONS[config.joinery]?.name}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-item-label">Thickness</span>
                <span className="summary-item-value">
                  <span className="summary-item-indicator"></span>
                  {THICKNESS_OPTIONS[config.thickness]?.name}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-item-label">Dimensions</span>
                <span className="summary-item-value">
                  <span className="summary-item-indicator"></span>
                  {config.width} mm x {config.height} mm
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Footer section */}
        {isClientFilled && config.windowType && !hasErrors && (
          <div className="action-buttons-group">
            <button 
              type="button" 
              className="btn-primary"
              onClick={onGenerateQuote}
            >
              Generate Quotation
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onSave}
            >
              Save Config
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
