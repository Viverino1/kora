import React from 'react';
import Button from '../components/Button';
import { auth } from '../providors/AuthProvidor';

//TODO: make this button look like a continueWithGoogle button
export default function Auth(): React.JSX.Element {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="h-[12vh] flex items-center justify-center overflow-clip select-none">
        <h1 className="text-text-light font-extrabold !text-[16vh] -translate-y-[.55vh]">Kora</h1>
      </div>
      <p className="text-[1.75vh] select-none pt-[1vh]">The best anime experience.</p>
      <div className="flex space-x-4 mt-4">
        <Button variant="secondary" onClick={() => auth.continueWithGoogle()}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
