import { Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import PersonPage from "@/pages/PersonPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/person/:id" element={<PersonPage />} />
      </Routes>
    </Layout>
  );
}
