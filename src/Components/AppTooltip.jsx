import { Tooltip, Box } from "@chakra-ui/react";

/**
 * Chakra v3 tooltip wrapper (legacy `label` / `placement` / `openDelay` API).
 */
export function AppTooltip({
  label,
  children,
  openDelay,
  placement = "right",
  ml,
  display,
  contentProps,
}) {
  return (
    <Box ml={ml} display={display}>
      <Tooltip.Root openDelay={openDelay} positioning={{ placement }}>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content {...contentProps}>{label}</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    </Box>
  );
}
