import { FileText, MessageSquare, Settings, CreditCard } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Builder", url: "/", icon: FileText },
  { title: "Forms", url: "/forms", icon: FileText },
  { title: "Chat Forms", url: "/chat-forms", icon: MessageSquare },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Pricing", url: "/pricing", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath === path) return true;
    return false;
  };
  
  const getNavCls = (path: string) => {
    const active = isActive(path);
    return `flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200 ${
      active 
        ? "bg-primary text-primary-foreground shadow-sm" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;
  };

  return (
    <Sidebar
      className={`border-r ${state === "collapsed" ? "w-12" : "w-48"} transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="p-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-0.5 px-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0 h-8">
                    <NavLink to={item.url} end className={getNavCls(item.url)}>
                      <item.icon className={`h-4 w-4 ${state === "collapsed" ? "mx-auto" : ""}`} />
                      {state !== "collapsed" && (
                        <span className="text-sm font-medium animate-fade-in">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}