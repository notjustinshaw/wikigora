import { HeadingNode } from "@lexical/rich-text";
import { $getRoot, LexicalNode } from "lexical";

export class SectionHeadingNode extends HeadingNode {
	static getType() {
		return "sticky-heading";
	}

	// TODO export import JSON

	static clone(node: any) {
		return new SectionHeadingNode(node.getTag());
	}

	// do not remove node if it is the first child of root
	remove(preserveEmptyParent?: boolean | undefined): void {
		const root = $getRoot();
		const first = root.getFirstChildOrThrow();
		console.log(super.getTag(), first.getKey(), this.getKey());
		if ($getRoot().getFirstChild()?.getKey() !== this.getKey()) {
			super.remove(preserveEmptyParent);
		}
	}

	// do not replace node if it is the first child of root
	replace<N extends LexicalNode>(
		replaceWith: N,
		includeChildren?: boolean | undefined
	): N {
		const root = $getRoot();
		const first = root.getFirstChildOrThrow();
		console.log(super.getTag(), first.getKey(), this.getKey());
		if ($getRoot().getFirstChild()?.getKey() !== this.getKey()) {
			return super.replace(replaceWith, includeChildren);
		}
		return this as unknown as N;
	}
}
