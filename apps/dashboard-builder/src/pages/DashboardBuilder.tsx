import React, { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { Plus, Save, Eye, Settings, Trash2, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { useDashboard } from '../hooks/useDashboard'
import { useWidgets } from '../hooks/useWidgets'
import WidgetLibrary from '../components/WidgetLibrary'
import WidgetEditor from '../components/WidgetEditor'
import DashboardSettings from '../components/DashboardSettings'
import WidgetRenderer from '../components/WidgetRenderer'
import LoadingSpinner from '../components/LoadingSpinner'
import Button from '../components/Button'
import type { Widget, DashboardLayout } from '@platform/shared-types'

const ResponsiveGridLayout = WidthProvider(Responsive)

const DashboardBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  // State
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null)
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Hooks
  const {
    dashboard,
    isLoading: dashboardLoading,
    updateDashboard,
    createDashboard,
    publishDashboard,
  } = useDashboard(id)

  const {
    widgets,
    isLoading: widgetsLoading,
    createWidget,
    updateWidget,
    deleteWidget,
    reorderWidgets,
  } = useWidgets(id)

  const isLoading = dashboardLoading || widgetsLoading

  // Layout configuration
  const layouts = dashboard?.layout || {}
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }

  // Handlers
  const handleLayoutChange = useCallback((layout: any, layouts: any) => {
    if (!dashboard || isDragging) return

    const updatedLayout = {
      ...dashboard.layout,
      ...layouts,
    }

    updateDashboard.mutate({
      id: dashboard.id,
      layout: updatedLayout,
    })
  }, [dashboard, updateDashboard, isDragging])

  const handleAddWidget = useCallback((widgetType: string) => {
    if (!dashboard) return

    const newWidget = {
      name: `New ${widgetType}`,
      type: widgetType,
      dashboardId: dashboard.id,
      config: getDefaultWidgetConfig(widgetType),
      position: getNextAvailablePosition(widgets),
    }

    createWidget.mutate(newWidget, {
      onSuccess: () => {
        setShowWidgetLibrary(false)
        toast.success('Widget added successfully')
      },
      onError: () => {
        toast.error('Failed to add widget')
      },
    })
  }, [dashboard, widgets, createWidget])

  const handleEditWidget = useCallback((widget: Widget) => {
    setSelectedWidget(widget)
  }, [])

  const handleUpdateWidget = useCallback((widgetId: string, updates: Partial<Widget>) => {
    updateWidget.mutate({
      id: widgetId,
      ...updates,
    }, {
      onSuccess: () => {
        setSelectedWidget(null)
        toast.success('Widget updated successfully')
      },
      onError: () => {
        toast.error('Failed to update widget')
      },
    })
  }, [updateWidget])

  const handleDeleteWidget = useCallback((widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return

    deleteWidget.mutate(widgetId, {
      onSuccess: () => {
        toast.success('Widget deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete widget')
      },
    })
  }, [deleteWidget])

  const handleSaveDashboard = useCallback(async () => {
    if (!dashboard) return

    try {
      if (isEdit) {
        await updateDashboard.mutateAsync({
          id: dashboard.id,
          version: dashboard.version + 1,
        })
        toast.success('Dashboard saved successfully')
      } else {
        const newDashboard = await createDashboard.mutateAsync({
          name: dashboard.name || 'Untitled Dashboard',
          description: dashboard.description,
          layout: dashboard.layout,
          theme: dashboard.theme,
          settings: dashboard.settings,
        })
        navigate(`/dashboards/${newDashboard.id}/edit`)
        toast.success('Dashboard created successfully')
      }
    } catch (error) {
      toast.error('Failed to save dashboard')
    }
  }, [dashboard, isEdit, updateDashboard, createDashboard, navigate])

  const handlePublishDashboard = useCallback(async () => {
    if (!dashboard) return

    try {
      await publishDashboard.mutateAsync(dashboard.id)
      toast.success('Dashboard published successfully')
    } catch (error) {
      toast.error('Failed to publish dashboard')
    }
  }, [dashboard, publishDashboard])

  const handlePreview = useCallback(() => {
    if (dashboard) {
      navigate(`/dashboards/${dashboard.id}`)
    }
  }, [dashboard, navigate])

  // Drag and drop handlers
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback((result: any) => {
    setIsDragging(false)
    
    if (!result.destination) return

    const { source, destination } = result
    if (source.index === destination.index) return

    reorderWidgets.mutate({
      sourceIndex: source.index,
      destinationIndex: destination.index,
    })
  }, [reorderWidgets])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Dashboard' : 'Create Dashboard'}
            </h1>
            {dashboard && (
              <span className="text-sm text-gray-500">
                v{dashboard.version} • {dashboard.status}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetLibrary(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Widget
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              icon={<Settings className="w-4 h-4" />}
            >
              Settings
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              icon={<Eye className="w-4 h-4" />}
            >
              Preview
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveDashboard}
              icon={<Save className="w-4 h-4" />}
              loading={updateDashboard.isLoading || createDashboard.isLoading}
            >
              Save
            </Button>
            
            {isEdit && (
              <Button
                variant="success"
                size="sm"
                onClick={handlePublishDashboard}
                loading={publishDashboard.isLoading}
              >
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={breakpoints}
            cols={cols}
            rowHeight={60}
            margin={[16, 16]}
            onLayoutChange={handleLayoutChange}
            isDraggable={!isDragging}
            isResizable={!isDragging}
          >
            {widgets?.map((widget, index) => (
              <div key={widget.id} className="widget-container">
                <Draggable draggableId={widget.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        bg-white rounded-lg border border-gray-200 shadow-sm
                        ${snapshot.isDragging ? 'shadow-lg' : ''}
                        hover:shadow-md transition-shadow duration-200
                      `}
                    >
                      {/* Widget Header */}
                      <div
                        {...provided.dragHandleProps}
                        className="flex items-center justify-between p-3 border-b border-gray-100 cursor-move"
                      >
                        <h3 className="font-medium text-gray-900 truncate">
                          {widget.name}
                        </h3>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditWidget(widget)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWidget(widget.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Widget Content */}
                      <div className="p-4">
                        <WidgetRenderer widget={widget} isEditor />
                      </div>
                    </div>
                  )}
                </Draggable>
              </div>
            ))}
          </ResponsiveGridLayout>
        </DragDropContext>

        {/* Empty State */}
        {(!widgets || widgets.length === 0) && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No widgets yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start building your dashboard by adding some widgets
            </p>
            <Button
              variant="primary"
              onClick={() => setShowWidgetLibrary(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Your First Widget
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showWidgetLibrary && (
        <WidgetLibrary
          onAddWidget={handleAddWidget}
          onClose={() => setShowWidgetLibrary(false)}
        />
      )}

      {selectedWidget && (
        <WidgetEditor
          widget={selectedWidget}
          onSave={(updates) => handleUpdateWidget(selectedWidget.id, updates)}
          onClose={() => setSelectedWidget(null)}
        />
      )}

      {showSettings && dashboard && (
        <DashboardSettings
          dashboard={dashboard}
          onSave={(updates) => updateDashboard.mutate({ id: dashboard.id, ...updates })}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

// Helper functions
function getDefaultWidgetConfig(type: string) {
  const configs = {
    'bar_chart': { xAxis: '', yAxis: '', groupBy: '' },
    'line_chart': { xAxis: '', yAxis: '', timeField: '' },
    'pie_chart': { labelField: '', valueField: '' },
    'table': { columns: [], pagination: true },
    'metric': { field: '', aggregation: 'sum' },
    'text': { content: 'Enter your text here...' },
  }
  return configs[type as keyof typeof configs] || {}
}

function getNextAvailablePosition(widgets: Widget[]) {
  const occupiedPositions = widgets.map(w => w.position || {})
  
  // Simple positioning logic - can be enhanced
  const row = Math.floor(widgets.length / 3)
  const col = widgets.length % 3
  
  return {
    x: col * 4,
    y: row * 4,
    w: 4,
    h: 4,
  }
}

export default DashboardBuilder 