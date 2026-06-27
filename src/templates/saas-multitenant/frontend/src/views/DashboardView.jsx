import { useState } from "react";
import useAuth from "../hooks/useAuth";
import useProjects from "../hooks/useProjects";

export default function DashboardView() {
  const { user, logout, client } = useAuth();
  const { data: organizations } = client.useListOrganizations();
  const { data: activeOrg } = client.useActiveOrganization();

  const { projects, error: projectsError, create: createProject } = useProjects(activeOrg?.id);

  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [busy, setBusy] = useState(false);

  const createOrg = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setBusy(true);
    try {
      const slug = orgName.trim().toLowerCase().replace(/\s+/g, "-");
      await client.organization.create({ name: orgName.trim(), slug });
      setOrgName("");
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (organizationId) => {
    await client.organization.setActive({ organizationId });
  };

  const addProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setBusy(true);
    try {
      await createProject(projectName.trim());
      setProjectName("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <span className="font-bold">Zyket SaaS</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">{user?.name || user?.email}</span>
          <button onClick={logout} className="text-zinc-400 hover:text-white">Logout</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 grid gap-6 md:grid-cols-2">
        {/* Organizations */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Organizations</h2>

          <ul className="space-y-2">
            {(organizations || []).map((org) => {
              const isActive = org.id === activeOrg?.id;
              return (
                <li key={org.id} className="flex items-center justify-between">
                  <span className={isActive ? "text-indigo-400" : ""}>
                    {org.name} {isActive && "• active"}
                  </span>
                  {!isActive && (
                    <button
                      onClick={() => setActive(org.id)}
                      className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
                    >
                      Set active
                    </button>
                  )}
                </li>
              );
            })}
            {(!organizations || organizations.length === 0) && (
              <li className="text-sm text-zinc-600">No organizations yet.</li>
            )}
          </ul>

          <form onSubmit={createOrg} className="flex gap-2">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="New organization"
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 outline-none focus:border-indigo-500 text-sm"
            />
            <button disabled={busy} className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
              Create
            </button>
          </form>
        </section>

        {/* Projects (tenant-scoped) */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Projects</h2>

          {!activeOrg ? (
            <p className="text-sm text-zinc-600">Set an active organization to manage projects.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {projects.map((p) => (
                  <li key={p.id} className="text-sm">• {p.name}</li>
                ))}
                {projects.length === 0 && <li className="text-sm text-zinc-600">No projects yet.</li>}
              </ul>

              {projectsError && <p className="text-sm text-red-400">{projectsError}</p>}

              <form onSubmit={addProject} className="flex gap-2">
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="New project"
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 outline-none focus:border-indigo-500 text-sm"
                />
                <button disabled={busy} className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50">
                  Add
                </button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
