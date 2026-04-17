import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LogIn, LogOut, Search, Bell, Menu, Loader2 } from "lucide-react"; 
import { useUser } from "@/hooks/useUser";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"; 
import { useQuery } from "@tanstack/react-query";
import LoginDialog from "@/components/LoginDialog";
import { getUserDisplayName } from "@/utils/user";

interface AuthProviders {
  google: boolean;
  kakao: boolean;
}

interface Notification {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
  type?: string;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  return date.toLocaleDateString();
}

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, logout, isLoggingOut } = useUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [providers, setProviders] = useState<AuthProviders | null>(null);

  // ✨ [추가] 모바일 햄버거 메뉴 열림/닫힘 상태 관리
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { 
    data: notifications, 
    isLoading: isNotiLoading 
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user, 
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch(() => setProviders({ google: false, kakao: false }));
  }, []);

  const sliderNavItems = [
    { path: "/opinions", label: "주민의 목소리" },
    { path: "/agendas", label: "안건 보기"},
    { path: "/policy", label: "정책 실현 현황"}
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleKakaoLogin = () => {
    window.location.href = "/api/auth/kakao";
  };

  const hasAnyProvider = providers && (providers.google || providers.kakao);

  return (
    <>
      <div className="sticky top-0 z-50 w-full pt-4 pl-4 flex items-center gap-2 md:gap-3 overflow-x-clip" data-testid="header-main">    
        
        <header className="bg-ok_gray1 pointer-events-auto flex-grow bg-background/80 backdrop-blur-md border border-border shadow-sm rounded-full h-16 px-4 md:px-6 flex items-center justify-between transition-all min-w-0">
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/">
              <div className="flex flex-col items-start cursor-pointer group select-none leading-none pb-[10px] flex-shrink-0 whitespace-nowrap" data-testid="logo">
                <div className="flex items-end mb-[-17px]"> 
                  <span className="pb-[11px] pl-[3px] font-logosub text-[14px] text-ok_txtgray2 tracking-tighter">
                    두런두런
                  </span>
                  <img 
                    src="/icons/title.png" 
                    alt="Logo"
                    className="w-11 h-11 object-contain group-hover:rotate-12 transition-transform duration-300" 
                  />
                </div>
                <h1 className="font-bagel text-2xl text-ok_txtgray2 text-[#1e293b]">
                  옥천마루
                </h1>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-3 lg:gap-6 flex-shrink-0" data-testid="nav-desktop">
            <Link href="/howto">
              <span
                className={`
                  text-sm font-medium transition-colors hover:text-ok_sub1 whitespace-nowrap
                  ${isActive("/howto") ? "text-ok_sub1 font-bold" : "text-ok_txtgray1"}
                `}
              >
                이용 방법
              </span>
            </Link>

            <div className="flex items-center bg-ok_gray2 p-1 rounded-full border border-ok_gray3/30">
              {sliderNavItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path} href={item.path}>
                    <span
                      className={`
                        relative px-3 lg:px-5 py-2 rounded-full text-xs lg:text-sm transition-all duration-300 ease-out cursor-pointer select-none whitespace-nowrap
                        ${active
                          ? "bg-primary text-white shadow-sm font-bold"
                          : "text-ok_txtgray2 hover:text-ok_sub1 hover:bg-gray-200/50"
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* 🖥️ [PC용] 오른쪽 버튼 그룹 */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
             {user ? (
               <>
                 <Sheet>
                   <SheetTrigger asChild>
                     <button className="w-9 h-9 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-accent relative transition-transform hover:scale-105 mr-1 flex-shrink-0">
                       <Bell className="w-4 h-4 text-gray-600" />
                       {unreadCount > 0 && (
                         <span className="absolute top-[-2px] right-[-2px] flex h-3 w-3">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok_sub1 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-3 w-3 bg-ok_sub1 text-[8px] text-white justify-center items-center">
                             {unreadCount}
                           </span>
                         </span>
                       )}
                     </button>
                   </SheetTrigger>
                   <SheetContent className="w-[320px] sm:w-[380px] bg-ok_gray1">
                     <SheetHeader className="mb-6 text-left">
                       <SheetTitle className="font-bold text-xl">알림함</SheetTitle>
                     </SheetHeader>
                     
                     <div className="space-y-4 overflow-y-auto max-h-[80vh]">
                       {isNotiLoading ? (
                         <div className="flex flex-col items-center justify-center py-10 gap-2">
                           <Loader2 className="w-6 h-6 animate-spin text-primary" />
                           <p className="text-xs text-gray-400">알림을 불러오는 중...</p>
                         </div>
                       ) : notifications && notifications.length > 0 ? (
                         notifications.map((noti) => (
                           <div key={noti.id} className={`p-4 rounded-2xl border transition-colors cursor-pointer ${noti.read ? 'bg-ok_gray2 border-transparent' : 'bg-white border-gray-100 shadow-sm'}`}>
                             <p className={`text-sm mb-1 ${noti.read ? 'text-ok_txtgray0 font-bold' : 'text-ok_txtgray2 font-bold'}`}>
                               {noti.message}
                             </p>
                             <span className="text-xs text-ok_txtgray0">{formatTimeAgo(noti.createdAt)}</span>
                           </div>
                         ))
                       ) : (
                         <div className="text-center py-10 text-gray-400 text-sm">
                           새로운 알림이 없습니다.
                         </div>
                       )}
                     </div>
                   </SheetContent>
                 </Sheet>

                 <button onClick={() => setLocation("/my")} className="w-9 h-9 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-accent flex-shrink-0 overflow-hidden">
                   <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatarUrl || undefined} alt={getUserDisplayName(user.displayName, user.username)} className="object-cover" />
                      <AvatarFallback className="bg-transparent text-sm font-medium text-primary">
                        {getUserDisplayName(user.displayName, user.username)[0].toUpperCase()}
                      </AvatarFallback>
                   </Avatar>
                 </button>
               </>
             ) : (
               <Button className="rounded-full px-6 font-bold shadow-sm flex-shrink-0 whitespace-nowrap" onClick={() => setShowLoginDialog(true)}><LogIn className="w-4 h-4 mr-2" />로그인</Button>
             )}
          </div>

          {/* 📱 [모바일용] 햄버거 메뉴 */}
          <div className="flex md:hidden items-center">
            {/* ✨ open, onOpenChange 속성 추가하여 상태 연결 */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <Menu className="w-6 h-6 text-ok_txtgray2" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-ok_gray1 p-0 border-l border-ok_txtgray1">
                <SheetHeader className="p-6 border-b border-gray-100 text-left bg-ok_gray1">
                  {user ? (
                    // ✨ [수정] onClick에 이동 후 메뉴 닫기(setIsMobileMenuOpen(false)) 추가
                    <div 
                      onClick={() => {
                        setLocation("/my");
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <Avatar className="w-12 h-12 border border-gray-100 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarImage src={user.avatarUrl || undefined} alt={getUserDisplayName(user.displayName, user.username)} className="object-cover" />
                        <AvatarFallback className="bg-primary text-white text-lg font-bold">
                          {getUserDisplayName(user.displayName, user.username)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <SheetTitle className="text-lg font-bold text-ok_txtgray2 group-hover:text-primary transition-colors">
                          {getUserDisplayName(user.displayName, user.username)}님
                        </SheetTitle>
                        <p className="text-xs text-ok_txtgray1">오늘도 즐거운 하루 되세요! 🌱</p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        setShowLoginDialog(true);
                        setIsMobileMenuOpen(false); // 로그인 버튼 눌러도 메뉴 닫히게 설정
                      }} 
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-ok_gray2 flex items-center justify-center text-ok_txtgray1 group-hover:bg-gray-200 transition-colors">
                        <LogIn className="w-6 h-6" />
                      </div>
                      <div>
                        <SheetTitle className="text-lg font-bold text-ok_txtgray2 group-hover:text-primary transition-colors">
                          로그인하기
                        </SheetTitle>
                        <p className="text-xs text-ok_txtgray1">로그인하고 소통에 참여해보세요.</p>
                      </div>
                    </div>
                  )}
                </SheetHeader>

                <div className="p-4 flex flex-col gap-2">
                  {/* ✨ 메뉴 링크 클릭 시에도 닫히도록 onClick 추가 */}
                  <Link href="/howto">
                    <span 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${isActive("/howto") ? "bg-primary/10 text-ok_txtgray2" : "text-ok_txtgray2 hover:bg-ok_gray3hov"}`}
                    >
                      이용 방법
                    </span>
                  </Link>
                  {sliderNavItems.map((item) => (
                    <Link key={item.path} href={item.path}>
                      <span 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${isActive(item.path) ? "bg-primary/10 text-ok_txtgray2" : "text-ok_txtgray2 hover:bg-ok_gray3hov"}`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                  
                  {user && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                       <div className="p-4 rounded-xl flex items-center gap-3 text-ok_txtgray2 cursor-pointer hover:bg-ok_gray3hov">
                        <Bell className="w-5 h-5" />
                        <span className="font-medium">알림함 ({unreadCount})</span>
                      </div>
                      <div 
                        className="p-4 rounded-xl flex items-center gap-3 text-ok_sandtxt cursor-pointer hover:bg-ok_gray3hov" 
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">로그아웃</span>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </header>

        <button 
          onClick={() => setLocation("/search")} 
          className="relative z-50 cursor-pointer rounded-full bg-primary w-10 h-10 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-md flex-shrink-0"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
        
        <div>
      </div>
      </div>

      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
      />
    </>
  );
}