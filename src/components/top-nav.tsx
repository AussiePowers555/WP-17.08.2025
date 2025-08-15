"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSessionStorage } from "@/hooks/use-session-storage"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useState } from "react"
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
    ChevronDown,
    Menu,
    X,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SharkIcon } from "@/components/ui/shark-icon"
import { cn } from "@/lib/utils"

const primaryNavItems = [
    { href: "/workspaces", label: "Workspaces", icon: LayoutGrid, adminOnly: true },
    { href: "/cases", label: "Cases", icon: Briefcase, adminOnly: true },
    { href: "/cases-explorer", label: "Case Explorer", icon: FileText, adminOnly: true },
    { href: "/interactions", label: "Interactions", icon: MessageSquare, adminOnly: false },
]

const secondaryNavItems = [
    { href: "/", label: "Dashboard", icon: Home, adminOnly: true },
    { href: "/fleet", label: "Fleet Tracking", icon: Bike, adminOnly: true },
    { href: "/financials", label: "Financials", icon: Banknote, adminOnly: true },
    { href: "/commitments", label: "Commitments", icon: ClipboardCheck, adminOnly: true },
    { href: "/contacts", label: "Contacts", icon: Contact, adminOnly: true },
    { href: "/documents", label: "Documents", icon: FileText, adminOnly: true },
    { href: "/ai-email", label: "AI Email", icon: Mail, adminOnly: true },
]

const adminNavItems = [
    { href: "/admin", label: "Admin Dashboard", icon: Shield, adminOnly: true },
    { href: "/admin/users", label: "User Management", icon: Users, adminOnly: true },
    { href: "/subscriptions", label: "Subscriptions", icon: Gem, adminOnly: true },
]

export function TopNav() {
    const [currentUser] = useSessionStorage<any>("currentUser", null);
    const { role } = useWorkspace();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Strict admin check - only admin and developer roles
    const isAdmin = currentUser?.role === "admin" || currentUser?.role === "developer";
    const pathname = usePathname()

    const filterNavItems = (items: typeof primaryNavItems) => {
        return items.filter(item => {
            // Non-admins can only see non-admin items
            if (!isAdmin && item.adminOnly) {
                return false;
            }
            // For non-admins, ONLY show Interactions
            if (!isAdmin) {
                return item.label === 'Interactions';
            }
            // Admins see everything
            return true;
        });
    };

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo and Title */}
                    <div className="flex items-center space-x-4">
                        <Link href={!isAdmin ? "/interactions" : "/"} className="flex items-center space-x-3">
                            <SharkIcon className="h-8 w-8 text-blue-600" size={32} />
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-bold text-foreground">White Pointer Recoveries</h1>
                                <p className="text-xs text-muted-foreground">Recovery Management System</p>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation - Primary Items */}
                    <div className="hidden md:flex items-center space-x-1">
                        {filterNavItems(primaryNavItems).map((item) => (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={isActive(item.href) ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "flex items-center space-x-2",
                                        isActive(item.href) 
                                            ? "bg-primary text-primary-foreground" 
                                            : "hover:bg-muted"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Button>
                            </Link>
                        ))}

                        {/* More Menu Dropdown - Only for admins */}
                        {isAdmin && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                                        <LayoutGrid className="h-4 w-4" />
                                        <span>More</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {filterNavItems(secondaryNavItems).map((item) => (
                                        <DropdownMenuItem key={item.href} asChild>
                                            <Link href={item.href} className="flex items-center space-x-2">
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Admin Dropdown */}
                        {isAdmin && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                                        <Shield className="h-4 w-4" />
                                        <span>Admin</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {adminNavItems.map((item) => (
                                        <DropdownMenuItem key={item.href} asChild>
                                            <Link href={item.href} className="flex items-center space-x-2">
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Settings - only visible for admins */}
                        {isAdmin && (
                            <Link href="/settings">
                                <Button
                                    variant={isActive('/settings') ? "default" : "ghost"}
                                    size="sm"
                                    className="flex items-center space-x-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden lg:inline">Settings</span>
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-border/40 py-4 space-y-2">
                        {/* Primary Navigation */}
                        <div className="space-y-1">
                            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Main
                            </h3>
                            {filterNavItems(primaryNavItems).map((item) => (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant={isActive(item.href) ? "default" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start space-x-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Button>
                                </Link>
                            ))}
                        </div>

                        {/* Secondary Navigation - Only for admins */}
                        {isAdmin && (
                            <div className="space-y-1">
                                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Tools
                                </h3>
                                {filterNavItems(secondaryNavItems).map((item) => (
                                    <Link key={item.href} href={item.href}>
                                        <Button
                                            variant={isActive(item.href) ? "default" : "ghost"}
                                            size="sm"
                                            className="w-full justify-start space-x-2"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.label}</span>
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Admin Navigation */}
                        {isAdmin && (
                            <div className="space-y-1">
                                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Admin
                                </h3>
                                {adminNavItems.map((item) => (
                                    <Link key={item.href} href={item.href}>
                                        <Button
                                            variant={isActive(item.href) ? "default" : "ghost"}
                                            size="sm"
                                            className="w-full justify-start space-x-2"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.label}</span>
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Settings - only for admins */}
                        {isAdmin && (
                            <div className="pt-2 border-t border-border/40">
                                <Link href="/settings">
                                    <Button
                                        variant={isActive('/settings') ? "default" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start space-x-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Settings className="h-4 w-4" />
                                        <span>Settings</span>
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}