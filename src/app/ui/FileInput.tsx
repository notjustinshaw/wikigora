/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from "react";

type Props = Readonly<{
	"data-test-id"?: string;
	accept?: string;
	label: string;
	onChange: (files: FileList | null) => void;
}>;

export default function FileInput({
	accept,
	label,
	onChange,
	"data-test-id": dataTestId,
}: Props): JSX.Element {
	return (
		<div className='flex flex-row items-center mb-10'>
			<label className='flex-1 text-gray-600'>{label}</label>
			<input
				type='file'
				accept={accept}
				className='flex-2 border border-gray-300 py-2 px-4 text-base rounded-md min-w-0'
				onChange={(e) => onChange(e.target.files)}
				data-test-id={dataTestId}
			/>
		</div>
	);
}
