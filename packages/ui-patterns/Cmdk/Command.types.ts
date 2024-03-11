
export  interface NavItem {
	label: string;
	icon: string;
	url: string;
	sites: Site[];
	subItems?: NavItem[];
}

export type Site = "docs" | "dashboard";

export interface NavItems {
  navItems: NavItem[];
}
