import { Dialog, Portal } from "@chakra-ui/react";

/**
 * Maps legacy Modal `isOpen` / `onClose` to Chakra v3 Dialog.
 * Children should be: Backdrop, Positioner > Content > … (use AppDialog parts).
 */
export function AppDialogRoot({
  isOpen,
  onClose,
  children,
  size,
  placement = "center",
  closeOnInteractOutside = true,
}) {
  return (
    <Dialog.Root
      open={Boolean(isOpen)}
      onOpenChange={(e) => {
        if (!e.open) onClose?.();
      }}
      size={size}
      placement={placement}
      closeOnInteractOutside={closeOnInteractOutside}
    >
      <Portal>{children}</Portal>
    </Dialog.Root>
  );
}

export const AppDialogBackdrop = Dialog.Backdrop;
export const AppDialogPositioner = Dialog.Positioner;
export const AppDialogContent = Dialog.Content;
export const AppDialogCloseTrigger = Dialog.CloseTrigger;
export const AppDialogHeader = Dialog.Header;
export const AppDialogBody = Dialog.Body;
export const AppDialogFooter = Dialog.Footer;
