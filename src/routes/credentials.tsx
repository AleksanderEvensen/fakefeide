import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	adminLogin,
	adminLogout,
	createClient,
	deleteClient,
	getAdminSession,
	listClients,
	updateClient,
	type AdminClient,
} from "#/lib/credentials.functions";

export const Route = createFileRoute("/credentials")({
	ssr: false,
	component: CredentialsPage,
});

function CredentialsPage() {
	const getSession = useServerFn(getAdminSession);
	const [authed, setAuthed] = useState<boolean | null>(null);

	useEffect(() => {
		getSession().then((r) => setAuthed(r.authenticated));
	}, [getSession]);

	if (authed === null) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-gray-500">Loading…</p>
			</main>
		);
	}

	if (!authed) {
		return <LoginForm onSuccess={() => setAuthed(true)} />;
	}

	return <Dashboard onLogout={() => setAuthed(false)} />;
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
	const login = useServerFn(adminLogin);
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await login({ data: { password } });
			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#c8d3e6] px-4">
			<form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-md">
				<h1 className="text-xl font-bold text-gray-900">Admin access</h1>
				<p className="text-sm text-gray-600">Enter the admin password to manage OAuth credentials.</p>
				<div className="space-y-1">
					<Label htmlFor="admin-password" className="text-sm text-gray-700">
						Password
					</Label>
					<Input
						id="admin-password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						autoFocus
					/>
				</div>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<Button type="submit" className="w-full bg-[#1f4698] hover:bg-[#183a80]" disabled={loading}>
					{loading ? "Signing in…" : "Sign in"}
				</Button>
			</form>
		</main>
	);
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
	const list = useServerFn(listClients);
	const logout = useServerFn(adminLogout);

	const [clients, setClients] = useState<AdminClient[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showCreate, setShowCreate] = useState(false);

	const refresh = useCallback(async () => {
		try {
			const rows = await list();
			setClients(rows);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load clients");
		}
	}, [list]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function handleLogout() {
		await logout();
		onLogout();
	}

	return (
		<main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">OAuth Credentials</h1>
					<p className="text-sm text-gray-600">Manage registered clients and their redirect URIs.</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setShowCreate((v) => !v)}>
						{showCreate ? "Cancel" : "New client"}
					</Button>
					<Button variant="outline" onClick={handleLogout}>
						Log out
					</Button>
				</div>
			</div>

			{error && <p className="mt-4 text-sm text-red-600">{error}</p>}

			{showCreate && (
				<CreateClientCard
					onCreated={() => {
						setShowCreate(false);
						refresh();
					}}
				/>
			)}

			<div className="mt-6 space-y-4">
				{clients === null && <p className="text-sm text-gray-500">Loading clients…</p>}
				{clients?.length === 0 && <p className="text-sm text-gray-500">No clients registered yet.</p>}
				{clients?.map((c) => (
					<ClientCard key={c.id} client={c} onChanged={refresh} />
				))}
			</div>
		</main>
	);
}

function CreateClientCard({ onCreated }: { onCreated: () => void }) {
	const create = useServerFn(createClient);
	const [name, setName] = useState("");
	const [uri, setUri] = useState("");
	const [redirectInput, setRedirectInput] = useState("");
	const [postLogoutInput, setPostLogoutInput] = useState("");
	const [isPublic, setIsPublic] = useState(false);
	const [skipConsent, setSkipConsent] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [created, setCreated] = useState<{ clientId: string; clientSecret: string | null } | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const redirectUris = redirectInput
			.split(/[\n,]+/)
			.map((s) => s.trim())
			.filter(Boolean);
		const postLogoutRedirectUris = postLogoutInput
			.split(/[\n,]+/)
			.map((s) => s.trim())
			.filter(Boolean);
		try {
			const result = await create({
				data: {
					name,
					uri: uri || undefined,
					redirectUris,
					postLogoutRedirectUris,
					public: isPublic,
					skipConsent,
				},
			});
			setCreated({ clientId: result.clientId, clientSecret: result.clientSecret });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create client");
		} finally {
			setLoading(false);
		}
	}

	if (created) {
		return (
			<div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
				<h3 className="font-semibold text-green-900">Client created</h3>
				<p className="mt-1 text-sm text-green-800">Save the client secret — it will not be shown again.</p>
				<dl className="mt-3 space-y-1 font-mono text-xs">
					<div>
						<dt className="inline font-semibold">client_id: </dt>
						<dd className="inline break-all">{created.clientId}</dd>
					</div>
					{created.clientSecret && (
						<div>
							<dt className="inline font-semibold">client_secret: </dt>
							<dd className="inline break-all">{created.clientSecret}</dd>
						</div>
					)}
				</dl>
				<div className="mt-3">
					<Button size="sm" onClick={onCreated}>
						Done
					</Button>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6">
			<h3 className="font-semibold">New OAuth client</h3>
			<div className="space-y-1">
				<Label htmlFor="new-name">Name</Label>
				<Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} required />
			</div>
			<div className="space-y-1">
				<Label htmlFor="new-uri">Client URI (optional)</Label>
				<Input id="new-uri" type="url" value={uri} onChange={(e) => setUri(e.target.value)} placeholder="https://example.com" />
			</div>
			<div className="space-y-1">
				<Label htmlFor="new-redirects">Redirect URIs</Label>
				<textarea
					id="new-redirects"
					value={redirectInput}
					onChange={(e) => setRedirectInput(e.target.value)}
					required
					rows={3}
					placeholder={"https://example.com/callback\nhttps://example.com/other"}
					className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
				/>
				<p className="text-xs text-gray-500">One URL per line (or comma-separated).</p>
			</div>
			<div className="space-y-1">
				<Label htmlFor="new-post-logout">Post-logout redirect URIs (optional)</Label>
				<textarea
					id="new-post-logout"
					value={postLogoutInput}
					onChange={(e) => setPostLogoutInput(e.target.value)}
					rows={2}
					placeholder={"https://example.com/logged-out"}
					className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
				/>
				<p className="text-xs text-gray-500">Used by the RP-initiated logout flow.</p>
			</div>
			<div className="flex gap-4">
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
					Public client (no secret)
				</label>
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={skipConsent} onChange={(e) => setSkipConsent(e.target.checked)} />
					Skip consent screen
				</label>
			</div>
			{error && <p className="text-sm text-red-600">{error}</p>}
			<Button type="submit" disabled={loading}>
				{loading ? "Creating…" : "Create client"}
			</Button>
		</form>
	);
}

