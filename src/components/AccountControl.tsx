import { UserButton } from "@clerk/clerk-react";

export const AccountControl = () => {
  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-auto">
      <div className="rounded-full border border-[var(--color-fg)] bg-[var(--color-bg)] p-1 shadow-[2px_2px_0px_var(--color-fg)]">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
};
