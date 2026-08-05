import { useState, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  X,
  Settings,
  Building2,
  BarChart3,
  CreditCard,
  Users,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { type HubRole } from "@/lib/hubConfig";
import { prefetchDashboardRoute } from "@/lib/dashboardPrefetchRoutes";
import { prefetchDashboardData } from "@/lib/dashboardPrefetchData";
import { formatUserDisplayName } from "@/lib/brandSanitize";
import { isStoredMainAdmin, isPartnerInstitutionUser, useInstitutionBrandingRevision } from "@/lib/institutionContext";
import { performDashboardLogout } from "@/lib/dashboardLogout";
import { HUB } from "@/lib/hubConfig";

interface DashboardSidebarProps {
  userRole: HubRole;
  isOpen?: boolean;
  onClose?: () => void;
}

type NavLinkItem = { to: string; label: string; icon: typeof LayoutDashboard };
type NavGroupItem = { label: string; icon: typeof LayoutDashboard; children: NavLinkItem[] };
type NavItem = NavLinkItem | NavGroupItem;

const isNavGroup = (item: NavItem): item is NavGroupItem => "children" in item;

const MEETING_LINKS: NavLinkItem[] = [
  { to: "/dashboard/zoom-meetings", label: "Meetings", icon: Video },
  { to: "/dashboard/zoom-webinars", label: "Webinars", icon: Video },
  { to: "/dashboard/zoom-recordings", label: "Recordings", icon: Video },
  { to: "/dashboard/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/dashboard/live-zoom-cohort", label: "Live Cohorts", icon: CalendarClock },
];

const ADMIN_SECTIONS: Array<{ title: string; links: NavItem[] }> = [
  {
    title: "Overview",
    links: [{ to: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Meetings",
    links: [
      {
        label: "Meeting Hub",
        icon: Video,
        children: MEETING_LINKS,
      },
      { to: "/dashboard/available-schedules", label: "Schedules", icon: Calendar },
    ],
  },
  {
    title: "Billing & Usage",
    links: [
      { to: "/dashboard/subscription", label: "My Subscription", icon: CreditCard },
      { to: "/dashboard/usage", label: "Usage Monitor", icon: Gauge },
    ],
  },
  {
    title: "Administration",
    links: [
      { to: "/dashboard/users", label: "Users", icon: Users },
      { to: "/dashboard/institutions", label: "Tenants", icon: Building2 },
      { to: "/dashboard/consumption", label: "Consumption", icon: BarChart3 },
    ],
  },
  {
    title: "Account",
    links: [{ to: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

const MEETING_USER_LINKS: NavLinkItem[] = [
  { to: "/dashboard/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const DashboardSidebar = ({ userRole, isOpen, onClose }: DashboardSidebarProps) => {
  useInstitutionBrandingRevision();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const meetingActive = MEETING_LINKS.some((l) => location.pathname === l.to);
  const [meetingOpen, setMeetingOpen] = useState(meetingActive);

  useEffect(() => {
    if (meetingActive) setMeetingOpen(true);
  }, [meetingActive]);

  const linkPrefetchProps = (to: string) => ({
    onMouseEnter: () => { prefetchDashboardRoute(to); prefetchDashboardData(to); },
    onFocus: () => { prefetchDashboardRoute(to); prefetchDashboardData(to); },
  });

  const isActive = (path: string) => {
    if (path === "/dashboard/appointments") {
      return location.pathname === "/dashboard/appointments"
        || location.pathname === "/dashboard/meeting-registrations"
        || location.pathname === "/dashboard/available-schedules";
    }
    return location.pathname === path;
  };

  const sidebarLinkClass = (path: string) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline",
      "text-muted-foreground hover:bg-muted hover:text-foreground transition-all",
      isActive(path) && "bg-[#D4AF37]/10 text-[#D4AF37] font-medium",
    );

  const renderNavLink = (link: NavLinkItem, nested?: boolean) => (
    <NavLink
      key={link.to}
      to={link.to}
      onClick={() => window.innerWidth < 1024 && onClose?.()}
      {...linkPrefetchProps(link.to)}
      className={cn(sidebarLinkClass(link.to), nested && "pl-9")}
    >
      <link.icon className="shrink-0 w-5 h-5" />
      {!collapsed && <span className="text-sm">{link.label}</span>}
    </NavLink>
  );

  const renderNavItem = (item: NavItem) => {
    if (isNavGroup(item)) {
      if (collapsed) return item.children.map((c) => renderNavLink(c));
      return (
        <Collapsible key={item.label} open={meetingOpen} onOpenChange={setMeetingOpen}>
          <CollapsibleTrigger className={cn(
            "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted",
            meetingActive && "bg-[#D4AF37]/10 text-[#D4AF37] font-medium",
          )}>
            <item.icon className="w-5 h-5" />
            {!collapsed && <span className="text-sm flex-1 text-left">{item.label}</span>}
            {!collapsed && <ChevronDown className={cn("h-4 w-4", meetingOpen && "rotate-180")} />}
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 mt-1">
            {item.children.map((c) => renderNavLink(c, true))}
          </CollapsibleContent>
        </Collapsible>
      );
    }
    return renderNavLink(item);
  };

  const partnerView = isPartnerInstitutionUser();

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border z-40 flex flex-col justify-between transition-all",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      collapsed ? "w-16" : "w-64",
    )}>
      <Button variant="ghost" size="icon" className="absolute right-2 top-2 lg:hidden" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="icon"
        className="absolute -right-3 top-4 h-6 w-6 rounded-full border hidden lg:flex"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {!collapsed && (
        <div className="px-4 pt-6 pb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={HUB.logoIcon} alt="" className="h-8 w-8" />
            <div>
              <p className="text-xs font-semibold text-[#D4AF37]">{HUB.name}</p>
              <p className="text-[10px] text-muted-foreground">{HUB.poweredBy}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-1 p-4">
          {userRole === "meeting_user" ? (
            MEETING_USER_LINKS.map((l) => renderNavLink(l))
          ) : (
            ADMIN_SECTIONS.map((section) => (
              <div key={section.title} className="mb-3">
                {!collapsed && (
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                )}
                {section.links
                  .filter((link) => {
                    if (isNavGroup(link)) return true;
                    if (link.to === "/dashboard/institutions") {
                      return isStoredMainAdmin() && !partnerView;
                    }
                    if (link.to === "/dashboard/consumption") {
                      return isStoredMainAdmin() && !partnerView;
                    }
                    return true;
                  })
                  .map((link) => renderNavItem(link))}
              </div>
            ))
          )}
        </nav>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
            <User className="h-5 w-5 text-[#D4AF37]" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {formatUserDisplayName(
                  localStorage.getItem("xander_user_name"),
                  localStorage.getItem("xander_user_email")
                )}
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {menuRole === "partner_company" || partnerView
                  ? "Institution Admin"
                  : menuRole === "meeting_user"
                    ? "Meeting Coordinator"
                    : userRole.replace("_", " ")}
              </p>
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={performDashboardLogout} className={cn("w-full justify-start text-muted-foreground hover:text-destructive", collapsed && "justify-center p-0 h-10 w-10")}>
          <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
          {!collapsed && "Log Out"}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
