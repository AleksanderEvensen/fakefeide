import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	ssr: false,
	component: About,
});

function About() {
	return (
		<main className="page-wrap px-4 py-12">
			<section className="island-shell rounded-2xl p-6 sm:p-8"></section>
		</main>
	);
}
