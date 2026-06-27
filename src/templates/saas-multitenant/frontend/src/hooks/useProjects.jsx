import { useCallback, useEffect, useState } from "react";
import { useStoreAuth } from "../store/storeAuth";

// Talks to the tenant-scoped /projects API (cookies sent with credentials).
// Only loads when there is an active organization.
export default function useProjects(activeOrganizationId) {
  const { apiBase } = useStoreAuth();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`${apiBase}/projects`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.message || "Failed to load projects");
      setProjects([]);
      return;
    }
    setProjects(json.projects || []);
  }, [apiBase]);

  useEffect(() => {
    if (activeOrganizationId) load();
    else setProjects([]);
  }, [activeOrganizationId, load]);

  const create = async (name) => {
    const res = await fetch(`${apiBase}/projects`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create project");
    await load();
  };

  return { projects, error, create, reload: load };
}
