import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { SEED_USERS, SEED_PASSWORD, INSTITUTIONS, ROLES, type SeedUser, type UserRole } from "#/db/seed-data";

export const Route = createFileRoute("/sign-in")({
	ssr: false,
	component: SignIn,
});

function continueOAuthFlowIfPending(): boolean {
	if (typeof window === "undefined") return false;
	const search = window.location.search;
	// Better Auth's oauth-provider forwards signed params (sig, exp) when it
	// redirects to the loginPage. Forward them back to /oauth2/authorize so it
	// can resume the flow and redirect directly to the client app.
	if (!search || !search.includes("sig=")) return false;
	window.location.href = `/api/auth/oauth2/authorize${search}`;
	return true;
}

const ROLE_LABELS: Record<UserRole, string> = {
	student: "Student",
	teacher: "Teacher",
	faculty: "Faculty",
	admin: "Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
	student: "bg-blue-100 text-blue-800",
	teacher: "bg-green-100 text-green-800",
	faculty: "bg-purple-100 text-purple-800",
	admin: "bg-orange-100 text-orange-800",
};

function SignIn() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSignUp, setIsSignUp] = useState(false);
	const [loading, setLoading] = useState(false);
	const [helpOpen, setHelpOpen] = useState(false);

	const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
	const [institutionFilter, setInstitutionFilter] = useState<string>("all");

	const filteredUsers = useMemo(() => {
		return SEED_USERS.filter((u) => {
			if (roleFilter !== "all" && u.role !== roleFilter) return false;
			if (institutionFilter !== "all" && u.institution !== institutionFilter) return false;
			return true;
		});
	}, [roleFilter, institutionFilter]);

	async function handleSignIn(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const { error } = await authClient.signIn.email({
				email,
				password,
			});

			if (error) {
				setError(error.message ?? "Sign in failed");
			} else if (!continueOAuthFlowIfPending()) {
				navigate({ to: "/" });
			}
		} catch {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	async function handleSignUp(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const { error } = await authClient.signUp.email({
				email,
				password,
				name,
			});

			if (error) {
				setError(error.message ?? "Sign up failed");
			} else if (!continueOAuthFlowIfPending()) {
				navigate({ to: "/" });
			}
		} catch {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	async function quickLogin(user: SeedUser) {
		setError(null);
		setLoading(true);
		try {
			const { error } = await authClient.signIn.email({
				email: user.email,
				password: SEED_PASSWORD,
			});
			if (error) {
				setError(error.message ?? "Quick login failed");
			} else if (!continueOAuthFlowIfPending()) {
				navigate({ to: "/" });
			}
		} catch {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-start gap-6 bg-[#c8d3e6] px-4 py-12">
			{/* ── Login card ─────────────────────────────────────────── */}
			<div className="w-full max-w-lg rounded-lg bg-white shadow-md">
				<div className="p-8 pb-0">
					<h1 className="text-2xl font-bold text-gray-900">Log in with FakeFeide</h1>

					<div className="mt-4 flex items-center gap-3">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1f4698]">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="white"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="h-6 w-6"
							>
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
							</svg>
						</div>
						<p className="text-sm text-gray-700">You need to log in via FakeFeide to access this service.</p>
					</div>

					<hr className="mt-4 border-gray-300" />

					<div className="mt-4">
						<p className="text-sm font-medium text-gray-600">Your affiliation</p>
						<div className="mt-2 flex items-center gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#1f4698]">
								<span className="text-xs font-bold text-white">FF</span>
							</div>
							<div>
								<p className="text-sm font-semibold text-gray-900">FakeFeide</p>
								<button type="button" className="text-sm text-[#1f4698] underline">
									Change affiliation
								</button>
							</div>
						</div>
					</div>

					<hr className="mt-4 border-gray-300" />
				</div>

				<form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4 p-8 pt-4">
					{isSignUp && (
						<div className="space-y-1">
							<Label htmlFor="name" className="text-sm text-gray-700">
								Name
							</Label>
							<Input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
								required
								className="border-gray-300"
							/>
						</div>
					)}

					<div className="space-y-1">
						<Label htmlFor="email" className="text-sm text-gray-700">
							Email
						</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							required
							className="border-gray-300"
						/>
					</div>

					<div className="space-y-1">
						<Label htmlFor="password" className="text-sm text-gray-700">
							Password
						</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							required
							className="border-gray-300"
						/>
					</div>

					{error && <p className="text-sm text-red-600">{error}</p>}

					<Button type="submit" className="w-full bg-[#1f4698] hover:bg-[#183a80]" disabled={loading}>
						{loading ? "Loading..." : isSignUp ? "Create account" : "Log in"}
					</Button>

					<p className="text-center text-sm text-gray-500">
						{isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
						<button
							type="button"
							onClick={() => {
								setIsSignUp(!isSignUp);
								setError(null);
							}}
							className="text-[#1f4698] underline"
						>
							{isSignUp ? "Log in" : "Sign up"}
						</button>
					</p>
				</form>

				<div className="px-8 pb-2">
					<hr className="border-gray-300" />
					<button
						type="button"
						onClick={() => setHelpOpen(!helpOpen)}
						className="flex w-full items-center justify-between py-3 text-sm text-gray-700"
					>
						<span>Do you need help?</span>
						<span className="text-xl text-[#1f4698]">{helpOpen ? "\u2212" : "+"}</span>
					</button>
					{helpOpen && (
						<p className="pb-3 text-sm text-gray-600">
							This is a fake Feide login page for testing purposes. Enter any email and password to sign in, or create a
							new account.
						</p>
					)}
				</div>

				<div className="px-8 pb-4">
					<a href="#" className="text-sm text-[#1f4698] underline">
						Privacy and cookie information
					</a>
				</div>

				<div className="rounded-b-lg bg-[#e8ecf2] py-4 text-center text-sm text-gray-500">
					FakeFeide is not delivered by Sikt
				</div>
			</div>

			{/* ── Quick login card ───────────────────────────────────── */}
			<div className="w-full max-w-lg rounded-lg bg-white shadow-md">
				<div className="border-b border-gray-200 p-6 pb-4">
					<h2 className="text-lg font-bold text-gray-900">Quick login</h2>
					<p className="mt-1 text-sm text-gray-500">
						Sign in instantly as a test user (password:{" "}
						<code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{SEED_PASSWORD}</code>)
					</p>
				</div>

				{/* Filters */}
				<div className="flex flex-wrap gap-3 border-b border-gray-200 px-6 py-4">
					<div className="space-y-1">
						<Label className="text-xs text-gray-500">Role</Label>
						<select
							value={roleFilter}
							onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
							className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
						>
							<option value="all">All roles</option>
							{ROLES.map((r) => (
								<option key={r} value={r}>
									{ROLE_LABELS[r]}
								</option>
							))}
						</select>
					</div>
					<div className="min-w-0 flex-1 space-y-1">
						<Label className="text-xs text-gray-500">Institution</Label>
						<select
							value={institutionFilter}
							onChange={(e) => setInstitutionFilter(e.target.value)}
							className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900"
						>
							<option value="all">All institutions</option>
							{INSTITUTIONS.map((i) => (
								<option key={i} value={i}>
									{i}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* User list */}
				<div className="divide-y divide-gray-100 px-6">
					{filteredUsers.length === 0 && (
						<p className="py-6 text-center text-sm text-gray-400">No users match the selected filters.</p>
					)}
					{filteredUsers.map((u) => (
						<button
							key={u.key}
							type="button"
							disabled={loading}
							onClick={() => quickLogin(u)}
							className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
						>
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f4698] text-sm font-semibold text-white">
								{u.name
									.split(" ")
									.map((n) => n[0])
									.join("")}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
								<p className="truncate text-xs text-gray-500">{u.email}</p>
								<p className="truncate text-xs text-gray-400">
									{u.institution}
									{u.detail && <> &middot; {u.detail}</>}
								</p>
							</div>
							<span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role]}`}>
								{ROLE_LABELS[u.role]}
							</span>
						</button>
					))}
				</div>

				<div className="rounded-b-lg bg-[#e8ecf2] py-3 text-center text-xs text-gray-400">
					{filteredUsers.length} of {SEED_USERS.length} test accounts
				</div>
			</div>
		</main>
	);
}
