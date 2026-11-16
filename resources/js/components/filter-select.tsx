import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    options: { value: string; label: string }[];
    className?: string;
}

export function FilterSelect({ value, onChange, placeholder = 'Semua', options, className }: FilterSelectProps) {
    return (
        <Select value={value || 'all'} onValueChange={(next) => onChange(next === 'all' ? '' : next)}>
            <SelectTrigger className={className ?? 'w-[170px]'}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{placeholder}</SelectItem>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
