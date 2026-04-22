import { toaster } from "../lib/toaster.jsx";
import { useCallback } from "react";

const statusToType = (status) => {
  if (status === "error") return "error";
  if (status === "warning") return "warning";
  if (status === "info") return "info";
  return "success";
};

const useShowToast = () => {
  const showToast = useCallback((title, description, status) => {
    toaster.create({
      title,
      description,
      type: statusToType(status),
      meta: { closable: true },
    });
  }, []);

  return showToast;
};

export default useShowToast;
