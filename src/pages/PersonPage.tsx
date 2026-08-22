import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getPersonById,
  getConnectionsForPerson,
  getAllPeople,
} from "@/data/load";
import type { Connection, Person } from "@/data/schema";
import PersonDetailContent from "@/components/ui/PersonDetailContent";
import { ArrowLeft } from "lucide-react";

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const person = id ? getPersonById(id) : null;

  if (!person) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">未找到该人物</p>
          <Link to="/" className="text-primary hover:underline">
            ← 返回地球
          </Link>
        </div>
      </div>
    );
  }

  const echoes = getConnectionsForPerson(person.id);
  const allPeople = getAllPeople();
  const getEchoTarget = (
    connection: Connection,
    sourceId: string
  ): Person | null => {
    const targetId =
      connection.source_id === sourceId
        ? connection.target_id
        : connection.source_id;
    return allPeople.find((p) => p.id === targetId) ?? null;
  };
  const handleEchoClick = (connectionId: string) => {
    const conn = echoes.find((c) => c.id === connectionId);
    if (!conn) return;
    const target = getEchoTarget(conn, person.id);
    if (target) navigate(`/person/${target.id}`);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          返回地球
        </Link>
        <PersonDetailContent
          person={person}
          echoes={echoes}
          getEchoTarget={getEchoTarget}
          onEchoClick={handleEchoClick}
          variant="page"
        />
      </div>
    </div>
  );
}
