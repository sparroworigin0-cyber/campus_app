import { requireRole } from "@/lib/auth";
import { updateProfile } from "../actions";

export default async function Profile() {
  const { me } = await requireRole("customer");
  return (
    <main className="wrap stack">
      <h1>Personal details</h1>
      <form action={updateProfile} className="stack">
        <input name="full_name" defaultValue={me.full_name} placeholder="Full name" required />
        <input name="phone" defaultValue={me.phone ?? ""} placeholder="Phone number" inputMode="tel" />
        <input name="enrollment_id" defaultValue={me.enrollment_id ?? ""} placeholder="Enrollment ID" />
        <input name="hostel" defaultValue={me.hostel ?? ""} placeholder="Hostel" />
        <input name="room_number" defaultValue={me.room_number ?? ""} placeholder="Room number" />
        <button className="btn">Save changes</button>
      </form>
    </main>
  );
}
