import React from 'react';
import loadable from '@loadable/component';

const FundiesLinter = loadable(() => import('./fundiesLinter'));

export default function FundiesLinterLoadable() {
  return (
    <>
      <FundiesLinter />
    </>
  );
}
