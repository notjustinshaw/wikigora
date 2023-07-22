"use client";

import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./ui/Editor"), {
	ssr: false,
});

export default function App() {
	return <Editor />;
}
