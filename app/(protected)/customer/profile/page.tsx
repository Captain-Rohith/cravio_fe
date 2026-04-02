import { UserProfileView } from "@/components/profile/user-profile-view";

export default function CustomerProfilePage() {
  return (
    <UserProfileView
      role="CUSTOMER"
      title="Customer profile"
      description="View your account details used for placing orders and tracking history."
    />
  );
}
