import { Box, IBoxProps } from "native-base";
import React from "react";

interface LayoutProps extends IBoxProps {
  children: React.ReactElement | React.ReactElement[];
}

export default function Layout({ children, ...props }: LayoutProps) {
  return (
    <Box
      safeArea
      flex={1}
      p={4}
      _dark={{ backgroundColor: "gray.900" }}
      _light={{ backgroundColor: "gray.50" }}
      {...props}
    >
      {children}
    </Box>
  );
}
