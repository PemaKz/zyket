import { useStoreAuth } from "../store/storeAuth";

export default function useAuth() {
  const context = useStoreAuth();
  const sessionContext = context?.client?.useSession();
  const { isPending, refetch } = sessionContext || {};
  const { user, session } = sessionContext?.data || {};

  const login = async (email, password) => {
    const { data, error } = await context.client.signIn.email({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async ({ email, password, name }) => {
    const { data, error } = await context.client.signUp.email({ email, password, name });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await context.client.signOut();
    window.location.href = "/auth";
  };

  return { ...context, login, register, logout, isPending, refetch, user, session };
}
