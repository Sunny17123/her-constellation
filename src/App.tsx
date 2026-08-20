import { Routes, Route } from "react-router-dom";
import { GlobeSelectionProvider } from "@/hooks/useGlobeSelection";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import PersonPage from "@/pages/PersonPage";

export default function App() {
  return (
    <GlobeSelectionProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/person/:id" element={<PersonPage />} />
        </Routes>
      </Layout>
    </GlobeSelectionProvider>
  );
}