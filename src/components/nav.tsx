
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSessionStorage } from "@/hooks/use-session-storage"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import {
    Home,
    Briefcase,
    Bike,
    Banknote,
    FileText,
    Gem,
    Settings,
    MessageSquare,
    ClipboardCheck,
    Contact,
    Mail,
    LayoutGrid,
    Shield,
    Users,
} from "lucide-react"

const mainNavItems = [
    { href: "/", label: "Dashboard", icon: Home, adminOnly: true },
    { href: "/workspaces", label: "Workspace Directory", icon: LayoutGrid, adminOnly: true },
    { href: "/cases", label: "Case Management", icon: Briefcase, adminOnly: true },
    { href: "/fleet", label: "Fleet Tracking", icon: Bike, adminOnly: true },
    { href: "/financials", label: "Financials", icon: Banknote, adminOnly: true },
    { href: "/commitments", label: "Commitments", icon: ClipboardCheck, adminOnly: true },
    { href: "/contacts", label: "Contacts", icon: Contact, adminOnly: true },
    { href: "/documents", label: "Documents", icon: FileText, adminOnly: true },
    { href: "/interactions", label: "Interactions", icon: MessageSquare, adminOnly: false },
    { href: "/ai-email", label: "AI Email", icon: Mail, adminOnly: true },
]

const settingsNavItems = [
    { href: "/admin", label: "Admin Dashboard", icon: Shield, adminOnly: true },
    { href: "/admin/users", label: "User Management", icon: Users, adminOnly: true },
    { href: "/subscriptions", label: "Subscriptions", icon: Gem, adminOnly: true },
    { href: "/settings", label: "Settings", icon: Settings, adminOnly: false },
]

export function Nav() {
    const [currentUser] = useSessionStorage<any>("currentUser", null);
    const { role } = useWorkspace();
    const pathname = usePathname()
    
    // Strictly check if user is admin or developer
    const isAdmin = currentUser?.role === "admin" || currentUser?.role === "developer";
    
    console.log('[Nav Debug]', { 
        userRole: currentUser?.role, 
        isAdmin,
        showingOnlyInteractions: !isAdmin
    });

    const rentalAgreementRegex = /^\/rental-agreement\/.*/;
    const isRentalAgreementPage = rentalAgreementRegex.test(pathname);
    const isFleetPage = pathname.startsWith('/fleet');

    return (
        <div className="flex h-full flex-col">
            <SidebarHeader>
                <Link href={!isAdmin ? "/interactions" : "/"} className="flex items-center gap-2 mb-4">
                    <Bike className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold">PBikeRescue</span>
                </Link>
                {isAdmin && (
                    <>
                        <WorkspaceSwitcher className="w-full" />
                        <SidebarSeparator className="mt-4" />
                    </>
                )}
            </SidebarHeader>
            <SidebarContent className="flex-1">
                <SidebarMenu>
                    {mainNavItems
                        .filter(item => {
                            // Only show admin items to admins
                            if (item.adminOnly && !isAdmin) {
                                return false;
                            }
                            // For non-admins, ONLY show Interactions
                            if (!isAdmin) {
                                return item.label === 'Interactions';
                            }
                            // Admins see everything
                            return true;
                        })
                        .map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href || (item.href === "/fleet" && isRentalAgreementPage)}
                            >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                 <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarMenu>
                        {settingsNavItems
                            .filter(item => {
                                // Only admins see admin settings
                                if (item.adminOnly && !isAdmin) {
                                    return false;
                                }
                                // Non-admins only see basic Settings
                                if (!isAdmin) {
                                    return item.label === 'Settings';
                                }
                                // Admins see everything
                                return true;
                            })
                            .map((item) => (
                             <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarFooter>
        </div>
    )
}
