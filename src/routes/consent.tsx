import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/consent")({
	ssr: false,
	component: Consent,
	validateSearch: (search: Record<string, unknown>) => ({
		client_id: (search.client_id as string) ?? "",
		scope: (search.scope as string) ?? "",
	}),
});

interface OAuthClientInfo {
	name?: string;
	icon?: string;
	uri?: string;
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
	openid: "Verify your identity",
	profile: "Access your name and profile picture",
	email: "Access your email address",
	offline_access: "Stay signed in on your behalf",
};

function Consent() {
	const { client_id, scope } = Route.useSearch();
	const [clientInfo, setClientInfo] = useState<OAuthClientInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const scopes = scope.split(" ").filter(Boolean);

	useEffect(() => {
		if (!client_id) return;

		authClient.oauth2
			.publicClient({ query: { client_id } })
			.then((result) => {
				if ("data" in result && result.data) {
					setClientInfo(result.data as unknown as OAuthClientInfo);
				}
			})
			.catch(() => {
				// Client info is optional for display
			})
			.finally(() => setLoading(false));
	}, [client_id]);

	async function handleConsent(accept: boolean) {
		setSubmitting(true);
		setError(null);

		const task = authClient.oauth2.consent({
			accept,
			...(accept && scope ? { scope } : {}),
		});

		toast.promise(task, {
			loading: accept ? "Authorizing..." : "Cancelling...",
			success: accept ? "Authorized — redirecting to application..." : "Cancelled — redirecting...",
			error: "Failed to process consent. Please try again.",
		});

		try {
			await task;
		} catch {
			setError("Failed to process consent. Please try again.");
			setSubmitting(false);
		}
	}

	if (loading) {
		return (
			<main className="flex min-h-screen items-center justify-center px-4">
				<p className="text-muted-foreground">Loading...</p>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center">
					{clientInfo?.icon && <img src={clientInfo.icon} alt="" className="mx-auto mb-4 h-12 w-12 rounded-lg" />}
					<h1 className="text-2xl font-bold">Authorize application</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						<strong>{clientInfo?.name ?? "An application"}</strong> is requesting access to your account.
					</p>
				</div>

				{scopes.length > 0 && (
					<div className="rounded-lg border border-border p-4">
						<p className="mb-3 text-sm font-medium">This will allow the application to:</p>
						<ul className="space-y-2">
							{scopes.map((s) => (
								<li key={s} className="flex items-start gap-2 text-sm">
									<span className="mt-0.5 text-primary">&#x2713;</span>
									<span>{SCOPE_DESCRIPTIONS[s] ?? s}</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{error && <p className="text-sm text-destructive">{error}</p>}

				<div className="flex gap-3">
					<Button variant="outline" className="flex-1" onClick={() => handleConsent(false)} disabled={submitting}>
						Deny
					</Button>
					<Button className="flex-1" onClick={() => handleConsent(true)} disabled={submitting}>
						{submitting ? "Authorizing..." : "Allow"}
					</Button>
				</div>

				{clientInfo?.uri && (
					<p className="text-center text-xs text-muted-foreground">
						By authorizing, you allow{" "}
						<a href={clientInfo.uri} target="_blank" rel="noopener noreferrer" className="underline">
							{clientInfo.name ?? clientInfo.uri}
						</a>{" "}
						to use your information in accordance with their terms of service.
					</p>
				)}
			</div>
		</main>
	);
}
