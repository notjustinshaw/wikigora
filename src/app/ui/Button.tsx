/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import {ReactNode} from 'react';

import cx from 'classnames';

export default function Button({
  'data-test-id': dataTestId,
  children,
  className,
  onClick,
  disabled,
  small,
  title,
}: {
  'data-test-id'?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  small?: boolean;
  title?: string;
}): JSX.Element {
  return (
    <button
      disabled={disabled}
      className={cx(
        'py-2 px-4 border-0 bg-gray-200 rounded-md cursor-pointer text-base',
        small && 'py-1 px-2 border-0 bg-gray-200 rounded-md text-sm',
        disabled && 'py-2 px-4 border-0 bg-gray-200 rounded-md cursor-not-allowed opacity-50',
        className,
      )}
      onClick={onClick}
      title={title}
      aria-label={title}
      {...(dataTestId && {'data-test-id': dataTestId})}>
      {children}
    </button>
  );
}
