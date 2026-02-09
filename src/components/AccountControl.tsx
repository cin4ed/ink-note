import { UserButton } from "@clerk/clerk-react";

export const AccountControl = () => {
  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-auto">
      <div className="rounded-full border border-[var(--color-foreground)] bg-[var(--color-background)] p-1 shadow-[2px_2px_0px_var(--color-foreground)]">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
};
