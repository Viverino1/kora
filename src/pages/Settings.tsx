import React from 'react';
import Button from '../components/Button';
import { cache } from '../services/cache';

export default function Settings() {
  return (
    <div className="p-4">
      <Button onClick={cache.clear}>CLEAR</Button>
    </div>
  );
}
