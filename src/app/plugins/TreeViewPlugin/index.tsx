"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TreeView } from "@lexical/react/LexicalTreeView";

export default function TreeViewPlugin() {
	const [editor] = useLexicalComposerContext();
	return (
		<TreeView
			viewClassName='relative block bg-neutral-800 text-white p-1 text-xs/3 overflow-auto whitespace-pre-wrap'
			timeTravelPanelClassName='overflow-hidden pb-2 m-auto flex gap-2'
			timeTravelButtonClassName='p-0 border-0 absolute top-2 right-4 flex flex-1 text-white font-lg hover:underline'
			timeTravelPanelSliderClassName='px-4 w-full'
			timeTravelPanelButtonClassName='p-0 border-0 flex flex-1 text-white font-lg hover:underline'
			treeTypeButtonClassName=''
			editor={editor}
		/>
	);
}
