import React from 'react';
import Button from '../components/Button';
import { cache } from '../services/cache';
import { auth } from '../providors/AuthProvidor';

export default function Settings() {
  return (
    <div className="p-4 flex flex-col gap-4 w-fit">
      <Button onClick={cache.clear}>CLEAR</Button>
      <Button onClick={auth.signOut}>Sign Out</Button>
    </div>
  );
}
