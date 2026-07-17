import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarClock, ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MeetingRegistrations from "@/pages/dashboard/MeetingRegistrations";
import AvailableSchedules from "@/pages/dashboard/AvailableSchedules";

/**
 * Combined Appointments hub:
 * - Booking requests: approve / reschedule / start
 * - Availability: calendar slots learners can book
 */
const Appointments = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const tab = useMemo(() => {
    const raw = (searchParams.get("tab") || "").toLowerCase();
    if (raw === "availability" || raw === "schedules" || raw === "calendar") {
      return "availability";
    }
    if (raw === "bookings" || raw === "requests" || raw === "registrations") {
      return "bookings";
    }
    // Legacy URLs: schedules page → availability tab; registrations → bookings
    if (location.pathname.includes("available-schedules")) {
      return "availability";
    }
    return "bookings";
  }, [searchParams, location.pathname]);

  const setTab = (value: string) => {
    const next = value === "availability" ? "availability" : "bookings";
    navigate(`/dashboard/appointments?tab=${next}`, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Appointments</h1>
        <p className="text-sm text-muted-foreground">
          Review booking requests to approve or reschedule, and manage open availability slots.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bookings" className="gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Booking requests
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-1.5">
            <CalendarClock className="h-4 w-4" />
            Availability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4 focus-visible:outline-none">
          <MeetingRegistrations embedded />
        </TabsContent>

        <TabsContent value="availability" className="mt-4 focus-visible:outline-none">
          <AvailableSchedules embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Appointments;
