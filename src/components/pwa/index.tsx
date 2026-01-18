"use client";

import { InstallPrompt } from "./install-prompt";
import { UpdatePrompt } from "./update-prompt";

export function PwaLifecycle() {
  return (
    <>
      <InstallPrompt />
      <UpdatePrompt />
    </>
  );
}
