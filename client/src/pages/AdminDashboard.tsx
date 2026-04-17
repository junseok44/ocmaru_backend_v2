import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Users,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import AdminDashboardHome from "@/pages/admin/AdminDashboardHome";
import AdminOpinionsPage from "@/pages/admin/AdminOpinionsPage";
import AdminAgendasPage from "@/pages/admin/AdminAgendasPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import ActiveAgendasPage from "@/pages/admin/ActiveAgendasPage";
import { useUser } from "@/hooks/useUser";

function AppSidebar() {
  const [location] = useLocation();

  const menuItems = [
    {
      title: "대시보드",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: location === "/admin",
    },
    {
      title: "주민 의견 관리",
      url: "/admin/opinions",
      icon: MessageSquare,
      isActive: location.startsWith("/admin/opinions"),
    },
    {
      title: "안건 관리",
      url: "/admin/agendas",
      icon: FileText,
      isActive: location.startsWith("/admin/agendas"),
    },
    {
      title: "사용자 관리",
      url: "/admin/users",
      icon: Users,
      isActive: location === "/admin/users",
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6">
            <h2 className="text-lg font-bold">관리자</h2>
            <p className="text-sm text-muted-foreground">주민참여 플랫폼</p>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
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

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { user, isLoading: isUserLoading } = useUser();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const renderContent = () => {
    if (location === "/admin" || location === "/admin/") {
      return <AdminDashboardHome />;
    } else if (location === "/admin/active-agendas") {
      return <ActiveAgendasPage />;
    } else if (location.startsWith("/admin/opinions")) {
      return <AdminOpinionsPage />;
    } else if (location.startsWith("/admin/agendas")) {
      return <AdminAgendasPage />;
    } else if (location.startsWith("/admin/users")) {
      return <AdminUsersPage />;
    }
    return <AdminDashboardHome />;
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center gap-2 p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {/* 사용자 정보 로딩 중이면 로딩 상태 표시 */}
            {isUserLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                관리자 정보를 확인하는 중입니다...
              </div>
            ) : !user?.isAdmin ? (
              // 비관리자(또는 비로그인)인 경우 홈으로 리다이렉트
              (() => {
                setLocation("/");
                return null;
              })()
            ) : (
              renderContent()
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
