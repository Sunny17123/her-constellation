import { Routes, Route } from "react-router-dom";
import { GlobeSelectionProvider } from "@/hooks/useGlobeSelection";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import PersonPage from "@/pages/PersonPage";
import NetworkPage from "@/pages/NetworkPage";

export default function App() {
  return (
    <GlobeSelectionProvider>
      <Routes>
        {/* 网络视图：独立全屏，不套 Layout */}
        <Route path="/network" element={<NetworkPage />} />
        {/* 主页 + 详情：共用 Layout */}
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/person/:id" element={<PersonPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </GlobeSelectionProvider>
  );
}