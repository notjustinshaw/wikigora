/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from "react";
import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

function PortalImpl({
	onClose,
	children,
	title,
	closeOnClickOutside,
}: {
	children: ReactNode;
	closeOnClickOutside: boolean;
	onClose: () => void;
	title: string;
}) {
	const modalRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (modalRef.current !== null) {
			modalRef.current.focus();
		}
	}, []);

	useEffect(() => {
		let modalOverlayElement: HTMLElement | null = null;
		const handler = (event: KeyboardEvent) => {
			if (event.keyCode === 27) {
				onClose();
			}
		};
		const clickOutsideHandler = (event: MouseEvent) => {
			const target = event.target;
			if (
				modalRef.current !== null &&
				!modalRef.current.contains(target as Node) &&
				closeOnClickOutside
			) {
				onClose();
			}
		};
		const modelElement = modalRef.current;
		if (modelElement !== null) {
			modalOverlayElement = modelElement.parentElement;
			if (modalOverlayElement !== null) {
				modalOverlayElement.addEventListener("click", clickOutsideHandler);
			}
		}

		window.addEventListener("keydown", handler);

		return () => {
			window.removeEventListener("keydown", handler);
			if (modalOverlayElement !== null) {
				modalOverlayElement?.removeEventListener("click", clickOutsideHandler);
			}
		};
	}, [closeOnClickOutside, onClose]);

	return (
		<div className='fixed inset-0 top-0 bottom-0 left-0 right-0 flex flex-col flex-grow-0 flex-shrink items-center justify-center bg-gray-900 bg-opacity-60 z-50' role='dialog'>
			<div className='p-5 min-h-100 min-w-300 flex bg-white flex-col relative shadow-md rounded-lg' tabIndex={-1} ref={modalRef}>
				<h2 className='text-gray-700 mb-0 pb-3 border-b border-gray-300'>{title}</h2>
				<button
					className='absolute right-5 top-5 border-0 rounded-full flex justify-center items-center w-8 h-8 text-center cursor-pointer bg-gray-200 hover:bg-gray-300'
					aria-label='Close modal'
					type='button'
					onClick={onClose}>
					X
				</button>
				<div className='pt-5'>{children}</div>
			</div>
		</div>
	);
}

export default function Modal({
	onClose,
	children,
	title,
	closeOnClickOutside = false,
}: {
	children: ReactNode;
	closeOnClickOutside?: boolean;
	onClose: () => void;
	title: string;
}): JSX.Element {
	return createPortal(
		<PortalImpl
			onClose={onClose}
			title={title}
			closeOnClickOutside={closeOnClickOutside}>
			{children}
		</PortalImpl>,
		document.body
	);
}
