/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import * as React from "react";
import { useCallback, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import Button from "../ui/Button";
import KatexRenderer from "./KatexRenderer";

type Props = {
	initialEquation?: string;
	onConfirm: (equation: string, inline: boolean) => void;
};

export default function KatexEquationAlterer({
	onConfirm,
	initialEquation = "",
}: Props): JSX.Element {
	const [editor] = useLexicalComposerContext();
	const [equation, setEquation] = useState<string>(initialEquation);
	const [inline, setInline] = useState<boolean>(true);

	const onClick = useCallback(() => {
		onConfirm(equation, inline);
	}, [onConfirm, equation, inline]);

	const onCheckboxChange = useCallback(() => {
		setInline(!inline);
	}, [setInline, inline]);

	return (
		<>
			<div className='flex flex-row items-center mt-4 mb-4 justify-between'>
				Inline
				<input type='checkbox' checked={inline} onChange={onCheckboxChange} />
			</div>
			<div className='flex flex-row items-center mt-4 mb-4'>Equation </div>
			<div className='flex flex-row items-center mt-4 mb-4 justify-center'>
				{inline ? (
					<input
						onChange={(event) => {
							setEquation(event.target.value);
						}}
						value={equation}
						className='w-full resize-none p-2'
					/>
				) : (
					<textarea
						onChange={(event) => {
							setEquation(event.target.value);
						}}
						value={equation}
						className='w-full resize-none p-2'></textarea>
				)}
			</div>
			<div className='flex flex-row items-center mt-4 mb-4'>
				Visualization{" "}
			</div>
			<div className='flex flex-row items-center mt-4 mb-4 justify-center'>
				<ErrorBoundary onError={(e) => editor._onError(e)} fallback={null}>
					<KatexRenderer
						equation={equation}
						inline={false}
						onDoubleClick={() => null}
					/>
				</ErrorBoundary>
			</div>
			<div className='flex flex-row items-center mt-8 mb-0 justify-end'>
				<Button onClick={onClick}>Confirm</Button>
			</div>
		</>
	);
}
