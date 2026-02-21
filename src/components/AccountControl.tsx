import { UserButton } from "@clerk/clerk-react";

export const AccountControl = () => {
  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-auto">
      <UserButton />
    </div>
  );
};
