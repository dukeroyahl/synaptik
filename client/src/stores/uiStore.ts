import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, TaskFilters } from '../types'

export interface ViewMode {
  type: 'list' | 'kanban' | 'calendar' | 'matrix'
  groupBy?: 'status' | 'priority' | 'project' | 'assignee'
  sortBy?: 'priority' | 'dueDate' | 'createdAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface UiState {
  // Task management
  selectedTasks: string[]
  filterState: TaskFilters
  searchQuery: string
  viewMode: ViewMode
  
  // Dialog states
  isCreateDialogOpen: boolean
  isEditDialogOpen: boolean
  isFilterDialogOpen: boolean
  isDependencyDialogOpen: boolean
  
  // Current editing task
  editingTask: Task | null
  dependencyTask: Task | null
  
  // Layout states
  sidebarOpen: boolean
  taskDetailsOpen: boolean
  selectedTaskId: string | null
  
  // Pagination
  currentPage: number
  itemsPerPage: number
  
  // Bulk operations
  bulkOperationMode: boolean
  
  // Actions
  setSelectedTasks: (tasks: string[]) => void
  toggleTaskSelection: (taskId: string) => void
  clearSelection: () => void
  setFilter: (filter: Partial<TaskFilters>) => void
  clearFilters: () => void
  setSearchQuery: (query: string) => void
  setViewMode: (mode: ViewMode) => void
  
  // Dialog actions
  openCreateDialog: () => void
  closeCreateDialog: () => void
  openEditDialog: (task: Task) => void
  closeEditDialog: () => void
  openFilterDialog: () => void
  closeFilterDialog: () => void
  openDependencyDialog: (task: Task) => void
  closeDependencyDialog: () => void
  
  // Layout actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openTaskDetails: (taskId: string) => void
  closeTaskDetails: () => void
  
  // Pagination actions
  setCurrentPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  
  // Bulk operations
  toggleBulkMode: () => void
  setBulkMode: (enabled: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedTasks: [],
      filterState: {},
      searchQuery: '',
      viewMode: {
        type: 'list',
        sortBy: 'priority',
        sortOrder: 'desc'
      },
      
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isFilterDialogOpen: false,
      isDependencyDialogOpen: false,
      
      editingTask: null,
      dependencyTask: null,
      
      sidebarOpen: true,
      taskDetailsOpen: false,
      selectedTaskId: null,
      
      currentPage: 1,
      itemsPerPage: 25,
      
      bulkOperationMode: false,
      
      // Task selection actions
      setSelectedTasks: (tasks: string[]) => set({ selectedTasks: tasks }),
      
      toggleTaskSelection: (taskId: string) => {
        const { selectedTasks } = get()
        const isSelected = selectedTasks.includes(taskId)
        
        if (isSelected) {
          set({ selectedTasks: selectedTasks.filter(id => id !== taskId) })
        } else {
          set({ selectedTasks: [...selectedTasks, taskId] })
        }
      },
      
      clearSelection: () => set({ selectedTasks: [] }),
      
      // Filter actions
      setFilter: (filter: Partial<TaskFilters>) => {
        const { filterState } = get()
        set({ 
          filterState: { ...filterState, ...filter },
          currentPage: 1 // Reset to first page when filtering
        })
      },
      
      clearFilters: () => set({ 
        filterState: {},
        searchQuery: '',
        currentPage: 1
      }),
      
      setSearchQuery: (query: string) => set({ 
        searchQuery: query,
        currentPage: 1 // Reset to first page when searching
      }),
      
      setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
      
      // Dialog actions
      openCreateDialog: () => set({ isCreateDialogOpen: true }),
      closeCreateDialog: () => set({ isCreateDialogOpen: false }),
      
      openEditDialog: (task: Task) => set({ 
        isEditDialogOpen: true, 
        editingTask: task 
      }),
      closeEditDialog: () => set({ 
        isEditDialogOpen: false, 
        editingTask: null 
      }),
      
      openFilterDialog: () => set({ isFilterDialogOpen: true }),
      closeFilterDialog: () => set({ isFilterDialogOpen: false }),
      
      openDependencyDialog: (task: Task) => set({ 
        isDependencyDialogOpen: true, 
        dependencyTask: task 
      }),
      closeDependencyDialog: () => set({ 
        isDependencyDialogOpen: false, 
        dependencyTask: null 
      }),
      
      // Layout actions
      toggleSidebar: () => {
        const { sidebarOpen } = get()
        set({ sidebarOpen: !sidebarOpen })
      },
      
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      
      openTaskDetails: (taskId: string) => set({ 
        taskDetailsOpen: true, 
        selectedTaskId: taskId 
      }),
      closeTaskDetails: () => set({ 
        taskDetailsOpen: false, 
        selectedTaskId: null 
      }),
      
      // Pagination actions
      setCurrentPage: (page: number) => set({ currentPage: page }),
      setItemsPerPage: (items: number) => set({ 
        itemsPerPage: items,
        currentPage: 1 // Reset to first page when changing page size
      }),
      
      // Bulk operations
      toggleBulkMode: () => {
        const { bulkOperationMode } = get()
        set({ 
          bulkOperationMode: !bulkOperationMode,
          selectedTasks: [] // Clear selection when toggling bulk mode
        })
      },
      
      setBulkMode: (enabled: boolean) => set({ 
        bulkOperationMode: enabled,
        selectedTasks: enabled ? get().selectedTasks : []
      }),
    }),
    {
      name: 'synaptik-ui-store',
      // Only persist certain UI preferences
      partialize: (state) => ({
        viewMode: state.viewMode,
        sidebarOpen: state.sidebarOpen,
        itemsPerPage: state.itemsPerPage,
      }),
    }
  )
)

// Computed selectors
export const useUiSelectors = () => {
  const store = useUiStore()
  
  return {
    // Check if any tasks are selected
    hasSelectedTasks: store.selectedTasks.length > 0,
    
    // Get number of selected tasks
    selectedTaskCount: store.selectedTasks.length,
    
    // Check if a specific task is selected
    isTaskSelected: (taskId: string) => store.selectedTasks.includes(taskId),
    
    // Check if any filters are active
    hasActiveFilters: () => {
      const { filterState, searchQuery } = store
      return Object.keys(filterState).length > 0 || searchQuery.trim() !== ''
    },
    
    // Check if any dialogs are open
    hasOpenDialogs: 
      store.isCreateDialogOpen || 
      store.isEditDialogOpen || 
      store.isFilterDialogOpen || 
      store.isDependencyDialogOpen,
    
    // Get current filter count
    activeFilterCount: () => {
      const { filterState } = store
      return Object.values(filterState).filter(value => 
        value !== undefined && 
        value !== null && 
        (Array.isArray(value) ? value.length > 0 : true)
      ).length
    },
  }
}