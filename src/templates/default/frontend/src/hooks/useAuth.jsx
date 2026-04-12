import { useStoreAuth } from "../store";

export default function useAuth() {
  const context = useStoreAuth();
  const sessionContext = context?.client?.useSession();

  const { error: sessionError, isPending, isRefetching, refetch } = sessionContext || {};
  const { user, session } = sessionContext?.data || {};

  const login = async (email, password) => {
    const { data, error } = await context.client.signIn.email({ email, password });
    if (error) throw error;

    return data;
  };

  const register = async ({ email, password, name, image }) => {
    const payload = { email, password, name, isPublic: true };
    if (typeof image === "string" && image.trim() !== "") payload.image = image;

    const { data, error } = await context.client.signUp.email(payload);
    if (error) throw error;

    return data;
  };

  const logout = async () => {
    await context.client.signOut({
      fetchOptions: {
        onSuccess: () => {
          localStorage.removeItem('pn');
          window.location.href = "/auth/login"
        }
      },
    });
  };
  

  return {
    ...context,
    login,
    register,
    logout,
    error: sessionError,
    isPending,
    isRefetching,
    refetch,
    user,
    session,
  };
}
