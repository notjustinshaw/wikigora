/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import cx from "classnames";
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable";

export default function ContentEditable(): JSX.Element {
	return (
		<LexicalContentEditable
			className={cx(
				"flex-1 w-full p-4 lg:p-8 text-lg diagonal-fractions resize-none caret-neutral-900 dark:caret-neutral-400 relative outline-none max-w-5xl h-full",
				"prose prose-neutral prose-lg dark:prose-invert prose-headings:font-display prose-headings:tracking-wide",
				"prose-p:ios-select-none prose-ul:ios-select-none prose-ol:ios-select-none",
				"prose-p:text-black prose-ul:text-black prose-ol:text-black dark:prose-p:text-white dark:prose-ul:text-white dark:prose-ol:text-white",
				"prose-a:no-underline hover:prose-a:underline hover:prose-a:cursor-pointer prose-a:text-blue-700 dark:prose-a:text-blue-500"
			)}
		/>
	);
}
