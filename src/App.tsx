import { Routes, Route } from "react-router-dom";
import { GlobeSelectionProvider } from "@/hooks/useGlobeSelection";
import { FavoritesProvider } from "@/hooks/useFavorites";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import NetworkPage from "@/pages/NetworkPage";
import DataGate from "@/components/DataGate";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import DeepLinkSync from "@/components/DeepLinkSync";
// PersonPage 已从路由摘除（文件保留，属 xinlu 所有）：深链统一渲染主页地球，
// 选中与详情由 DeepLinkSync + HomePage 恢复（HomePage 的 4 行 diff 见集成说明）

export default function App() {
  return (
    <AppErrorBoundary>
      <DataGate>
        <FavoritesProvider>
          <GlobeSelectionProvider>
            <DeepLinkSync />
            <Routes>
              {/* 网络视图：独立全屏，不套 Layout */}
              <Route path="/network" element={<NetworkPage />} />
              {/* 主页 + 深链：共用 Layout；/person/:id 渲染主页地球 */}
              <Route
                path="*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/person/:id" element={<HomePage />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </GlobeSelectionProvider>
        </FavoritesProvider>
      </DataGate>
    </AppErrorBoundary>
  );
}
