import React from "react";

import { Chip } from "@/components/ui";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoryPill({ label, selected, onPress }: Props) {
  return <Chip label={label} selected={selected} onPress={onPress} />;
}
