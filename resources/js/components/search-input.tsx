import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
    value: string;
    onSubmit: (value: string) => void;
    placeholder?: string;
}

export function SearchInput({ value, onSubmit, placeholder = 'Cari...' }: SearchInputProps) {
    const [term, setTerm] = useState(value);

    useEffect(() => setTerm(value), [value]);

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit(term);
            }}
            className="relative w-full max-w-sm"
        >
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={placeholder}
                className="pr-8 pl-8"
            />
        </form>
    );
}
