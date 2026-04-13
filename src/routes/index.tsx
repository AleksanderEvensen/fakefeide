import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<p className="mb-8 max-w-2xl text-base sm:text-lg">
				This base starter intentionally keeps things light: two routes, clean structure, and the essentials you need to
				build from scratch.
			</p>

			<ul className="m-0 space-y-2 pl-5 text-sm ">
				<li>
					Edit <code>src/routes/index.tsx</code> to customize the home page.
				</li>
				<li>
					Update <code>src/components/Header.tsx</code> and <code>src/components/Footer.tsx</code> for brand links.
				</li>
				<li>
					Add routes in <code>src/routes</code> and tweak visual tokens in <code>src/styles.css</code>.
				</li>
			</ul>
		</main>
	);
}
