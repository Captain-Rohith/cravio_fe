import { UserProfileView } from "@/components/profile/user-profile-view";

export default function AdminProfilePage() {
  return (
    <UserProfileView
      role="ADMIN"
      title="Admin profile"
      description="View your admin account details used for platform-level operations."
    />
  );
}
