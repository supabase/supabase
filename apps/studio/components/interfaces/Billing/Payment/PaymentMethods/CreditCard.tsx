import { ExternalLink, MoreHorizontal } from "lucide-react";
import {
	Badge,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "ui";

import { DropdownMenuItemTooltip } from "@/components/ui/DropdownMenuItemTooltip";
import PartnerIcon from "@/components/ui/PartnerIcon";
import type { OrganizationPaymentMethod } from "@/data/organizations/organization-payment-methods-query";
import type { PlanId } from "@/data/subscriptions/types";
import { BASE_PATH } from "@/lib/constants";
import { MANAGED_BY } from "@/lib/constants/infrastructure";
import { STRIPE_PROJECTS_DOCS_URL } from "./StripePaymentConnection";

interface CreditCardProps {
	paymentMethod: OrganizationPaymentMethod;
	canUpdatePaymentMethods?: boolean;
	paymentMethodType?: string;
	paymentMethodCount: number;
	subscriptionPlan?: PlanId;
	setSelectedMethodForUse?: (paymentMethod: OrganizationPaymentMethod) => void;
	setSelectedMethodToDelete?: (
		paymentMethod: OrganizationPaymentMethod,
	) => void;
}

const CreditCard = ({
	paymentMethod,
	canUpdatePaymentMethods = true,
	paymentMethodType,
	subscriptionPlan,
	paymentMethodCount,
	setSelectedMethodForUse,
	setSelectedMethodToDelete,
}: CreditCardProps) => {
	const isSpt = paymentMethod.type === "shared_payment_token";
	const spt = paymentMethod.shared_payment_token;

	const isActive = paymentMethod.is_default;
	const isRemovable =
		!paymentMethod.is_default ||
		(subscriptionPlan === "free" && paymentMethodCount === 1);

	const expiryYear = paymentMethod.card?.exp_year ?? 0;
	const expiryMonth = paymentMethod.card?.exp_month ?? 0;

	const currentMonth = new Date().getMonth() + 1;
	const currentYear = new Date().getFullYear();

	const isExpiringSoon =
		!isSpt && expiryYear === currentYear && expiryMonth === currentMonth;
	const isExpired = isSpt
		? (spt?.is_expired ?? false)
		: expiryYear < currentYear ||
			(expiryYear === currentYear && expiryMonth < currentMonth);

	if (!paymentMethod.card) return null;

	return (
		<div
			key={paymentMethod.id}
			className="flex items-center justify-between gap-8"
		>
			<div className="flex items-center gap-8">
				<img
					alt="Credit card brand"
					src={`${BASE_PATH}/img/payment-methods/${paymentMethod.card.brand
						.replace(" ", "-")
						.toLowerCase()}.png`}
					width="32"
				/>
				<div className="flex flex-col gap-0.5">
					<p className="prose text-sm font-mono">
						**** **** **** {paymentMethod.card.last4}
					</p>
					<p className="text-sm tabular-nums text-foreground-light">
						Expires: {paymentMethod.card.exp_month}/
						{paymentMethod.card.exp_year}
					</p>
					{isSpt && spt && (
						<div className="flex items-center gap-2 mt-2">
							<a
								href={`${STRIPE_PROJECTS_DOCS_URL}#manage-billing`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1 text-xs text-foreground-light hover:text-foreground"
							>
								<PartnerIcon
									organization={{ managed_by: MANAGED_BY.STRIPE_PROJECTS }}
									showTooltip={false}
									size="small"
								/>
								Via Stripe Projects ending in{" "}
								<code className="font-mono bg-surface-300 rounded px-0.5">
									{spt.last4}
								</code>
								{spt.expires_at != null && (
									<span>
										· expires{" "}
										{new Date(spt.expires_at * 1000).toLocaleDateString(
											"en-US",
											{
												month: "short",
												year: "numeric",
											},
										)}
									</span>
								)}
								<ExternalLink size={10} />
							</a>
							{isExpired && <Badge variant="destructive">Expired</Badge>}
							{!isExpired && isActive && (
								<Badge variant="success">Active</Badge>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2">
				{isExpiringSoon && <Badge variant="warning">Expiring soon</Badge>}
				{!isSpt && isExpired && <Badge variant="destructive">Expired</Badge>}
				{isActive && <Badge variant="success">Active</Badge>}

				{canUpdatePaymentMethods && !isSpt && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="outline"
								className="hover:border-muted px-1"
								icon={<MoreHorizontal />}
								aria-label="More options"
							/>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-36">
							{paymentMethodType === "card" && !isActive && (
								<>
									<DropdownMenuItem
										key="make-default"
										onClick={() => setSelectedMethodForUse?.(paymentMethod)}
									>
										<p>Use this card</p>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							<DropdownMenuItemTooltip
								key="delete-method"
								disabled={!isRemovable}
								className="!pointer-events-auto"
								onClick={() => setSelectedMethodToDelete?.(paymentMethod)}
								tooltip={{
									content: {
										side: "left",
										text: !isRemovable
											? "Unable to delete a card that is currently active"
											: undefined,
									},
								}}
							>
								<p>Delete card</p>
							</DropdownMenuItemTooltip>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
};

export default CreditCard;
