'use client';
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
import { signOut, useSession } from 'next-auth/react';
import { APP_NAME } from '@/constant';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


interface MenuItemProps {
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

const MenuItem = ({ item, isActive }: MenuItemProps) => {
    const { setOpenMobile } = useSidebar()
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                className={`group relative ${isActive && 'bg-gray-100'}`}
            >
                <Link href={item.url} className="relative transition-colors duration-150" onClick={() => setOpenMobile(false)}>
                    <item.icon
                        className={` ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                    />
                    <span
                        className={`${isActive ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                    >
                        {item.title}
                    </span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}



export function AppSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const session = useSession()

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
                            <span className="font-medium">{APP_NAME}</span>
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
                                    <Avatar className='w-8 h-8 mr-2'>
                                        <AvatarImage src={session.data?.user.image ?? ''} />
                                        <AvatarFallback><User className='w-4 h-4' /></AvatarFallback>
                                    </Avatar>
                                    {session.data?.user.name ?? session.data?.user.email}
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
                                    onClick={() => signOut({ callbackUrl: '/' })}
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
