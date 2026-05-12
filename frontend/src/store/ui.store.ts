/** Store de Zustand para el estado de la UI (sidebar, tooltips, vehículo seleccionado, follow mode). */

import { create } from 'zustand'

interface UiStore {
  sidebarCollapsed: boolean
  showVehicleLabels: boolean
  followVehicleId: string | null
  selectedVehicleId: string | null
  isFullscreen: boolean
  connectionError: boolean

  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setShowVehicleLabels: (v: boolean) => void
  toggleVehicleLabels: () => void
  setFollowVehicleId: (id: string | null) => void
  setSelectedVehicleId: (id: string | null) => void
  setFullscreen: (v: boolean) => void
  setConnectionError: (v: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarCollapsed: false,
  showVehicleLabels: true,
  followVehicleId: null,
  selectedVehicleId: null,
  isFullscreen: false,
  connectionError: false,

  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setShowVehicleLabels: (showVehicleLabels) => set({ showVehicleLabels }),
  toggleVehicleLabels: () => set((s) => ({ showVehicleLabels: !s.showVehicleLabels })),
  setFollowVehicleId: (followVehicleId) => set({ followVehicleId }),
  setSelectedVehicleId: (selectedVehicleId) => set({ selectedVehicleId }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setConnectionError: (connectionError) => set({ connectionError }),
}))
