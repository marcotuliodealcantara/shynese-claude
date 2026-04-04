import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FloatingAddCharacterButton() {
  return (
    <Button
      asChild
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
      aria-label="Add new character"
    >
      <Link to="/manage?add=1">
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </Link>
    </Button>
  );
}
