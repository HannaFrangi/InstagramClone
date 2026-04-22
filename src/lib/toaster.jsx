import { createToaster, Toaster } from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top",
  duration: 3000,
  pauseOnPageIdle: true,
});

export function AppToaster() {
  return <Toaster toaster={toaster} />;
}
