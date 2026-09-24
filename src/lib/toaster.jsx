import { createToaster, Toast, Toaster } from '@chakra-ui/react';

export const toaster = createToaster({
  placement: 'top',
  duration: 3000,
  pauseOnPageIdle: true,
});

export function AppToaster() {
  return (
    <Toaster toaster={toaster}>
      {(toast) => (
        <Toast.Root>
          <Toast.Indicator />
          <div>
            <Toast.Title>{toast.title}</Toast.Title>
            <Toast.Description>{toast.description}</Toast.Description>
          </div>
          <Toast.CloseTrigger />
        </Toast.Root>
      )}
    </Toaster>
  );
}
