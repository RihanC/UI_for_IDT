import React, { useState, useEffect } from 'react';
import PreviewArea from './components/PreviewArea';
import ConfigPanel from './components/ConfigPanel';
import { 
  calculateCost, 
  formatCurrency, 
  TYPE_FACTORS, 
  GLASS_FACTORS, 
  FINISH_FACTORS,
  HARDWARE_OPTIONS,
  THICKNESS_OPTIONS,
  JOINERY_OPTIONS
} from './utils/calculator';
import './App.css';

export default function App() {
  // Client Details state (Step 1)
  const [client, setClient] = useState({
    name: '',
    site: '',
    contact: ''
  });

  // Configurator state (Step 2)
  const [config, setConfig] = useState({
    width: 1200,
    height: 1200,
    windowType: '', // Start empty to trigger placeholder
    glassType: 'clear',
    finish: 'white',
    customColor: '#4A90E2',
    includeMesh: false,
    hardware: 'standard',
    thickness: '5mm',
    joinery: '90deg'
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({
    width: '',
    height: '',
  });

  // Live calculated cost states
  const [cost, setCost] = useState(0);
  const [formattedCost, setFormattedCost] = useState('₹0');

  // History & Modal overlays
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [toasts, setToasts] = useState([]);

  const isClientFilled = client.name.trim() !== '' && client.site.trim() !== '' && client.contact.trim() !== '';

  // Load saved projects on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aluconfig_projects');
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved projects", e);
    }
  }, []);

  // Recalculate cost when config changes
  useEffect(() => {
    const wVal = parseFloat(config.width);
    const hVal = parseFloat(config.height);
    
    let wErr = '';
    let hErr = '';

    if (!config.width || isNaN(wVal)) {
      wErr = 'Width is required';
    } else if (wVal < 100) {
      wErr = 'Min 100 mm';
    } else if (wVal <= 0) {
      wErr = 'Must be positive';
    }

    if (!config.height || isNaN(hVal)) {
      hErr = 'Height is required';
    } else if (hVal < 100) {
      hErr = 'Min 100 mm';
    } else if (hVal <= 0) {
      hErr = 'Must be positive';
    }

    setValidationErrors({ width: wErr, height: hErr });

    if (!wErr && !hErr && config.windowType && isClientFilled) {
      const calculated = calculateCost(
        config.width,
        config.height,
        config.windowType,
        config.glassType,
        config.finish,
        config.includeMesh,
        config.hardware,
        config.thickness,
        config.joinery
      );
      setCost(calculated);
      setFormattedCost(formatCurrency(calculated));
    } else {
      setCost(0);
      setFormattedCost('₹0');
    }
  }, [config, client, isClientFilled]);

  // Handle configuration changes
  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle client information changes
  const handleClientChange = (field, value) => {
    setClient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toast notifier helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Save active configuration to local storage
  const handleSaveProject = () => {
    if (!isClientFilled) {
      showToast("Cannot save: Complete client details first", "error");
      return;
    }
    if (!config.windowType) {
      showToast("Cannot save: Select a window type first", "error");
      return;
    }

    const typeLabel = TYPE_FACTORS[config.windowType]?.name || config.windowType;
    const projectTitle = `${client.name} - ${client.site} (${typeLabel})`;

    const newProject = {
      id: Date.now().toString(),
      name: projectTitle,
      client: { ...client },
      date: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      config: { ...config },
      cost
    };

    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem('aluconfig_projects', JSON.stringify(updated));
    showToast("Project configuration saved successfully");
  };

  // Load a project from history
  const handleLoadProject = (project) => {
    setClient(project.client || { name: '', site: '', contact: '' });
    setConfig(project.config);
    setIsHistoryOpen(false);
    showToast(`Loaded configuration for ${project.client?.name || 'Client'}`);
  };

  // Delete a project from history
  const handleDeleteProject = (e, id) => {
    e.stopPropagation();
    const confirmed = window.confirm("Delete this saved configuration?");
    if (!confirmed) return;

    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('aluconfig_projects', JSON.stringify(updated));
    showToast("Configuration deleted", "error");
  };

  return (
    <div className="app-container">
      
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">AC</div>
          <div className="brand-title">
            <h1>AluCraft Configurator</h1>
            <div className="brand-subtitle">Architectural Window & Door Planner</div>
          </div>
        </div>

        <div className="header-controls">
          {/* History Drawer Toggle */}
          <button 
            type="button" 
            className="btn-icon" 
            onClick={() => setIsHistoryOpen(true)}
            title="Saved projects history"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Saved ({savedProjects.length})</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD SPLIT WORKSPACE */}
      <main className="dashboard-grid">
        
        {/* Section 1: Live Preview (Left on desktop) */}
        <PreviewArea 
          config={config} 
          validationErrors={validationErrors} 
          isClientFilled={isClientFilled}
        />

        {/* Section 2: Form Controls & Calculations (Right on desktop) */}
        <ConfigPanel 
          client={client}
          onClientChange={handleClientChange}
          isClientFilled={isClientFilled}
          config={config}
          onChange={handleConfigChange}
          validationErrors={validationErrors}
          cost={cost}
          formattedCost={formattedCost}
          onSave={handleSaveProject}
          onGenerateQuote={() => setIsQuoteOpen(true)}
        />

      </main>

      {/* HISTORY SLIDER DRAWER */}
      {isHistoryOpen && <div className="drawer-backdrop" onClick={() => setIsHistoryOpen(false)} />}
      <div className={`history-drawer ${isHistoryOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Saved Configurations</span>
          <button type="button" className="btn-icon" onClick={() => setIsHistoryOpen(false)} style={{ padding: '0 8px', height: '32px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="drawer-scroller">
          {savedProjects.length > 0 ? (
            savedProjects.map(proj => (
              <div 
                key={proj.id} 
                className="project-item-card"
                onClick={() => handleLoadProject(proj)}
              >
                <div className="project-item-header">
                  <span className="project-item-name">{proj.name}</span>
                  <span className="project-item-date">{proj.date}</span>
                </div>
                <div className="project-item-summary">
                  {TYPE_FACTORS[proj.config.windowType]?.name || proj.config.windowType} • {proj.config.width}x{proj.config.height}mm • {GLASS_FACTORS[proj.config.glassType]?.name} • {HARDWARE_OPTIONS[proj.config.hardware]?.name}
                </div>
                <div className="project-item-footer">
                  <span className="project-item-price">{formatCurrency(proj.cost)}</span>
                  <button 
                    type="button" 
                    className="btn-delete-project"
                    onClick={(e) => handleDeleteProject(e, proj.id)}
                    title="Delete configuration"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5" fill="none" stroke="currentColor">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="drawer-empty-state">
              <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" style={{ opacity: 0.5 }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <p>No saved projects yet.<br/>Save configurations to store your history.</p>
            </div>
          )}
        </div>
      </div>

      {/* QUOTATION MODAL VIEW */}
      {isQuoteOpen && (
        <div className="modal-overlay" onClick={() => setIsQuoteOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Commercial Quotation Draft</span>
              <button type="button" className="btn-icon" onClick={() => setIsQuoteOpen(false)} style={{ padding: '0 8px', height: '32px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="modal-body">
              {/* Printable Invoice Sheet */}
              <div className="quote-invoice" id="quote-invoice-print">
                <div className="invoice-header">
                  <div className="invoice-company-info">
                    <h2>ALUCRAFT INDUSTRIES</h2>
                    <p>High-Performance Architectural Glazing Solutions</p>
                    <p>Phase II, Industrial Area, Mumbai, IN</p>
                    <p>Email: sales@alucraft.com | Tel: +91 22 5550 4930</p>
                  </div>
                  <div className="invoice-meta">
                    <div className="invoice-title">ESTIMATE</div>
                    <p><strong>Quote No:</strong> AC-{Math.floor(100000 + Math.random() * 900000)}</p>
                    <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
                    <p><strong>Validity:</strong> 30 Days</p>
                  </div>
                </div>

                <div className="invoice-notes" style={{ borderTop: 'none', borderBottom: '1px solid #dfe3e8', paddingBottom: '12px', marginBottom: '20px' }}>
                  <p><strong>Client Name:</strong> {client.name}</p>
                  <p><strong>Site Location:</strong> {client.site}</p>
                  <p><strong>Contact Number:</strong> {client.contact}</p>
                </div>

                <table className="invoice-details-table">
                  <thead>
                    <tr>
                      <th>Product / Specification Description</th>
                      <th style={{ textAlign: 'center' }}>Dimensions</th>
                      <th style={{ textAlign: 'right' }}>Unit Rate (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>{TYPE_FACTORS[config.windowType]?.name || config.windowType}</strong>
                        <div style={{ fontSize: '11px', color: '#555c66', marginTop: '4px', lineHeight: '1.5' }}>
                          • Frame Finish: {FINISH_FACTORS[config.finish]?.name} {config.finish === 'custom' ? `(${config.customColor})` : ''}<br/>
                          • Glass: {GLASS_FACTORS[config.glassType]?.name} ({THICKNESS_OPTIONS[config.thickness]?.name})<br/>
                          • Lock Profile: {HARDWARE_OPTIONS[config.hardware]?.name}<br/>
                          • Joinery Style: {JOINERY_OPTIONS[config.joinery]?.name}<br/>
                          • Flyscreen: {config.includeMesh ? 'Fiberglass Mosquito Mesh Screen Included' : 'None'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'top', fontFamily: 'Space Grotesk' }}>
                        {config.width} w x {config.height} h <span style={{ fontSize: '10px', color: '#777' }}>mm</span>
                      </td>
                      <td style={{ textAlign: 'right', verticalAlign: 'top', fontFamily: 'Space Grotesk', fontWeight: 'bold' }}>
                        {formattedCost}
                      </td>
                    </tr>
                    
                    <tr className="invoice-total-row">
                      <td colSpan="2" style={{ textAlign: 'right', fontWeight: 'bold' }}>Grand Total (All Inclusive):</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk' }}>{formattedCost}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="invoice-notes">
                  <p><strong>Terms and Conditions:</strong></p>
                  <p>1. Prices are inclusive of Goods and Services Tax (GST) at standard rates.</p>
                  <p>2. Final measurements must be vetted by an AluCraft installation engineer before production begins.</p>
                  <p>3. Delivery timeline: 14 to 21 working days from confirmation deposit receipt.</p>
                  <p>4. Payment terms: 50% advance for raw materials booking, remaining 50% on dispatch delivery.</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsQuoteOpen(false)}>Close</button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => window.print()} 
                style={{ width: 'auto', padding: '10px 24px' }}
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST MESSAGES */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
