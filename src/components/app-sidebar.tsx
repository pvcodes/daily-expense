'use client';

import { useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Home,
    Inbox,
    Settings,
    LogOut,
    Menu,
    User,
    HelpCircle,
    Github,
    FileScan,
    ChevronUp,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useUserActions } from '@/store/useUserStore';

type MenuItemProps = {
    item: {
        title: string;
        url: string;
        icon: React.ComponentType<{ className?: string }>;
        description: string;
    };
    isActive: boolean;
};

const menuItems = [
    {
        group: 'main',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: Home, description: 'Overview of your expenses' },
            { title: 'Expenses', url: '/expense', icon: Inbox, description: 'Manage your daily expenses' },
            { title: 'Bin', url: '/bin', icon: FileScan, description: 'View deleted items' },
        ],
    },
    {
        group: 'secondary',
        items: [
            { title: 'Settings', url: '/settings', icon: Settings, description: 'Customize your preferences' },
            { title: 'Help', url: '/help', icon: HelpCircle, description: 'Get support and documentation' },
            { title: 'Visit Github', url: 'https://github.com/pvcodes/daily-expense', icon: Github, description: 'Github repository' },

        ],
    },
];

export function AppSidebar() {
    const router = useRouter();
    const { setOpenMobile, setOpen } = useSidebar()
    const pathname = usePathname();
    const { resetStore } = useUserActions();


    const MenuItem = useMemo(() => {
        const Component: React.FC<MenuItemProps> = ({ item, isActive }) => (
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    className={`group relative ${isActive && 'bg-gray-100'}`}
                >
                    <Link href={item.url} className="relative" onClick={() => { setOpen(false); setOpenMobile(false); }}>
                        <item.icon
                            className={`transition-colors duration-150 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                        />
                        <span
                            className={`transition-colors duration-150 ${isActive ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                        >
                            {item.title}
                        </span>
                        <span className="absolute left-0 -bottom-4 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.description}
                        </span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );

        Component.displayName = 'MenuItem';
        return Component;
    }, [setOpen, setOpenMobile]);

    return (
        <Sidebar variant='floating' collapsible='icon' >
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="p-1 hover:bg-gray-100"
                            >
                                <Menu className="w-4 h-4" />
                            </Button>
                            <span className="font-medium">Expense Manager*</span>
                        </div>

                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.back()}
                                className="p-1 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.forward()}
                                className="p-1 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronRight className="w-4" />
                            </Button>
                        </div>
                    </SidebarGroupLabel>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            <div className="space-y-2">
                                {menuItems.map(({ group, items }) => (
                                    <div key={group}>
                                        {items.map((item) => (
                                            <MenuItem key={item.title} item={item} isActive={pathname === item.url} />
                                        ))}
                                        {group === 'main' && <div className="my-4 border-t border-gray-200" />}
                                    </div>
                                ))}
                            </div>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton>
                                    <User className='w-4' /> Account
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side='top' className="w-[--radix-popper-anchor-width]">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer" disabled>
                                    <User className="w-4 h-4 mr-2" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" disabled>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem className="cursor-pointer">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Documentation
                        </DropdownMenuItem> */}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 cursor-pointer"
                                    onClick={() => {
                                        signOut({ callbackUrl: '/' });
                                        resetStore();
                                    }}
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
