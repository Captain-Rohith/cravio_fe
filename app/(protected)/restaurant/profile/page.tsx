import { UserProfileView } from "@/components/profile/user-profile-view";

export default function RestaurantProfilePage() {
  return (
    <UserProfileView
      role="RESTAURANT"
      title="Restaurant profile"
      description="View your restaurant account details and linked restaurant profile reference."
    />
  );
}
