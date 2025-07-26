import React, { useState, useEffect } from 'react';
import './DashboardBuilder.css';

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'filter';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    chartType?: 'bar' | 'line' | 'pie' | 'doughnut';
    query?: string;
    dataSource?: string;
    xAxis?: string;
    yAxis?: string;
  };
}

interface Dashboard {
  id?: string;
  title: string;
  description?: string;
  widgets: Widget[];
  layout: {
    grid: {
      columns: number;
      rows: number;
    };
  };
  isPublic: boolean;
}

const DashboardBuilder: React.FC = () => {
  const [dashboard, setDashboard] = useState<Dashboard>({
    title: 'New Dashboard',
    description: '',
    widgets: [],
    layout: {
      grid: {
        columns: 12,
        rows: 10
      }
    },
    isPublic: false
  });

  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showWidgetPanel, setShowWidgetPanel] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Widget templates
  const widgetTemplates = [
    {
      type: 'metric',
      title: 'Metric Card',
      icon: '📊',
      description: 'Display a single key metric',
      defaultConfig: {
        query: 'SELECT COUNT(*) as value FROM table',
        dataSource: 'netflix'
      }
    },
    {
      type: 'chart',
      title: 'Bar Chart',
      icon: '📊',
      description: 'Vertical bar chart visualization',
      defaultConfig: {
        chartType: 'bar',
        query: 'SELECT category, COUNT(*) as value FROM table GROUP BY category',
        dataSource: 'netflix',
        xAxis: 'category',
        yAxis: 'value'
      }
    },
    {
      type: 'chart',
      title: 'Line Chart',
      icon: '📈',
      description: 'Line chart for trends over time',
      defaultConfig: {
        chartType: 'line',
        query: 'SELECT date, COUNT(*) as value FROM table GROUP BY date ORDER BY date',
        dataSource: 'netflix',
        xAxis: 'date',
        yAxis: 'value'
      }
    },
    {
      type: 'chart',
      title: 'Pie Chart',
      icon: '🥧',
      description: 'Pie chart for proportional data',
      defaultConfig: {
        chartType: 'pie',
        query: 'SELECT category, COUNT(*) as value FROM table GROUP BY category',
        dataSource: 'netflix',
        xAxis: 'category',
        yAxis: 'value'
      }
    },
    {
      type: 'table',
      title: 'Data Table',
      icon: '📋',
      description: 'Tabular data display',
      defaultConfig: {
        query: 'SELECT * FROM table LIMIT 100',
        dataSource: 'netflix'
      }
    }
  ];

  // Sample Netflix queries for quick setup
  const sampleQueries = {
    totalContent: 'SELECT COUNT(*) as count FROM netflix_imdb',
    movieCount: "SELECT COUNT(*) as count FROM netflix_imdb WHERE type = 'Movie'",
    showCount: "SELECT COUNT(*) as count FROM netflix_imdb WHERE type = 'TV Show'",
    avgRating: 'SELECT ROUND(AVG(imdb_score), 1) as avg_score FROM netflix_imdb WHERE imdb_score IS NOT NULL',
    contentByYear: 'SELECT release_year, COUNT(*) as count FROM netflix_imdb WHERE release_year IS NOT NULL GROUP BY release_year ORDER BY release_year',
    contentByType: 'SELECT type, COUNT(*) as count FROM netflix_imdb GROUP BY type',
    topGenres: `SELECT TRIM(value) as genre, COUNT(*) as count 
                FROM netflix_imdb, json_each('[' || '"' || replace(replace(listed_in, ', ', '","'), ',', '","') || '"' || ']') 
                WHERE listed_in IS NOT NULL 
                GROUP BY TRIM(value) 
                ORDER BY count DESC 
                LIMIT 10`
  };

  // Add widget to dashboard
  const addWidget = (template: any) => {
    const newWidget: Widget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      title: template.title,
      position: {
        x: 0,
        y: 0,
        width: template.type === 'metric' ? 3 : 6,
        height: template.type === 'metric' ? 2 : 4
      },
      config: {
        ...template.defaultConfig,
        query: template.type === 'metric' 
          ? sampleQueries.totalContent 
          : template.defaultConfig.query
      }
    };

    // Find available position
    const position = findAvailablePosition(newWidget.position.width, newWidget.position.height);
    newWidget.position = { ...newWidget.position, ...position };

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));

    setSelectedWidget(newWidget);
  };

  // Find available position on grid
  const findAvailablePosition = (width: number, height: number) => {
    const { columns, rows } = dashboard.layout.grid;
    const occupied = new Set<string>();

    // Mark occupied positions
    dashboard.widgets.forEach(widget => {
      for (let x = widget.position.x; x < widget.position.x + widget.position.width; x++) {
        for (let y = widget.position.y; y < widget.position.y + widget.position.height; y++) {
          occupied.add(`${x},${y}`);
        }
      }
    });

    // Find first available position
    for (let y = 0; y <= rows - height; y++) {
      for (let x = 0; x <= columns - width; x++) {
        let canPlace = true;
        for (let dx = 0; dx < width && canPlace; dx++) {
          for (let dy = 0; dy < height && canPlace; dy++) {
            if (occupied.has(`${x + dx},${y + dy}`)) {
              canPlace = false;
            }
          }
        }
        if (canPlace) {
          return { x, y };
        }
      }
    }

    return { x: 0, y: 0 }; // Fallback to origin if no space found
  };

  // Update widget
  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget =>
        widget.id === widgetId ? { ...widget, ...updates } : widget
      )
    }));

    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Delete widget
  const deleteWidget = (widgetId: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== widgetId)
    }));

    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null);
    }
  };

  // Handle grid cell click
  const handleGridCellClick = (x: number, y: number) => {
    if (!previewMode) {
      const clickedWidget = dashboard.widgets.find(widget =>
        x >= widget.position.x &&
        x < widget.position.x + widget.position.width &&
        y >= widget.position.y &&
        y < widget.position.y + widget.position.height
      );

      setSelectedWidget(clickedWidget || null);
    }
  };

  // Save dashboard
  const saveDashboard = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/dashboards', {
        method: dashboard.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'demo-tenant'
        },
        body: JSON.stringify(dashboard)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDashboard(prev => ({ ...prev, id: result.data.id }));
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('Failed to save dashboard');
      }
    } catch (error) {
      console.error('Error saving dashboard:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Load sample Netflix dashboard
  const loadSampleDashboard = () => {
    const sampleDashboard: Dashboard = {
      title: 'Netflix Content Analytics',
      description: 'Comprehensive analytics dashboard for Netflix IMDB dataset',
      widgets: [
        {
          id: 'total-content-metric',
          type: 'metric',
          title: 'Total Content',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: {
            query: sampleQueries.totalContent,
            dataSource: 'netflix'
          }
        },
        {
          id: 'movies-metric',
          type: 'metric',
          title: 'Movies',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: {
            query: sampleQueries.movieCount,
            dataSource: 'netflix'
          }
        },
        {
          id: 'shows-metric',
          type: 'metric',
          title: 'TV Shows',
          position: { x: 6, y: 0, width: 3, height: 2 },
          config: {
            query: sampleQueries.showCount,
            dataSource: 'netflix'
          }
        },
        {
          id: 'avg-rating-metric',
          type: 'metric',
          title: 'Avg IMDB Score',
          position: { x: 9, y: 0, width: 3, height: 2 },
          config: {
            query: sampleQueries.avgRating,
            dataSource: 'netflix'
          }
        },
        {
          id: 'content-by-year-chart',
          type: 'chart',
          title: 'Content by Release Year',
          position: { x: 0, y: 2, width: 6, height: 4 },
          config: {
            chartType: 'line',
            query: sampleQueries.contentByYear,
            dataSource: 'netflix',
            xAxis: 'release_year',
            yAxis: 'count'
          }
        },
        {
          id: 'content-by-type-chart',
          type: 'chart',
          title: 'Content Distribution',
          position: { x: 6, y: 2, width: 6, height: 4 },
          config: {
            chartType: 'doughnut',
            query: sampleQueries.contentByType,
            dataSource: 'netflix',
            xAxis: 'type',
            yAxis: 'count'
          }
        }
      ],
      layout: {
        grid: {
          columns: 12,
          rows: 10
        }
      },
      isPublic: true
    };

    setDashboard(sampleDashboard);
    setSelectedWidget(null);
  };

  // Render grid
  const renderGrid = () => {
    const { columns, rows } = dashboard.layout.grid;
    const cells = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const widget = dashboard.widgets.find(w =>
          x >= w.position.x &&
          x < w.position.x + w.position.width &&
          y >= w.position.y &&
          y < w.position.y + w.position.height
        );

        const isTopLeft = widget &&
          x === widget.position.x &&
          y === widget.position.y;

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`grid-cell ${widget ? 'occupied' : 'empty'} ${
              selectedWidget?.id === widget?.id ? 'selected' : ''
            }`}
            onClick={() => handleGridCellClick(x, y)}
            style={{
              gridColumn: x + 1,
              gridRow: y + 1,
            }}
          >
            {isTopLeft && (
              <div
                className="widget-preview"
                style={{
                  gridColumn: `span ${widget.position.width}`,
                  gridRow: `span ${widget.position.height}`,
                }}
              >
                <div className="widget-header">
                  <span className="widget-title">{widget.title}</span>
                  {!previewMode && (
                    <button
                      className="widget-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWidget(widget.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="widget-content">
                  <div className="widget-type-indicator">
                    {widget.type === 'metric' && '📊'}
                    {widget.type === 'chart' && '📈'}
                    {widget.type === 'table' && '📋'}
                    {widget.type === 'filter' && '🔍'}
                  </div>
                  <div className="widget-preview-text">
                    {widget.type.charAt(0).toUpperCase() + widget.type.slice(1)}
                    {widget.type === 'chart' && widget.config.chartType && (
                      <div className="chart-type">
                        {widget.config.chartType}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    return cells;
  };

  return (
    <div className="dashboard-builder">
      {/* Header */}
      <div className="builder-header">
        <div className="header-left">
          <h1>Dashboard Builder</h1>
          <input
            type="text"
            value={dashboard.title}
            onChange={(e) => setDashboard(prev => ({ ...prev, title: e.target.value }))}
            className="dashboard-title-input"
            placeholder="Dashboard Title"
          />
        </div>
        <div className="header-actions">
          <button
            className="action-btn sample-btn"
            onClick={loadSampleDashboard}
          >
            📊 Load Netflix Sample
          </button>
          <button
            className={`action-btn preview-btn ${previewMode ? 'active' : ''}`}
            onClick={() => setPreviewMode(!previewMode)}
          >
            👁️ {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            className={`action-btn save-btn ${saveStatus}`}
            onClick={saveDashboard}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' && '⏳ Saving...'}
            {saveStatus === 'saved' && '✅ Saved!'}
            {saveStatus === 'error' && '❌ Error'}
            {saveStatus === 'idle' && '💾 Save'}
          </button>
        </div>
      </div>

      <div className="builder-content">
        {/* Widget Panel */}
        {!previewMode && (
          <div className={`widget-panel ${showWidgetPanel ? 'open' : 'closed'}`}>
            <div className="panel-header">
              <h3>Widgets</h3>
              <button
                className="panel-toggle"
                onClick={() => setShowWidgetPanel(!showWidgetPanel)}
              >
                {showWidgetPanel ? '◀' : '▶'}
              </button>
            </div>
            {showWidgetPanel && (
              <div className="widget-templates">
                {widgetTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="widget-template"
                    onClick={() => addWidget(template)}
                  >
                    <div className="template-icon">{template.icon}</div>
                    <div className="template-info">
                      <div className="template-title">{template.title}</div>
                      <div className="template-description">{template.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div className="canvas-container">
          <div className="canvas">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${dashboard.layout.grid.columns}, 1fr)`,
                gridTemplateRows: `repeat(${dashboard.layout.grid.rows}, 1fr)`,
              }}
            >
              {renderGrid()}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {!previewMode && selectedWidget && (
          <div className="properties-panel">
            <div className="panel-header">
              <h3>Widget Properties</h3>
              <button
                className="panel-close"
                onClick={() => setSelectedWidget(null)}
              >
                ×
              </button>
            </div>
            <div className="properties-content">
              <div className="property-group">
                <label>Title</label>
                <input
                  type="text"
                  value={selectedWidget.title}
                  onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
                />
              </div>

              <div className="property-group">
                <label>Type</label>
                <select
                  value={selectedWidget.type}
                  onChange={(e) => updateWidget(selectedWidget.id, { 
                    type: e.target.value as Widget['type'] 
                  })}
                >
                  <option value="metric">Metric</option>
                  <option value="chart">Chart</option>
                  <option value="table">Table</option>
                  <option value="filter">Filter</option>
                </select>
              </div>

              {selectedWidget.type === 'chart' && (
                <div className="property-group">
                  <label>Chart Type</label>
                  <select
                    value={selectedWidget.config.chartType || 'bar'}
                    onChange={(e) => updateWidget(selectedWidget.id, {
                      config: { ...selectedWidget.config, chartType: e.target.value as any }
                    })}
                  >
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                    <option value="doughnut">Doughnut</option>
                  </select>
                </div>
              )}

              <div className="property-group">
                <label>Data Source</label>
                <select
                  value={selectedWidget.config.dataSource || 'netflix'}
                  onChange={(e) => updateWidget(selectedWidget.id, {
                    config: { ...selectedWidget.config, dataSource: e.target.value }
                  })}
                >
                  <option value="netflix">Netflix Dataset</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="property-group">
                <label>Query</label>
                <textarea
                  value={selectedWidget.config.query || ''}
                  onChange={(e) => updateWidget(selectedWidget.id, {
                    config: { ...selectedWidget.config, query: e.target.value }
                  })}
                  rows={4}
                  placeholder="SELECT * FROM table"
                />
              </div>

              <div className="property-section">
                <h4>Position & Size</h4>
                <div className="property-row">
                  <div className="property-group">
                    <label>X</label>
                    <input
                      type="number"
                      min="0"
                      max={dashboard.layout.grid.columns - 1}
                      value={selectedWidget.position.x}
                      onChange={(e) => updateWidget(selectedWidget.id, {
                        position: { ...selectedWidget.position, x: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="property-group">
                    <label>Y</label>
                    <input
                      type="number"
                      min="0"
                      max={dashboard.layout.grid.rows - 1}
                      value={selectedWidget.position.y}
                      onChange={(e) => updateWidget(selectedWidget.id, {
                        position: { ...selectedWidget.position, y: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
                <div className="property-row">
                  <div className="property-group">
                    <label>Width</label>
                    <input
                      type="number"
                      min="1"
                      max={dashboard.layout.grid.columns}
                      value={selectedWidget.position.width}
                      onChange={(e) => updateWidget(selectedWidget.id, {
                        position: { ...selectedWidget.position, width: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div className="property-group">
                    <label>Height</label>
                    <input
                      type="number"
                      min="1"
                      max={dashboard.layout.grid.rows}
                      value={selectedWidget.position.height}
                      onChange={(e) => updateWidget(selectedWidget.id, {
                        position: { ...selectedWidget.position, height: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>{dashboard.widgets.length} widgets</span>
          <span>•</span>
          <span>{dashboard.layout.grid.columns}×{dashboard.layout.grid.rows} grid</span>
        </div>
        <div className="status-right">
          <span>
            {previewMode ? '👁️ Preview Mode' : '✏️ Edit Mode'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardBuilder; 