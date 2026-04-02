import { UserProfileView } from "@/components/profile/user-profile-view";

export default function DeliveryProfilePage() {
  return (
    <UserProfileView
      role="DELIVERY_PARTNER"
      title="Delivery profile"
      description="View your delivery identity details used for order claims and tracking updates."
    />
  );
}
