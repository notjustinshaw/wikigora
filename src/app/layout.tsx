import "./styles/tailwind.css";
import { cal, inter } from "@/app/styles/fonts";

export const metadata = {
	title: "Rewrite",
	description: "A collaborative lexical editor styled with tailwind.",
};

function cx(...classes: any[]) {
	return classes.filter(Boolean).join(" ");
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body
				className={cx(
					cal.variable,
					inter.className,
					"m-0 bg-white dark:bg-black font-medium antialiased",
					"flex flex-col justify-start items-center w-full min-h-screen",
					"scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-thumb-rounded-md scrollbar-track-rounded-md dark:border-neutral-700 dark:bg-neutral-950 dark:scrollbar-thumb-neutral-800"
				)}>
				{children}
			</body>
		</html>
	);
}
