'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemoryFileEditor } from '@/components/MemoryFileEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function FilesContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'CEO';
  const roleUpper = role.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{roleUpper} Files</h1>
          <p className="text-slate-400">Edit agent memory and configuration files</p>
        </div>
      </div>

      <MemoryFileEditor role={roleUpper} />
    </div>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading...</div>}>
      <FilesContent />
    </Suspense>
  );
}