function ClientCard({ client, onChanged }: { client: AdminClient; onChanged: () => void }) {
	const update = useServerFn(updateClient);
	const remove = useServerFn(deleteClient);

	const [redirectInput, setRedirectInput] = useState((Array.isArray(client.redirectUris) ? client.redirectUris : []).join("\n"));
	const [postLogoutInput, setPostLogoutInput] = useState(
		(Array.isArray(client.postLogoutRedirectUris) ? client.postLogoutRedirectUris : []).join("\n"),
	);
	const [name, setName] = useState(client.name ?? "");
	const [uri, setUri] = useState(client.uri ?? "");
	const [skipConsent, setSkipConsent] = useState(client.skipConsent);
	const [disabled, setDisabled] = useState(client.disabled);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const dirty =
		redirectInput.trim() !==
			(Array.isArray(client.redirectUris) ? client.redirectUris : []).join("\n").trim() ||
		postLogoutInput.trim() !==
			(Array.isArray(client.postLogoutRedirectUris) ? client.postLogoutRedirectUris : []).join("\n").trim() ||
		name !== (client.name ?? "") ||
		uri !== (client.uri ?? "") ||
		skipConsent !== client.skipConsent ||
		disabled !== client.disabled;

	async function handleSave() {
		setSaving(true);
		setMessage(null);
		setError(null);
		const redirectUris = redirectInput
			.split(/[\n,]+/)
			.map((s) => s.trim())
			.filter(Boolean);
		const postLogoutRedirectUris = postLogoutInput
			.split(/[\n,]+/)
			.map((s) => s.trim())
			.filter(Boolean);
		try {
			await update({
				data: {
					id: client.id,
					name,
					uri,
					redirectUris,
					postLogoutRedirectUris,
					skipConsent,
					disabled,
				},
			});
			setMessage("Saved");
			onChanged();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete() {
		if (!confirm(`Delete client "${client.name ?? client.clientId}"? This cannot be undone.`)) return;
		try {
			await remove({ data: { id: client.id } });
			onChanged();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Delete failed");
		}
	}

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<h3 className="font-semibold">{client.name ?? "(unnamed)"}</h3>
					<p className="mt-1 font-mono text-xs break-all text-gray-500">{client.clientId}</p>
					<div className="mt-1 flex flex-wrap gap-2 text-xs">
						{client.public && <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-800">public</span>}
						{client.disabled && <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">disabled</span>}
						{client.skipConsent && <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-800">skip-consent</span>}
					</div>
				</div>
				<Button variant="outline" size="sm" onClick={handleDelete}>
					Delete
				</Button>
			</div>

			<div className="mt-4 grid gap-4 sm:grid-cols-2">
				<div className="space-y-1">
					<Label>Name</Label>
					<Input value={name} onChange={(e) => setName(e.target.value)} />
				</div>
				<div className="space-y-1">
					<Label>Client URI</Label>
					<Input value={uri} onChange={(e) => setUri(e.target.value)} placeholder="https://example.com" />
				</div>
			</div>

			<div className="mt-4 space-y-1">
				<Label>Redirect URIs</Label>
				<textarea
					value={redirectInput}
					onChange={(e) => setRedirectInput(e.target.value)}
					rows={Math.max(2, redirectInput.split("\n").length)}
					className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
				/>
				<p className="text-xs text-gray-500">One URL per line.</p>
			</div>

			<div className="mt-4 space-y-1">
				<Label>Post-logout redirect URIs</Label>
				<textarea
					value={postLogoutInput}
					onChange={(e) => setPostLogoutInput(e.target.value)}
					rows={Math.max(2, postLogoutInput.split("\n").length || 2)}
					placeholder="https://example.com/logged-out"
					className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
				/>
				<p className="text-xs text-gray-500">Used by the RP-initiated logout flow. Leave empty to disable.</p>
			</div>

			<div className="mt-3 flex flex-wrap gap-4">
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={skipConsent} onChange={(e) => setSkipConsent(e.target.checked)} />
					Skip consent
				</label>
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
					Disabled
				</label>
			</div>

			{error && <p className="mt-2 text-sm text-red-600">{error}</p>}
			{message && <p className="mt-2 text-sm text-green-700">{message}</p>}

			<div className="mt-4">
				<Button onClick={handleSave} disabled={!dirty || saving}>
					{saving ? "Saving…" : "Save changes"}
				</Button>
			</div>
		</div>
	);
}
