import { Toast, Toaster } from '@chakra-ui/react';
import { toaster } from './toaster.js';

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
