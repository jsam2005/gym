import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { clientAPI } from "@/lib/api";

/**
 * EditClient loads the client by ID and redirects to AddClient with prefill state
 * so the same form can be used for editing (PUT) instead of creating (POST).
 */
const EditClient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id || id === "undefined" || id === "null") {
      navigate("/clients", { replace: true });
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const response = await clientAPI.getById(id);
        if (cancelled) return;
        if (response.data?.success && response.data?.client) {
          navigate("/clients/add", {
            replace: false,
            state: { editId: id, editClient: response.data.client },
          });
        } else {
          navigate("/clients", { replace: true });
        }
      } catch {
        if (!cancelled) navigate("/clients", { replace: true });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
      Loading client...
    </div>
  );
};

export default EditClient;
